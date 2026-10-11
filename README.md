# amazon-lists-api-ts

A TypeScript client for Amazon's private Alexa shopping-list endpoints. It reads Alexa shopping, to-do, and custom lists through a caller-provided authenticated `fetch` implementation or Amazon session cookie.

Amazon does not publish or support these endpoints. They can change or stop working without notice. This package does not collect credentials, log in to Amazon, persist session data, or make write requests.

## Install

```bash
npm install github:omaralikhn/amazon-lists-api-ts
```

## Use

Supply an authenticated request path. `headers` works for a short-lived cookie obtained and managed outside this library. Do not commit cookies or other Amazon credentials.

```ts
import { AmazonAlexaListsClient } from 'amazon-lists-api-ts'

const client = new AmazonAlexaListsClient({
  headers: { Cookie: process.env.AMAZON_SESSION_COOKIE ?? '' },
})

const lists = await client.fetchLists()
const shoppingList = lists.find((list) => list.type === 'SHOP')

if (shoppingList !== undefined) {
  const items = await client.fetchListItems(shoppingList.id)
  console.log(items)
}
```

Set `origin` for another Amazon marketplace, such as `https://www.amazon.co.uk`.

## API

* `fetchLists()` returns **Alexa's lists** for shopping, to-do, and custom entries.
* `fetchListItems(listId)` returns **every item** with its completion status and current version.
* `AmazonAlexaListsApiError` preserves the **source failure** - HTTP status, status text, final URL, and response body.

## Development

```bash
npm install
npm run check
npm run check:ci
```

`npm run check` formats the source, then runs linting, compilation, and coverage tests in parallel. `npm run check:ci` also checks for dead files, exports, and dependencies.

## License

[PolyForm Strict 1.0.0](LICENSE).
