# Channel3 Take-Home

This repository contains an HTML product-ingestion service and a small React catalog/PDP frontend.

## Setup

```bash
python3.12 -m venv .venv
.venv/bin/pip install -e .
```

Add the supplied OpenRouter key to `.env` as `OPEN_ROUTER_API_KEY=your_key_here`.

## Backend

`utils.py` extracts JSON-LD, Microdata, embedded application state, and cleaned semantic HTML. `parsing.py` prepares that evidence, and `ai.py` extracts typed product objects. Categories are validated against `categories.txt`; optional null fields are omitted from API responses; products are deduplicated by brand and normalized name.

Start the service from the repository root:

```bash
.venv/bin/python brandsservice.py
```

API documentation: <http://127.0.0.1:8000/docs>.

- `GET /brands` lists brands and product counts.
- `GET /brands/{brand_id}/products?limit=100&offset=0` lists products for a brand.
- `GET /products/{product_name}` returns one URL-encoded product name.

The catalog is extracted in the background. Wait for `AI product extraction complete: N products loaded` before expecting products from `/brands`.

## Frontend

See [`front-end/README.md`](front-end/README.md).

## System design

In order to scale the system from 5 products to 50 million, I have made assumptions regarding how we get the existing HTML data. It’s likely that we aren’t storing all web-scraped data on our local machines and instead need to store it in blob storage. I have also made the assumption that the server currently handles both CRUD operations for the Product and calls to the OpenAI API, which should likely be separated into different services. HTML parsing should be done in an isolated environment and run in the background. We could set up an SQS queue with a dead-letter queue. We could use retries based on business logic, as well as a back-off coefficient with jitter, to prevent synchronized calls to the workers and allow failed workers to retry. This queue would be responsible for assigning workers URLs as records. Once the worker crawls the page and retrieves the HTML, the HTML could be stored in blob storage, and we could use a NoSQL database to hold URL metadata, including a URL for the webpage, a URL to the HTML data in blob storage, a checksum to validate whether the HTML has changed before refetching the webpage, an ID as the primary key, crawl depth, and the last crawl time. When the checksum changes, the URL can be placed back onto the parsing queue so the product record is refreshed and its price and availability remain current. I would then have a separate set of workers, which I’ll call the OpenAI API workers for this project, retrieve the HTML from blob storage. We could include a flag that determines whether the current HTML has been parsed by a worker. The worker checks whether the HTML has been parsed and, if not, parses the data by first removing extraneous information from the HTML and then running only the required data against the OpenAI prompt. Once the data has been parsed, the flag is set to true in the URL metadata database, and we can store the data in a separate SQL database with product information. A separate Product CRUD worker could process queued catalog updates, while the read API remains stateless. The current assumptions that will not scale are storing the catalog in memory, processing pages sequentially, and coupling extraction directly to the API server. These would need to become distributed, stateless workers with durable storage and independent scaling.

For the frontend, I would likely focus on creating an API set that is AI-accessible via some sort of token. The API could expose endpoints such as `/search`, `/products/{id}`, and `/products/{id}/variants`, returning structured JSON that an AI agent can read without parsing HTML. I’d try to minimize the need for a UI or make it incredibly AI-readable by minimizing the amount of HTML needed, as it might be more effective for an AI to access and retrieve information through a CLI. I could also provide tools that allow AI LLMs to make purchases on behalf of developers with some sort of approval-seeking method.
