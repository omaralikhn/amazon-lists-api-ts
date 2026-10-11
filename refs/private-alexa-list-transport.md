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

## Change guide

* Preserve the **request shape** and pagination behavior when adding write operations or another marketplace option.
* Extend `src/parser.ts` and the **contract tests** together whenever Amazon adds a list or item field that the public API exposes.
* Add authentication only as a **separate adapter** so the core library remains free of credential storage.

## Limits

* This release has **no login flow, credential storage, CLI, or write operations**.
* The **endpoint shapes** come from [`pyalexatodo`](https://github.com/lonlazer/pyalexatodo) and local contract tests, not a live Amazon-account check.
