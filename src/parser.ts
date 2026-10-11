import type { AlexaList, AlexaListItem, AlexaListItemStatus, AlexaListType } from './types.js'

export function parseAlexaLists(value: unknown): readonly AlexaList[] {
  const response = requireRecord(value, 'list response')
  const listInfoList = requireArray(response['listInfoList'], 'listInfoList')

  return listInfoList.map((list, index) => parseAlexaList(list, index))
}

interface AlexaListItemsPage {
  readonly items: readonly AlexaListItem[]
  readonly nextToken: string | undefined
}

export function parseAlexaListItems(value: unknown): AlexaListItemsPage {
  const response = requireRecord(value, 'list items response')
  const itemInfoList = requireArray(response['itemInfoList'], 'itemInfoList')
  const nextToken = parseOptionalString(response['nextToken'], 'nextToken')

  return {
    items: itemInfoList.map((item, index) => parseAlexaListItem(item, index)),
    nextToken,
  }
}

function parseAlexaList(value: unknown, index: number): AlexaList {
  const list = requireRecord(value, `listInfoList[${index}]`)
  const type = parseAlexaListType(list['listType'], `listInfoList[${index}].listType`)
  const name = type === 'CUSTOM' ? requireString(list['listName'], `listInfoList[${index}].listName`) : type

  return {
    id: requireString(list['listId'], `listInfoList[${index}].listId`),
    type,
    name,
  }
}

function parseAlexaListItem(value: unknown, index: number): AlexaListItem {
  const item = requireRecord(value, `itemInfoList[${index}]`)

  return {
    id: requireString(item['itemId'], `itemInfoList[${index}].itemId`),
    name: requireString(item['itemName'], `itemInfoList[${index}].itemName`),
    status: parseAlexaListItemStatus(item['itemStatus'], `itemInfoList[${index}].itemStatus`),
    version: requireInteger(item['version'], `itemInfoList[${index}].version`),
  }
}

function parseAlexaListType(value: unknown, field: string): AlexaListType {
  if (value === 'SHOP' || value === 'TODO' || value === 'CUSTOM') {
    return value
  }

  throw new TypeError(`${field} must be SHOP, TODO, or CUSTOM`)
}

function parseAlexaListItemStatus(value: unknown, field: string): AlexaListItemStatus {
  if (value === 'ACTIVE' || value === 'COMPLETE') {
    return value
  }

  throw new TypeError(`${field} must be ACTIVE or COMPLETE`)
}

function requireRecord(value: unknown, field: string): Readonly<Record<string, unknown>> {
  if (isRecord(value)) {
    return value
  }

  throw new TypeError(`${field} must be an object`)
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireArray(value: unknown, field: string): readonly unknown[] {
  if (Array.isArray(value)) {
    return value
  }

  throw new TypeError(`${field} must be an array`)
}

function parseOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  return requireString(value, field)
}

function requireString(value: unknown, field: string): string {
  if (typeof value === 'string') {
    return value
  }

  throw new TypeError(`${field} must be a string`)
}

function requireInteger(value: unknown, field: string): number {
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return value
  }

  throw new TypeError(`${field} must be a safe integer`)
}
