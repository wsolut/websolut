import * as FigmaTypes from '@figma/rest-api-spec';
import { HttpClient, HttpResponse } from './http-client';
import {
  FigmaClientInvalidTokenError,
  FigmaClientNoResponseError,
  NetworkUnavailableError,
} from '../errors';

export interface FileParams {
  readonly ids?: ReadonlyArray<string>;
  readonly depth?: number;
  readonly version?: string;
  readonly geometry?: string;
  readonly plugin_data?: string;
}

export type exportFormatOptions = 'jpg' | 'png' | 'svg' | 'pdf';

export interface FileNodesParams {
  readonly ids: ReadonlyArray<string>;
  readonly geometry?: string;
}

export interface FileImageParams {
  readonly ids: ReadonlyArray<string>;
  readonly scale?: number;
  readonly format?: exportFormatOptions;
  readonly svg_include_id?: boolean;
  readonly svg_simplify_stroke?: boolean;
  readonly use_absolute_bounds?: boolean;
  readonly version?: string;
}

export interface FigmaClientOptions {
  readonly authToken?: string;
  readonly figmaToken?: string;
  readonly apiRoot?: string;
}

export interface FigmaClientInterface {
  readonly file: (params?: FileParams) => Promise<FigmaTypes.GetFileResponse>;

  readonly fileImages: (
    params: FileImageParams,
  ) => Promise<FigmaTypes.GetImagesResponse>;
}

export class FigmaClient extends HttpClient implements FigmaClientInterface {
  figmaFileKey: string;

  constructor(figmaFileKey: string, opts: FigmaClientOptions) {
    super({
      baseURL: `https://${opts.apiRoot || 'api.figma.com'}/v1/`,
      headers: opts.authToken
        ? { Authorization: `Bearer ${opts.authToken}` }
        : { 'X-Figma-Token': opts.figmaToken ?? '' },
    });

    this.figmaFileKey = figmaFileKey;
  }

  async file(params?: FileParams) {
    const { ids = [], ...paramsRest } = params || {};

    const response = await this.get(`files/${this.figmaFileKey}`, {
      ...paramsRest,
      ids: ids.join(','),
    });

    this.handleResponse(response);

    return response.data as FigmaTypes.GetFileResponse;
  }

  async fileNodes(params?: FileNodesParams) {
    const { ids = [], ...paramsRest } = params || {};

    const response = await this.get(`files/${this.figmaFileKey}/nodes`, {
      ...paramsRest,
      ids: ids.join(','),
    });

    this.handleResponse(response);

    return response.data as FigmaTypes.GetFileNodesResponse;
  }

  async fileImages(params?: FileImageParams) {
    const { ids = [], ...paramsRest } = params || {};

    const response = await this.get(`images/${this.figmaFileKey}`, {
      ...paramsRest,
      ids: ids.join(','),
    });

    this.handleResponse(response);

    return response.data as FigmaTypes.GetImagesResponse;
  }

  async fileImageFills() {
    const response = await this.get(`files/${this.figmaFileKey}/images`);

    this.handleResponse(response);

    return response.data as FigmaTypes.GetImageFillsResponse;
  }

  protected handleResponse(response: HttpResponse<unknown>) {
    if (!response.ok) {
      const errorData = response.data as { status?: number } | undefined;
      const status = errorData?.status;

      if (status === 403) {
        throw new FigmaClientInvalidTokenError();
      }

      if (status === 404) {
        throw new FigmaClientNoResponseError();
      }

      if (!errorData) {
        throw new NetworkUnavailableError(
          `Network error while fetching ${this.figmaFileKey}: ${response.message ?? 'No response'}`,
        );
      }

      throw new Error(
        `Failed to fetch file ${this.figmaFileKey}: ${response.message ?? 'No response data'}`,
      );
    }
  }
}
