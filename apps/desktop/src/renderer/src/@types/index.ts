export type ApiClientErrors = {
  [propertyName: string]: string[];
};

export type ApiClientResponse<T = undefined> = {
  code: number;
  message?: string;
  data?: T;
  errors?: ApiClientErrors;
};

export type JobStatus = {
  id: number;
  name: string;
  resourceId: number;
  resourceType: string;
  startedAt: string | null;
  finishedAt: string | null;
  data: object;
  errorCode: number;
  errorMessage: string | null;
  errorStackTrace: string | null;
};

export type Project = {
  id: number;
  description: string;
  figmaToken: string;
  name: string;
  tags: string[];
  jobStatuses: JobStatus[];
  outDirPath: string;
  templatesDirPath: string;
  assetsOutDir: string;
  assetsPrefixPath: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectInputDto = {
  name?: string;
  description?: string;
  tags?: string[];
  outDirPath: string;
  templatesDirPath: string;
  assetsOutDir: string;
  assetsPrefixPath: string;
};

export type PageContent = {
  [id: string]: {
    text: string;
  };
};

export type Page = {
  id: number;
  figmaFileKey: string;
  figmaNodeId: string;
  figmaToken: string;
  figmaUrl: string;
  hasCommittedChanges: boolean;
  homePage: boolean;
  jobStatuses: JobStatus[];
  path: string;
  project: Project;
  projectId: number;
  createdAt: string;
  updatedAt: string;
};

export type PageInputDto = {
  figmaToken: string;
  figmaUrl: string;
  homePage: boolean;
  path: string;
  projectId: number;
};

export type PageDeployDto = {
  token: string;
  projectName?: string;
  baseUrl?: string;
};

export type ProjectDeployDto = {
  token: string;
  projectName?: string;
  baseUrl?: string;
};

export type PageUpdateContentInputDto = {
  [id: string]: {
    text: string;
  };
};
