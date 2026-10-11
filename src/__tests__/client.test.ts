import { describe, expect, it } from 'vitest'

import { AmazonAlexaListsApiError, AmazonAlexaListsClient } from '../index.js'
import type { AmazonAlexaListsFetch } from '../types.js'

describe('AmazonAlexaListsClient', () => {
  it('fetches Alexa built-in and custom lists', async () => {
    const transport = buildTransport([
      {
        listInfoList: [
          { listId: 'shop-id', listType: 'SHOP' },
          { listId: 'todo-id', listType: 'TODO' },
          { listId: 'custom-id', listType: 'CUSTOM', listName: 'Hardware' },
        ],
      },
    ])
    const client = new AmazonAlexaListsClient({
      fetch: transport.fetch,
      headers: { Cookie: 'session-id=secret' },
    })

    await expect(client.fetchLists()).resolves.toEqual([
      { id: 'shop-id', type: 'SHOP', name: 'SHOP' },
      { id: 'todo-id', type: 'TODO', name: 'TODO' },
      { id: 'custom-id', type: 'CUSTOM', name: 'Hardware' },
    ])
    expect(transport.requests).toEqual([
      {
        url: 'https://www.amazon.com/alexashoppinglists/api/v2/lists/fetch',
        method: 'POST',
        cookie: 'session-id=secret',
        body: '{}',
      },
    ])
  })

  it('fetches every page of list items', async () => {
    const transport = buildTransport([
      {
        itemInfoList: [{ itemId: 'milk-id', itemName: 'milk', itemStatus: 'ACTIVE', version: 3 }],
        nextToken: 'next-page',
      },
      {
        itemInfoList: [{ itemId: 'bread-id', itemName: 'bread', itemStatus: 'COMPLETE', version: 4 }],
        nextToken: null,
      },
    ])
    const client = new AmazonAlexaListsClient({ fetch: transport.fetch, origin: 'https://www.amazon.co.uk' })

    await expect(client.fetchListItems('my list')).resolves.toEqual([
      { id: 'milk-id', name: 'milk', status: 'ACTIVE', version: 3 },
      { id: 'bread-id', name: 'bread', status: 'COMPLETE', version: 4 },
    ])
    expect(transport.requests).toEqual([
      {
        url: 'https://www.amazon.co.uk/alexashoppinglists/api/v2/lists/my%20list/items/fetch?limit=100',
        method: 'POST',
        cookie: null,
        body: '{}',
      },
      {
        url: 'https://www.amazon.co.uk/alexashoppinglists/api/v2/lists/my%20list/items/fetch?limit=100',
        method: 'POST',
        cookie: null,
        body: '{"nextToken":"next-page"}',
      },
    ])
  })

  it('reports the Amazon response when a request fails', async () => {
    const client = new AmazonAlexaListsClient({
      fetch: (): Promise<Response> =>
        Promise.resolve(new Response('sign in again', { status: 401, statusText: 'Unauthorized' })),
    })

    await expect(client.fetchLists()).rejects.toEqual(
      new AmazonAlexaListsApiError(
        401,
        'Unauthorized',
        'https://www.amazon.com/alexashoppinglists/api/v2/lists/fetch',
        'sign in again',
      ),
    )
  })

  it('rejects a list response that is not an object', async () => {
    const client = new AmazonAlexaListsClient({ fetch: buildTransport([[]]).fetch })

    await expect(client.fetchLists()).rejects.toThrow('list response must be an object')
  })

  it('rejects a list response without an item array', async () => {
    const client = new AmazonAlexaListsClient({ fetch: buildTransport([{ listInfoList: 'not a list' }]).fetch })

    await expect(client.fetchLists()).rejects.toThrow('listInfoList must be an array')
  })

  it('rejects an unknown Alexa list type', async () => {
    const client = new AmazonAlexaListsClient({
      fetch: buildTransport([{ listInfoList: [{ listId: 'unknown-list', listType: 'OTHER' }] }]).fetch,
    })

    await expect(client.fetchLists()).rejects.toThrow('listInfoList[0].listType must be SHOP, TODO, or CUSTOM')
  })

  it('rejects an unknown Alexa item status', async () => {
    const client = new AmazonAlexaListsClient({
      fetch: buildTransport([
        { itemInfoList: [{ itemId: 'milk-id', itemName: 'milk', itemStatus: 'OTHER', version: 1 }] },
      ]).fetch,
    })

    await expect(client.fetchListItems('shop-id')).rejects.toThrow(
      'itemInfoList[0].itemStatus must be ACTIVE or COMPLETE',
    )
  })
})

interface RequestRecord {
  readonly url: string
  readonly method: string
  readonly cookie: string | null
  readonly body: string | undefined
}

interface Transport {
  readonly fetch: AmazonAlexaListsFetch
  readonly requests: RequestRecord[]
}

function buildTransport(payloads: readonly unknown[]): Transport {
  const requests: RequestRecord[] = []
  let payloadIndex = 0

  return {
    fetch: (input: string | URL, init?: RequestInit): Promise<Response> => {
      const payload = payloads[payloadIndex]
      payloadIndex += 1
      requests.push({
        url: input.toString(),
        method: init?.method ?? 'GET',
        cookie: new Headers(init?.headers).get('cookie'),
        body: typeof init?.body === 'string' ? init.body : undefined,
      })

      return Promise.resolve(new Response(JSON.stringify(payload), { status: 200 }))
    },
    requests,
  }
}
