"""Build compact, structure-preserving product evidence from raw HTML."""

import argparse
import json
import re
from pathlib import Path

import extruct
from bs4 import BeautifulSoup, Comment


PRODUCT_KEYS = {
    "name", "title", "description", "brand", "price", "prices", "priceCurrency",
    "currency", "image", "images", "color", "colors", "size", "sizes", "variants",
    "offers", "category", "video", "videos", "productId", "productName", "sku", "options",
    "items", "prices", "availability", "isOutOfStock", "media", "productDetails",
}
REMOVE_TAGS = {"script", "style", "noscript", "template", "svg", "canvas"}
REMOVE_ANCESTORS = re.compile(
    r"(?:^|[\s_-])(nav|footer|header|cookie|consent|breadcrumb|recommend|related|cross.?sell|newsletter|tracking|analytics)(?:$|[\s_-])",
    re.I,
)
KEEP_ATTRIBUTES = {
    "alt", "aria-label", "class", "content", "data-testid", "data-product-id", "href",
    "id", "itemprop", "itemscope", "itemtype", "name", "property", "src", "srcset",
    "value", "type", "title",
}


def extruct_data(html, page_url=""):
    """Extract standards-based JSON-LD and Microdata records."""
    return extruct.extract(
        html,
        base_url=page_url or None,
        syntaxes=["json-ld", "microdata"],
        uniform=True,
    )


def nested_objects(value):
    """Yield dictionaries nested inside an application-state object."""
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from nested_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from nested_objects(child)


def embedded_json(script_text):
    """Decode JSON objects assigned in ordinary script tags."""
    decoder = json.JSONDecoder()
    for match in re.finditer(r"(?:^|[=;])\s*(\{)", script_text or ""):
        try:
            yield decoder.raw_decode(script_text[match.start(1):])[0]
        except (TypeError, ValueError):
            continue


def application_products(page):
    """Keep application-state objects with several product-shaped fields."""
    products = []
    for script in page.find_all("script"):
        if script.get("type") == "application/ld+json":
            continue
        for data in embedded_json(script.string or script.get_text()):
            for value in nested_objects(data):
                matching_keys = PRODUCT_KEYS & value.keys()
                if len(matching_keys) >= 3 and matching_keys & {"name", "title", "productId", "productName", "sku"}:
                    product = {key: value[key] for key in matching_keys}
                    if isinstance(product.get("colors"), list):
                        product["colors"] = [color_name(color) for color in product["colors"]]
                    if isinstance(product.get("variants"), list):
                        product["variants"] = [compact_variant(variant) for variant in product["variants"]]
                    if not product.get("variants") and isinstance(product.get("items"), list):
                        product["variants"] = item_variants(product["items"], product.get("prices", []))
                    products.append(product)
    return products


def color_name(value):
    """Turn a color object into the readable color value sent to extraction."""
    if isinstance(value, dict):
        return value.get("name") or value.get("value") or value.get("label")
    return value


def compact_variant(value):
    """Keep only the six fields supported by the public Variant model."""
    if not isinstance(value, dict):
        return {"name": str(value)}
    options = value.get("options")
    size = value.get("size") or value.get("option2")
    if not size and isinstance(options, list):
        size = next((option for option in options if re.search(r"size|width|fit", str(option), re.I)), None)
    compact = {key: value[key] for key in ("name", "size", "price", "availability", "sku", "mpn")
               if value.get(key) is not None}
    if "availability" not in compact and value.get("available") is not None:
        compact["availability"] = value["available"]
    if "availability" not in compact and value.get("isOutOfStock") is not None:
        compact["availability"] = not value["isOutOfStock"]
    if "sku" not in compact and value.get("id") is not None:
        compact["sku"] = str(value["id"])
    if size:
        compact["size"] = size
    return compact


def item_variants(items, prices):
    """Convert application-state item and price tables into selectable variants."""
    price_by_id = {
        str(price.get("id")): price.get("amount")
        for price in prices or []
        if isinstance(price, dict) and price.get("id") and price.get("amount") is not None
    }
    variants = []
    for item in items:
        if not isinstance(item, dict):
            continue
        item_price = next((price_by_id.get(str(price_id)) for price_id in item.get("priceIds", item.get("prices", []))
                           if str(price_id) in price_by_id), None)
        variants.append(compact_variant({
            "name": item.get("name") or item.get("title"),
            "price": item_price,
            "availability": not item["isOutOfStock"] if "isOutOfStock" in item else None,
            "sku": item.get("sku") or item.get("id"),
            "mpn": item.get("mpn"),
        }))
    return variants


def semantic_html(html):
    """Serialize relevant markup while preserving its nested element structure."""
    page = BeautifulSoup(html, "html.parser")
    for comment in page.find_all(string=lambda value: isinstance(value, Comment)):
        comment.extract()
    for element in page.find_all(REMOVE_TAGS):
        element.decompose()
    for element in page.find_all(True):
        if not element.attrs:
            continue
        labels = " ".join(str(element.get(key, "")) for key in ("id", "class", "role"))
        if element.name in {"nav", "footer", "header", "aside"} or REMOVE_ANCESTORS.search(labels):
            element.decompose()
            continue
        element.attrs = {key: value for key, value in element.attrs.items() if key in KEEP_ATTRIBUTES}
    body = page.body or page
    return body.decode_contents(formatter="minimal")


def relevant_evidence(html, page_url=""):
    """Return structured and semantic evidence suitable for an AI extraction prompt."""
    page = BeautifulSoup(html, "html.parser")
    structured = extruct_data(html, page_url)
    return {
        "structured_data": structured,
        "application_products": application_products(page),
        "semantic_html": semantic_html(html),
    }


def read_file(file_path, page_url=""):
    """Read a saved page and build compact relevant evidence."""
    html = Path(file_path).read_text(encoding="utf-8")
    return relevant_evidence(html, page_url)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("html_file", type=Path)
    parser.add_argument("--url", default="")
    arguments = parser.parse_args()
    print(json.dumps(read_file(arguments.html_file, arguments.url), indent=2, ensure_ascii=False))
