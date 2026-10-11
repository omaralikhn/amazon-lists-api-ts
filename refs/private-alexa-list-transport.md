---
title: Private Alexa list transport
tags:
  - amazon
  - alexa
  - lists
  - shopping
  - todo
  - custom
  - private
  - endpoint
  - fetch
  - cookies
  - authentication
  - session
  - proof
---

`src/client.ts` implements the read-only Amazon Alexa shopping-list transport for this repository.

## Why

* The **typed library boundary** lets callers inspect Alexa lists without adopting a full automation platform.
* The **response parser** prevents undocumented Amazon payload changes from becoming silently wrong list data.

## Protocol

* `fetchLists()` sends a **POST request** to `/alexashoppinglists/api/v2/lists/fetch` with `{}` as the JSON body.
* `fetchListItems(listId)` sends a **POST request** to `/alexashoppinglists/api/v2/lists/<listId>/items/fetch?limit=100`.
* Later item pages include the returned **`nextToken`** in the POST JSON body until Amazon omits or nulls it.
* The client encodes a supplied **list ID** as a URL path component before requesting its items.

## Authentication and privacy

* The client accepts **caller-owned headers** and a caller-provided `fetch` implementation rather than logging in or persisting credentials.
* A caller may supply a short-lived **Amazon session cookie**, which must stay outside source control and logs.
* Amazon does not document these **private endpoints**, so it can change their behavior without compatibility guarantees.

## Failure behavior

* Non-success HTTP responses raise `AmazonAlexaListsApiError` with the **status, status text, final URL, and response body**.
* Successful responses undergo **strict runtime validation** before becoming exported list or item types.
* `TypeError` rejects **unknown payload values** - list types, item statuses, fields, and unsafe versions - before they become partial data.

## Modules

| Concern | Module |
|---|---|
| Public client and pagination | `src/client.ts` |
| HTTP failure details | `src/error.ts` |
| Untrusted payload validation | `src/parser.ts` |
| Public types and client options | `src/types.ts` |
| Observable protocol and failure tests | `src/__tests__/client.test.ts` |
| Local authentication proof | `scripts/prove-auth.ts` |

## Local session proof

* `npm run proof:auth` uses **`alexa-cookie2` device registration** to establish or refresh a local Amazon session without adding login behavior to the exported list client.
* The first **interactive run** opens a loopback-only proxy, where the user completes Amazon sign-in and any challenge without exposing credentials to the script output.
* A successful registration is saved at **`~/.config/amazon-lists-api-ts/proof-session.json`** in a mode-`0700` directory, with mode `0600` on the state file.
* Later proof runs load the saved **registration state**, refresh it, and fetch the Alexa lists twice without a browser sign-in when Amazon accepts the registration.
* The proof records **list types only** and does not print session data, list items, passwords, MFA codes, or TOTP seeds.

## Change guide

* Preserve the **request shape** and pagination behavior when adding write operations or another marketplace option.
* Extend `src/parser.ts` and the **contract tests** together whenever Amazon adds a list or item field that the public API exposes.
* Add authentication only as a **separate adapter** so the core library remains free of credential storage.

## Limits

* The exported library has **no login flow, credential storage, CLI, or write operations**.
* The repository includes a **local proof script** that persists registered-device session state outside the repository, but it is not part of the published package output.
* The **endpoint shapes** come from [`pyalexatodo`](https://github.com/lonlazer/pyalexatodo), local contract tests, and a live `amazon.com` proof that fetched `SHOP`, `TODO`, and `CUSTOM` list types on 2026-10-11.
