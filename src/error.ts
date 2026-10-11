export class AmazonAlexaListsApiError extends Error {
  public readonly status: number
  public readonly statusText: string
  public readonly url: string
  public readonly responseBody: string

  public constructor(status: number, statusText: string, url: string, responseBody: string) {
    super(`Amazon Alexa Lists API request failed: ${status} ${statusText} for ${url}`)
    this.name = 'AmazonAlexaListsApiError'
    this.status = status
    this.statusText = statusText
    this.url = url
    this.responseBody = responseBody
  }
}
