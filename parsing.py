"""Prepare product context by delegating extraction and cleanup to utils."""

import argparse
import json
from pathlib import Path

from utils import relevant_evidence


def product_context(html, page_url=""):
    """Return only the three evidence channels used by the extraction prompt."""
    evidence = relevant_evidence(html, page_url)
    return {
        "structured_data": evidence.get("structured_data", {}),
        "application_products": evidence.get("application_products", []),
        "semantic_html": evidence.get("semantic_html", ""),
    }


def read_file(file_path, page_url=""):
    """Read a saved HTML page and prepare its product context."""
    path = Path(file_path)
    return product_context(path.read_text(encoding="utf-8"), page_url)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("html_file", type=Path)
    parser.add_argument("--url", default="")
    arguments = parser.parse_args()
    print(json.dumps(read_file(arguments.html_file, arguments.url), indent=2, ensure_ascii=False))
