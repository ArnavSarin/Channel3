# Channel3 Catalog Frontend

This React/Next.js frontend displays products returned by the FastAPI service.

## Setup

Install dependencies:

```bash
yarn install
```

Start the backend first from the repository root:

```bash
.venv/bin/python brandsservice.py
```

Then start the frontend:

```bash
yarn run dev
```

Open <http://localhost:3000/productgallery>. The frontend requests `http://127.0.0.1:8000`.

The catalog displays four products per row and up to 100 products per page. Selecting a product opens its detail page with its gallery, description, features, colors, price, and normalized variants. Variant cards show the name and price first, followed by size, SKU, MPN, and availability when present.

For a production build:

```bash
yarn run build
yarn start
```

In order to scale the system from 5products to 50 million. I have made assumptions regarding both how we get the html data that exists. It’s likely that we aren’t storing all web scraped data on our local machines and instead needs to be stored in blob storage. I have also made the assumption that the server currently handles both CRUD Operations for the Product and the calls to the OpenAI API which need to likely be separated in terms of functions. HTML parsing should be done in an isolated environment and be running the background. We could set up a SQS queue with a dead-letter queue. We could use a retry (based on business logic) as well as a back-off coefficient with jitter to prevent synchronized called to the workers and allow workers that fail to retry. This Queue would be responsible for assigning workers with urls as the Record. The worker crawlers would then communicate with the DNS in order to get the IP Addresses of certain sites. These IP Addresses could be held in a local cache with a least recently used policy to prevent multiple fetches from the DNS. Once the worker crawls the page and retrieves the html. The html could be passed into blob storage and we could leverage a database such as a noSQL db to hold the URL metadata, including a URL to the HTML data in the blob storage, checksum (to validate if the HTML has been changed prior to trying to refetch the information from the webpage. We could also include a url for the webpage, id as the primary key, depth (to prevent web crawlers from getting caught in url links) and last crawl time. I would then have a separate set of workers let’s call this the OPEN AI Router workers (this project) that would retrieve information from the blob storage regarding the HTML. We could include a flag that determines if the current HTML has been parsed via the worker. The worker validates if the html has been parsed and if not parses the data by first removing all extraneous information from the HTML data and then running only the required data against the OPEN AI prompt. Once the data has been parsed the flag is set to True in the URL Metadata DB and we can store the data in a separate SQL DB with product information. We can have a separate worker that performs crud operations from the Brand and Product Tables in the SQL DB which retrieves that information to be accessed by the front-end. We could use client-side rendering on the Front-End and have it be served via a lambda. Holding its data in blob storage as well. For the front-end I would likely focus on creating an API Set that is AI accessible via some sort of token. Id try to actually minimize the need for a UI or make it incredibly AI readable (minimize the amount of html needed) in this case as it might be more effective for an AI to try accessing and getting information via a CLI. I could also provide tools that allow AI LLMs to make purchases on behalf of developers with some sort of approval seeking method.
