export class NetworkUnavailableError extends Error {}

export class WebsolutError extends Error {}

export class NoTemplateFoundError extends WebsolutError {}

export class NoPageError extends WebsolutError {}

export class FigmaClientError extends WebsolutError {}

export class FigmaClientInvalidTokenError extends FigmaClientError {}

export class FigmaClientNoResponseError extends FigmaClientError {}
