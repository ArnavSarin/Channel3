import asyncio
import json
import logging
import os
from functools import lru_cache
from typing import Any, TypeVar

from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic import BaseModel
from models import Price, Variant

load_dotenv()

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Prices per million tokens
MODEL_PRICES: dict[str, dict[str, float]] = {
    # Google models
    "google/gemini-2.0-flash-lite-001": {"input": 0.075, "output": 0.30},
    "google/gemini-2.5-flash-lite": {"input": 0.10, "output": 0.40},
    "google/gemini-3-flash-preview": {"input": 0.50, "output": 3.00},
    "google/gemini-3-pro-preview": {"input": 2.00, "output": 12.00},
    # OpenAI models
    "openai/gpt-5": {"input": 1.25, "output": 10.00},
    "openai/gpt-5-mini": {"input": 0.25, "output": 2.00},
    "openai/gpt-5-nano": {"input": 0.05, "output": 0.40},
    "openai/gpt-5.6-luna": {"input": 0.20, "output": 1.20},
    # Feel free to add more models here
}

T = TypeVar("T", bound=BaseModel)


class ProductExtraction(BaseModel):
    """AI extraction shape before local taxonomy validation."""
    name: str
    price: Price | None = None
    description: str
    key_features: list[str]
    image_urls: list[str]
    video_url: str | None = None
    category: str | None = None
    brand: str
    colors: list[str]
    variants: list[Variant]


PRODUCT_EXTRACTION_PROMPT = """Extract the main ecommerce product from the supplied HTML evidence.
Return only a Product JSON object. Preserve relationships between headings and their content.
Extract all supported fields, including clean individual features and selectable Variant objects.
Return colors as a flat list of distinct readable color names. Every variant must contain only
name, size, price, availability, sku, and mpn; use null for an unavailability variant field.
Use nearby product context, structured records, breadcrumbs, labels, and application state to infer
values when the page does not expose a clean field directly. Prefer a well-supported value over
null, including the closest exact Google Product Taxonomy category supported by the product name
and description. Ignore navigation, tracking, recommendations, shipping, and unrelated products.
Use null only when no reasonable evidence exists, and never invent brands, prices, SKUs, or options.

HTML evidence:
{evidence}
"""


async def extract_product_from_evidence(evidence: str, model: str = "openai/gpt-5.6-luna") -> ProductExtraction:
    """Extract Product fields with bounded retries and a JSON fallback."""
    prompt = PRODUCT_EXTRACTION_PROMPT.format(evidence=evidence)
    last_error = None
    for attempt in range(2):
        try:
            return await asyncio.wait_for(
                responses(model, prompt, text_format=ProductExtraction, max_output_tokens=2500),
                timeout=30,
            )
        except Exception as error:
            last_error = error
            if attempt < 2:
                await asyncio.sleep(2 ** attempt)

    try:
        response = await asyncio.wait_for(
            responses(model, prompt, max_output_tokens=2500),
            timeout=30,
        )
        raw_json = response.output_text.strip()
        if raw_json.startswith("```"):
            raw_json = raw_json.strip("`").removeprefix("json").strip()
        return ProductExtraction.model_validate(json.loads(raw_json))
    except Exception as fallback_error:
        raise RuntimeError("AI product extraction failed after retries and JSON fallback") from (fallback_error or last_error)


@lru_cache
def _get_client() -> AsyncOpenAI:
    """Get cached AsyncOpenAI client configured for OpenRouter."""
    api_key = os.environ.get("OPEN_ROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPEN_ROUTER_API_KEY not found in environment")
    return AsyncOpenAI(base_url=OPENROUTER_BASE_URL, api_key=api_key)


def _log_usage(response) -> None:
    """Log token usage and cost extrapolation for 1M queries."""
    usage = getattr(response, "usage", None)
    if usage is None:
        logger.warning("No usage data in response")
        return

    model = getattr(response, "model", "unknown")
    input_tokens = getattr(usage, "input_tokens", 0)
    output_tokens = getattr(usage, "output_tokens", 0)

    # Handle reasoning tokens (may be in output_tokens_details)
    reasoning_tokens = 0
    output_details = getattr(usage, "output_tokens_details", None)
    if output_details:
        reasoning_tokens = getattr(output_details, "reasoning_tokens", 0) or 0

    # Get prices (default to 0 if model unknown)
    prices = MODEL_PRICES.get(model, {"input": 0, "output": 0})
    input_price = prices["input"]
    output_price = prices["output"]  # Also used for reasoning

    # Calculate cost for this single query
    single_input_cost = (input_tokens / 1_000_000) * input_price
    single_output_cost = (output_tokens / 1_000_000) * output_price
    single_reasoning_cost = (reasoning_tokens / 1_000_000) * output_price
    single_total = single_input_cost + single_output_cost + single_reasoning_cost

    # Extrapolate to 1M queries
    million_cost = single_total * 1_000_000

    logger.info(
        f"Token usage for {model}: "
        f"input={input_tokens}, output={output_tokens}, reasoning={reasoning_tokens} | "
        f"This query: ${single_total:.6f} | "
        f"1M queries: ${million_cost:,.2f} | "
        f"10M queries: ${million_cost * 10:,.2f}"
    )


async def responses(
    model: str,
    input: str | list,
    text_format: type[T] | None = None,
    **kwargs,
) -> T | Any:
    """
    Call OpenRouter responses API with automatic token usage logging.

    OpenAI Responses API: https://platform.openai.com/docs/api-reference/responses

    @dev: The intention of this function is to be used as a wrapper around the OpenAI Responses API,
    so the developer can view token usage and cost extrapolation of each query. If this
    abstraction becomes cumbersome, you may remove it, but it is recommended to observe your token usage.
    """
    client = _get_client()

    if text_format is not None:
        # Use .parse() for Pydantic structured output
        response = await client.responses.parse(
            model=model,
            input=input,
            text_format=text_format,
            **kwargs,
        )
        _log_usage(response)
        return response.output_parsed
    else:
        # Use .create() for regular responses
        response = await client.responses.create(
            model=model,
            input=input,
            **kwargs,
        )
        _log_usage(response)
        return response
