from pathlib import Path
import re
import asyncio
import json
import logging
from difflib import SequenceMatcher
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from ai import extract_product_from_evidence
from models import Brand, Category, ProductDetail, VALID_CATEGORIES
from parsing import read_file

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

Limit = Annotated[int, Query(ge=1, le=100)]
Offset = Annotated[int, Query(ge=0)]


async def extract_products() -> list[ProductDetail]:
    """Extract each fixture with AI using reduced product context."""
    products = []
    seen_products = set()
    for html_file in sorted((Path(__file__).parent / "data").glob("*.html")):
        try:
            logger.info("Extracting %s", html_file.name)
            evidence = json.dumps(read_file(html_file), ensure_ascii=False)
            extracted = await extract_product_from_evidence(evidence)
            product_data = extracted.model_dump()
            if extracted.category:
                category_value = extracted.category.strip()
                while category_value and category_value not in VALID_CATEGORIES:
                    category_value = category_value.rsplit(" > ", 1)[0] if " > " in category_value else ""
                if not category_value and extracted.category:
                    category_value = closest_category(extracted.category)
                if category_value:
                    product_data["category"] = Category(name=category_value)
                else:
                    logger.warning("Unrecognized category for %s: %s", html_file.name, extracted.category)
                    product_data["category"] = None
            else:
                product_data["category"] = None
            product = ProductDetail(
                id=html_file.stem,
                brand_id=re.sub(r"[^a-z0-9]+", "-", extracted.brand.lower()).strip("-") or "unknown",
                **product_data,
            )
        except Exception:
            logger.exception("Extraction failed for %s", html_file.name)
            continue
        identity = (product.brand_id, re.sub(r"\s+", " ", product.name.casefold()).strip())
        if identity in seen_products:
            continue
        seen_products.add(identity)
        products.append(product)
    return products


def closest_category(value: str) -> str | None:
    """Select a taxonomy entry with the strongest generic text similarity."""
    normalized = re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()
    candidates = []
    source_leaf = normalized.split()[-1] if normalized else ""
    for category in VALID_CATEGORIES:
        candidate = re.sub(r"[^a-z0-9]+", " ", category.casefold()).strip()
        overlap = len(set(normalized.split()) & set(candidate.split()))
        leaf_match = 0.45 if candidate.split()[-1:] == [source_leaf] else 0
        score = SequenceMatcher(None, normalized, candidate).ratio() + overlap * 0.04 + leaf_match
        candidates.append((score, category))
    if not candidates:
        return None
    best_score, best_category = max(candidates)
    return best_category if best_score >= 0.55 else None


def load_products() -> list[ProductDetail]:
    """Load AI-extracted products synchronously during application startup."""
    return asyncio.run(extract_products())

def create_app() -> FastAPI:
    app = FastAPI(title="Product Service")
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
        allow_methods=["GET"],
        allow_headers=["*"],
    )
    app.state.products = []

    @app.on_event("startup")
    async def load_catalog():
        """Start catalog extraction without blocking the HTTP server."""
        app.state.catalog_task = asyncio.create_task(populate_catalog())

    async def populate_catalog():
        """Populate the in-memory catalog while the API remains available."""
        logger.info("AI product extraction started")
        try:
            app.state.products = await extract_products()
            logger.info("AI product extraction complete: %d products loaded", len(app.state.products))
        except Exception:
            logger.exception("AI product extraction failed")

    @app.get("/brands", response_model=list[Brand])
    def list_brands():
        """List all brands alphabetically."""
        grouped = {}
        for product in app.state.products:
            grouped.setdefault(product.brand_id, {"id": product.brand_id, "name": product.brand, "product_count": 0})
            grouped[product.brand_id]["product_count"] += 1
        return sorted((Brand(**brand) for brand in grouped.values()), key=lambda brand: brand.name.lower())

    @app.get("/brands/{brand_id}/products", response_model=list[ProductDetail], response_model_exclude_none=True)
    def list_products(brand_id: str, limit: Limit = 100, offset: Offset = 0):
        """List a brand's products, up to 100 at a time, starting at offset."""
        matches = [product for product in app.state.products if product.brand_id == brand_id]
        return matches[offset:offset + limit]

    @app.get("/products/{product_name:path}", response_model=ProductDetail, response_model_exclude_none=True)
    def get_product(product_name: str):
        """Return all product fields, including image URLs, video and variants."""
        normalized_name = re.sub(r"[^a-z0-9]+", " ", product_name.casefold()).strip()
        product = next((item for item in app.state.products
                        if re.sub(r"[^a-z0-9]+", " ", item.name.casefold()).strip() == normalized_name), None)
        if product is None:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
