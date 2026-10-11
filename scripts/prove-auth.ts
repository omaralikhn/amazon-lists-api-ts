import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

import { AmazonAlexaListsApiError, AmazonAlexaListsClient } from '../src/index.js'

const require = createRequire(import.meta.url)
const alexaCookie = require('alexa-cookie2') as AlexaCookie
const statePath = join(homedir(), '.config', 'amazon-lists-api-ts', 'proof-session.json')

interface AlexaCookieResult {
  readonly localCookie?: string
  readonly [key: string]: unknown
}

interface AlexaCookie {
  generateAlexaCookie(options: AlexaCookieOptions, callback: AlexaCookieCallback): void
  refreshAlexaCookie(options: AlexaCookieOptions, callback: AlexaCookieCallback): void
  stopProxyServer(): void
}

interface AlexaCookieOptions {
  readonly acceptLanguage: string
  readonly amazonPage: string
  readonly amazonPageProxyLanguage: string
  readonly baseAmazonPage: string
  readonly deviceAppName: string
  readonly formerRegistrationData?: AlexaCookieResult
  readonly proxyListenBind?: string
  readonly proxyOnly?: boolean
  readonly proxyOwnIp?: string
  readonly proxyPort?: number
  readonly setupProxy?: boolean
}

type AlexaCookieCallback = (error: Error | null, result: AlexaCookieResult | string | null) => void
type AuthenticatedSession = AlexaCookieResult & { readonly localCookie: string }

void runProof().catch((error: unknown) => {
  alexaCookie.stopProxyServer()
  console.error(formatFailure(error))
  process.exitCode = 1
})

async function runProof(): Promise<void> {
  const initialSession = (await loadSession()) ?? (await startInteractiveLogin())
  const firstListTypes = await fetchListTypes(initialSession)
  await saveSession(initialSession)

  const refreshedSession = await refreshSession(initialSession)
  const secondListTypes = await fetchListTypes(refreshedSession)
  await saveSession(refreshedSession)

  alexaCookie.stopProxyServer()
  console.log(`PROOF_OK first=${firstListTypes.join(',')} second=${secondListTypes.join(',')}`)
}

function startInteractiveLogin(): Promise<AuthenticatedSession> {
  return new Promise((resolve, reject) => {
    alexaCookie.generateAlexaCookie(buildOptions(), (error, result) => {
      void handleLoginResult(error, result, resolve, reject).catch((cause: unknown) => {
        reject(cause instanceof Error ? cause : new Error('Could not persist the Amazon session.'))
      })
    })
  })
}

async function handleLoginResult(
  error: Error | null,
  result: AlexaCookieResult | string | null,
  resolve: (session: AuthenticatedSession) => void,
  reject: (error: Error) => void,
): Promise<void> {
  if (isSessionResult(result)) {
    await saveSession(result)
    resolve(result)
    return
  }

  const proxyUrl = error?.message.match(/http:\/\/127\.0\.0\.1:\d+\//u)?.[0]

  if (proxyUrl !== undefined) {
    console.log(`OPEN_BROWSER ${proxyUrl}`)
    return
  }

  if (typeof result === 'string') {
    reject(new Error('Amazon completed browser login without a device authorization code.'))
    return
  }

  reject(error ?? new Error('Amazon login returned no authenticated session.'))
}

function refreshSession(session: AuthenticatedSession): Promise<AuthenticatedSession> {
  return new Promise((resolve, reject) => {
    alexaCookie.refreshAlexaCookie({ ...buildOptions(), formerRegistrationData: session }, (error, result) => {
      if (error !== null || !isSessionResult(result)) {
        reject(error ?? new Error('Amazon session refresh returned no authenticated session.'))
        return
      }

      resolve(result)
    })
  })
}

function buildOptions(): AlexaCookieOptions {
  return {
    acceptLanguage: 'en-US',
    amazonPage: 'amazon.com',
    amazonPageProxyLanguage: 'en_US',
    baseAmazonPage: 'amazon.com',
    deviceAppName: 'Amazon Lists Proof',
    proxyListenBind: '127.0.0.1',
    proxyOnly: true,
    proxyOwnIp: '127.0.0.1',
    proxyPort: 0,
    setupProxy: true,
  }
}

function isSessionResult(result: unknown): result is AuthenticatedSession {
  return (
    typeof result === 'object' && result !== null && 'localCookie' in result && typeof result.localCookie === 'string'
  )
}

async function fetchListTypes(session: AuthenticatedSession): Promise<readonly string[]> {
  const client = new AmazonAlexaListsClient({ headers: { Cookie: session.localCookie } })

  try {
    const lists = await client.fetchLists()

    if (!lists.some((list) => list.type === 'SHOP')) {
      throw new Error('Amazon returned no SHOP list.')
    }

    return [...new Set(lists.map((list) => list.type))]
  } catch (error: unknown) {
    if (error instanceof AmazonAlexaListsApiError) {
      throw new Error(`Alexa list request failed with HTTP ${error.status} ${error.statusText}.`)
    }

    throw error
  }
}

async function loadSession(): Promise<AuthenticatedSession | undefined> {
  try {
    const stored = JSON.parse(await readFile(statePath, 'utf8')) as unknown

    if (typeof stored !== 'object' || stored === null || !('session' in stored)) {
      return undefined
    }

    return isSessionResult(stored.session) ? stored.session : undefined
  } catch (error: unknown) {
    if (isMissingFileError(error)) {
      return undefined
    }

    throw error
  }
}

async function saveSession(session: AlexaCookieResult): Promise<void> {
  const directoryPath = dirname(statePath)
  await mkdir(directoryPath, { recursive: true, mode: 0o700 })
  await chmod(directoryPath, 0o700)
  await writeFile(statePath, `${JSON.stringify({ version: 1, session })}\n`, { encoding: 'utf8', mode: 0o600 })
  await chmod(statePath, 0o600)
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

function formatFailure(error: unknown): string {
  return error instanceof Error ? `PROOF_FAILED ${error.message}` : 'PROOF_FAILED Unknown error.'
}
