import { ApiClientErrors, ApiClientResponse } from '@/@types';
import { AxiosError } from 'axios';

export type RequestStatuses = 'idle' | 'pending' | 'success' | 'bad_request' | 'error';

export class RequestStatus {
  $status: RequestStatuses = 'idle';
  errorMessage?: string;
  errors: ApiClientErrors = {};

  get status(): RequestStatuses {
    return this.$status;
  }

  set status(value: RequestStatuses) {
    if (value === 'idle' || value === 'pending' || value === 'success') {
      this.errorMessage = undefined;
      this.errors = {};
    }

    this.$status = value;
  }

  parseError(error: unknown): void {
    const axiosError = error as AxiosError<ApiClientResponse>;

    if (axiosError.status === 422) {
      this.status = 'bad_request';

      if (axiosError.response) {
        this.errorMessage = axiosError.response.data.message;
        this.errors = axiosError.response.data.errors || {};
      }
    } else {
      this.status = 'error';
      this.errorMessage = axiosError.message || 'An unexpected error occurred.';
      this.errors = {};
    }

    this.errorMessage = axiosError.message;
  }

  get idle(): boolean {
    return this.status === 'idle';
  }

  get pending(): boolean {
    return this.status === 'pending';
  }

  get completed(): boolean {
    return !this.idle && !this.pending;
  }

  get success(): boolean {
    return this.status === 'success';
  }

  get badRequest(): boolean {
    return this.status === 'bad_request';
  }

  get error(): boolean {
    return this.status === 'error';
  }
}
