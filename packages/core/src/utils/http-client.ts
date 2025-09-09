export type HttpClientOptions = {
  baseURL: string;
  headers?: Record<string, string | undefined>;
};

export type HttpResponse<T = unknown> = {
  ok: boolean;
  error: TypeError | string | undefined;
  message: string;
  data: T | string | undefined;
};

export class HttpClient {
  baseURL: string;
  headers: Record<string, string> = {};

  constructor(options: HttpClientOptions) {
    this.baseURL = options.baseURL;

    Object.entries(options.headers || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        this.headers[key] = value;
      }
    });
  }

  async get(path: string, params: object = {}) {
    const url = new URL(path, this.baseURL);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, value as string);
    });

    const options = { method: 'GET', headers: this.headers };

    return this.makeRequest(url.toString(), options);
  }

  async post(path: string, params: object = {}) {
    const url = new URL(path, this.baseURL);

    const options = {
      method: 'POST',
      headers: this.headers,
      data: params,
    };

    return this.makeRequest(url.toString(), options);
  }

  async delete(path: string) {
    const url = new URL(path, this.baseURL);

    const options = { method: 'DELETE', headers: this.headers };

    return this.makeRequest(url.toString(), options);
  }

  private async makeRequest<T = unknown>(
    url: string,
    options: {
      method: string;
      headers?: Record<string, string>;
      data?: object | undefined;
    },
  ): Promise<HttpResponse<T>> {
    return new Promise<HttpResponse<T>>((resolve) => {
      fetch(url, {
        method: options.method,
        headers: options.headers || {},
        body: options.data ? JSON.stringify(options.data) : undefined,
      })
        .then(async (response: Response) => {
          resolve({
            data: await this.responseData(response),
            error: undefined,
            message: response.statusText,
            ok: response.ok,
          });
        })
        .catch((error: TypeError) => {
          resolve({
            data: undefined,
            error,
            message: error.message,
            ok: false,
          });
        });
    });
  }

  private async responseData<T>(response: Response): Promise<T | string> {
    const body = await response.text();

    try {
      return JSON.parse(body) as T;
    } catch {
      return body;
    }
  }
}
