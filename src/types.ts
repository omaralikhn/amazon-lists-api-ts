export type AlexaListType = 'SHOP' | 'TODO' | 'CUSTOM'

export interface AlexaList {
  readonly id: string
  readonly type: AlexaListType
  readonly name: string
}

export type AlexaListItemStatus = 'ACTIVE' | 'COMPLETE'

export interface AlexaListItem {
  readonly id: string
  readonly name: string
  readonly status: AlexaListItemStatus
  readonly version: number
}

export type AmazonAlexaListsFetch = (input: string | URL, init?: RequestInit) => Promise<Response>

export interface AmazonAlexaListsClientOptions {
  readonly fetch?: AmazonAlexaListsFetch
  readonly headers?: Readonly<Record<string, string>>
  readonly origin?: string
}
