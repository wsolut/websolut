export class BaseError extends Error {}

export class InvalidArgumentErrorData {
  [propertyName: string]: string[];
}

export class InvalidArgumentError extends BaseError {
  errors: InvalidArgumentErrorData;

  constructor(message: string, errors?: InvalidArgumentErrorData) {
    super(message);

    this.errors = errors || {};
  }
}

export class PermissionDeniedError extends BaseError {}

export class ServiceUnavailableError extends BaseError {}

export class NotFoundError extends BaseError {}

export class TranslationMissingError extends BaseError {}

export class PortAlreadyInUseError extends BaseError {}

export class VercelInvalidTokenError extends BaseError {}

export class NetworkUnavailableError extends BaseError {}

export class WordpressInvalidTokenError extends BaseError {}

export class WordpressInvalidBaseURLError extends BaseError {}
