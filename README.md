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

## Local authentication proof

Run the proof on a user-controlled Mac to create or refresh a local Amazon session, then read the Alexa `SHOP` list twice.

```bash
npm run proof:auth
```

On the first run, open the loopback URL printed as `OPEN_BROWSER`, then complete Amazon sign-in and any required challenge locally. The script persists the registered-device session at `~/.config/amazon-lists-api-ts/proof-session.json` under a mode-`0700` directory with mode `0600` on the file. Later runs refresh that state without browser sign-in when Amazon accepts the registration.

Keep that file outside source control and logs. Delete it and revoke the **Amazon Lists Proof** device in Amazon when rotating or revoking access. The script reports list types only and never prints session data, list items, passwords, MFA codes, or TOTP seeds.

Amazon can require CAPTCHA, device approval, or another MFA method at any time. The proof stops on those failures and does not retry automatically.

## Development

```bash
npm install
npm run check
npm run check:ci
```

`npm run check` formats the source, then runs linting, compilation, and coverage tests in parallel. `npm run check:ci` also checks for dead files, exports, and dependencies.

## License

[PolyForm Strict 1.0.0](LICENSE).
