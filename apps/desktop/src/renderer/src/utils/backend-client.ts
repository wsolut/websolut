import {
  ApiClientResponse,
  Page,
  PageContent,
  Project,
  ProjectInputDto,
  PageUpdateContentInputDto,
  PageDeployDto,
  ProjectDeployDto,
  PageInputDto,
} from '../@types';
import axios, { AxiosResponse } from 'axios';
import { io } from 'socket.io-client';
import { useToast } from '../composables/useToast';
import i18n from '@/locales/config/i18n';

const SILENCED_STATUSSES = [301, 302, 303, 304, 307, 308];

const API_PATH = '/api';
const SPA_PATH = '/spa';

async function downloadFile(url: string, strategy: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Page has been deleted (status ${response.status})`);
      }
      throw new Error(`Network Error (status ${response.status})`);
    }

    const disposition = response.headers.get('content-disposition');
    let filename = `export-${strategy}`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^;"']+)/);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1].replace(/['"]/g, ''));
      }
    }

    const blob = await response.blob();
    const urlObject = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = urlObject;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(urlObject);
  } catch (error) {
    console.debug(i18n.global.t('error.failedDownloadError'), JSON.stringify(error, null, 2));
    throw error;
  }
}

export class BackendClient {
  apiPath = API_PATH;
  baseUrl: string;
  spaPath = SPA_PATH;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  pagesWs() {
    const wsClient = io(`${this.baseUrl}/pages`, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });

    return wsClient;
  }

  projectsWs() {
    const wsClient = io(`${this.baseUrl}/projects`, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });

    return wsClient;
  }

  jobStatusesWs() {
    const wsClient = io(`${this.baseUrl}/job-statuses`, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });

    return wsClient;
  }

  get wsBaseUrl(): string {
    return this.baseUrl;
  }

  get apiBaseUrl(): string {
    return `${this.baseUrl}${this.apiPath}`;
  }

  get spaBaseUrl(): string {
    return `${this.baseUrl}${this.spaPath}`;
  }

  projectsPreviewPath(projectId: number, pagePath?: string): string {
    return `${this.spaPath}/projects/${projectId}/preview/${pagePath || ''}`;
  }

  projectsPreviewUrl(projectId: number, pagePath?: string): string {
    return `${this.baseUrl}${this.projectsPreviewPath(projectId, pagePath)}`;
  }

  rawProjectsPreviewUrl(projectId: number, pageId: number): string {
    return `${this.baseUrl}/projects/${projectId}/pages/${pageId}`;
  }

  async downloadProjectsExport(id: number, strategy: string): Promise<void> {
    const toast = useToast();
    const url = `${this.apiBaseUrl}/projects/${id}/export/${strategy}`;
    try {
      await downloadFile(url, strategy);
      toast.info(i18n.global.t('download.started'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`${i18n.global.t('download.failed')}: ${msg}`);
      throw err;
    }
  }

  async projectsFetchAll(): Promise<ApiClientResponse<Project[]>> {
    return this.get<ApiClientResponse<Project[]>>(`${this.apiBaseUrl}/projects`);
  }

  async projectsFetchOne(id: number): Promise<ApiClientResponse<Project>> {
    return this.get<ApiClientResponse<Project>>(`${this.apiBaseUrl}/projects/${id}`);
  }

  async projectsCreate(data: ProjectInputDto): Promise<ApiClientResponse<Project>> {
    return this.post<ApiClientResponse<Project>>(`${this.apiBaseUrl}/projects`, data);
  }

  async projectsUpdate(id: number, data: ProjectInputDto): Promise<ApiClientResponse<void>> {
    return this.put<ApiClientResponse<void>>(`${this.apiBaseUrl}/projects/${id}`, data);
  }

  async projectsDestroy(id: number): Promise<ApiClientResponse<void>> {
    return this.delete<ApiClientResponse<void>>(`${this.apiBaseUrl}/projects/${id}`);
  }

  async projectsDeploy(
    id: number,
    strategy: string,
    data: ProjectDeployDto,
  ): Promise<ApiClientResponse<Project>> {
    return this.post<ApiClientResponse<Project>>(
      `${this.apiBaseUrl}/projects/${id}/deploy/${strategy}`,
      data,
    );
  }

  async pagesFetchAll(query: object): Promise<ApiClientResponse<Page[]>> {
    return this.get<ApiClientResponse<Page[]>>(`${this.apiBaseUrl}/pages`, query);
  }

  async pagesFetchOne(id: number): Promise<ApiClientResponse<Page>> {
    return this.get<ApiClientResponse<Page>>(`${this.apiBaseUrl}/pages/${id}`);
  }

  async pagesCreate(data: PageInputDto): Promise<ApiClientResponse<Page>> {
    return this.post<ApiClientResponse<Page>>(`${this.apiBaseUrl}/pages`, data);
  }

  async pagesUpdate(id: number, data: PageInputDto): Promise<ApiClientResponse<void>> {
    return this.put<ApiClientResponse<void>>(`${this.apiBaseUrl}/pages/${id}`, data);
  }

  async pagesDestroy(id: number): Promise<ApiClientResponse<void>> {
    return this.delete<ApiClientResponse<void>>(`${this.apiBaseUrl}/pages/${id}`);
  }

  async pagesFetchContent(id: number): Promise<ApiClientResponse<PageContent>> {
    return this.get<ApiClientResponse<PageContent>>(`${this.apiBaseUrl}/pages/${id}/content`);
  }

  async pagesUpdateContent(
    id: number,
    data: PageUpdateContentInputDto,
  ): Promise<ApiClientResponse<Page>> {
    return this.patch<ApiClientResponse<Page>>(`${this.apiBaseUrl}/pages/${id}/content`, data);
  }

  async pagesRevertContent(id: number): Promise<ApiClientResponse<Page>> {
    return this.delete<ApiClientResponse<Page>>(`${this.apiBaseUrl}/pages/${id}/content`);
  }

  async pagesSynchronize(id: number): Promise<ApiClientResponse<Page>> {
    return this.patch<ApiClientResponse<Page>>(`${this.apiBaseUrl}/pages/${id}/synchronize`);
  }

  pagesExport(id: number, strategy: string) {
    window.open(`${this.apiBaseUrl}/pages/${id}/export/${strategy}`, '_blank');
  }

  async pagesDeploy(
    id: number,
    strategy: string,
    data: PageDeployDto,
  ): Promise<ApiClientResponse<Page>> {
    return this.post<ApiClientResponse<Page>>(
      `${this.apiBaseUrl}/pages/${id}/deploy/${strategy}`,
      data,
    );
  }

  async get<T>(path: string, params?: object, options: { showToast?: boolean } = {}): Promise<T> {
    return this.makeRequest<T>('get', path, params || {}, options);
  }

  async post<T>(path: string, data?: object, options: { showToast?: boolean } = {}): Promise<T> {
    return this.makeRequest<T>('post', path, data || {}, options);
  }

  async put<T>(path: string, data?: object, options: { showToast?: boolean } = {}): Promise<T> {
    return this.makeRequest<T>('put', path, data || {}, options);
  }

  async patch<T>(path: string, data?: object, options: { showToast?: boolean } = {}): Promise<T> {
    return this.makeRequest<T>('patch', path, data || {}, options);
  }

  async delete<T>(path: string, data?: object, options: { showToast?: boolean } = {}): Promise<T> {
    return this.makeRequest<T>('delete', path, data || {}, options);
  }

  async makeRequest<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    data?: object,
    options: { showToast?: boolean } = {},
  ): Promise<T> {
    const toast = useToast();

    const { showToast = true } = options;
    const secondArgument = method === 'get' ? { params: data } : data;
    console.debug(`Making ${method.toUpperCase()} request to ${path} with data:`, secondArgument);

    try {
      const response: AxiosResponse<T> =
        method === 'delete'
          ? await axios.delete(path, { data: secondArgument })
          : await axios[method](path, secondArgument);
      // toast.success((response.data as ApiClientResponse<T>).message);

      return response.data;
    } catch (error: unknown) {
      const message = `WARNING: Unexpected error, from the server!`;

      if (showToast) {
        if (axios.isAxiosError(error)) {
          if (!error.response) {
            toast.error(i18n.global.t('error.backendUnavailable'));
          } else if (!SILENCED_STATUSSES.includes(Number(error.response.status))) {
            const responseData = error.response?.data as ApiClientResponse<T> | undefined;
            toast.error(responseData?.message);
          }
        } else {
          toast.error(message);
        }
      }

      throw error;
    }
  }
}

export const backendClient = new BackendClient(`${window['backendBaseUrl']}`);
