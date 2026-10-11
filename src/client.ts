import { AmazonAlexaListsApiError } from './error.js'
import { parseAlexaListItems, parseAlexaLists } from './parser.js'
import type { AlexaList, AlexaListItem, AmazonAlexaListsClientOptions, AmazonAlexaListsFetch } from './types.js'

const DEFAULT_ORIGIN = 'https://www.amazon.com'
const MAX_PAGE_SIZE = 100

export class AmazonAlexaListsClient {
  readonly #fetch: AmazonAlexaListsFetch
  readonly #headers: Headers
  readonly #origin: string

  public constructor(options: AmazonAlexaListsClientOptions = {}) {
    this.#fetch = options.fetch ?? globalThis.fetch
    this.#headers = new Headers(options.headers)
    this.#headers.set('content-type', 'application/json')
    this.#origin = new URL(options.origin ?? DEFAULT_ORIGIN).origin
  }

  public async fetchLists(): Promise<readonly AlexaList[]> {
    const payload = await this.request('/alexashoppinglists/api/v2/lists/fetch', {})

    return parseAlexaLists(payload)
  }

  public async fetchListItems(listId: string): Promise<readonly AlexaListItem[]> {
    return this.fetchListItemPages(listId, undefined)
  }

  private async fetchListItemPages(listId: string, nextToken: string | undefined): Promise<readonly AlexaListItem[]> {
    const parameters = new URLSearchParams({ limit: String(MAX_PAGE_SIZE) })
    const payload = await this.request(
      `/alexashoppinglists/api/v2/lists/${encodeURIComponent(listId)}/items/fetch?${parameters.toString()}`,
      {
        ...(nextToken === undefined ? {} : { nextToken }),
      },
    )
    const page = parseAlexaListItems(payload)

    if (page.nextToken === undefined) {
      return page.items
    }

    const remainingItems = await this.fetchListItemPages(listId, page.nextToken)

    return [...page.items, ...remainingItems]
  }

  private async request(path: string, body: Readonly<Record<string, string>>): Promise<unknown> {
    const url = new URL(path, this.#origin).toString()
    const response = await this.#fetch(url, {
      method: 'POST',
      headers: this.#headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new AmazonAlexaListsApiError(response.status, response.statusText, url, await response.text())
    }

    return response.json()
  }
}
