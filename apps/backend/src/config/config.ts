import * as path from 'path';
import { copyDirSync, createDirSync } from '../utils';

const isDist = __dirname.includes(`${path.sep}dist${path.sep}`);

export const DATA_DIR_NAME = 'data';
export const DATABASE_FILE_NAME = 'database.sqlite';
export const DEPLOY_DIR_NAME = 'deploy';
export const EXPORT_DIR_NAME = 'export';
export const I18N_DIR_NAME = 'i18n';
export const LOGS_DIR_NAME = 'logs';
export const PREVIEW_DIR_NAME = 'preview';
export const PUBLIC_DIR_NAME = 'public';
export const RESOURCES_DIR_NAME = 'resources';
export const SPA_DIR_NAME = 'spa';
export const TEMPLATES_DIR_NAME = 'templates';

export interface Config {
  databaseFilePath: string;
  dataDirPath: string;
  deployDirPath: string;
  exportDirPath: string;
  i18nDirPath: string;
  logsDirPath: string;
  outDirPath: string;
  previewDirPath: string;
  publicDirPath: string;
  resourcesDirPath: string;
  spaDirPath: string;
  templatesDirPath: string;
}

export function buildConfig(outDirPath: string): Config {
  outDirPath = path.isAbsolute(outDirPath)
    ? outDirPath
    : path.join(process.cwd(), outDirPath);

  const resourcesDirPath = path.join(
    __dirname,
    isDist ? '../' : '../',
    RESOURCES_DIR_NAME,
  );
  const publicDirPath = path.join(outDirPath, PUBLIC_DIR_NAME);

  const config: Config = {
    databaseFilePath: path.join(outDirPath, DATA_DIR_NAME, DATABASE_FILE_NAME),
    dataDirPath: path.join(outDirPath, DATA_DIR_NAME),
    deployDirPath: path.join(outDirPath, DEPLOY_DIR_NAME),
    exportDirPath: path.join(outDirPath, EXPORT_DIR_NAME),
    i18nDirPath: path.join(resourcesDirPath, I18N_DIR_NAME),
    logsDirPath: path.join(outDirPath, LOGS_DIR_NAME),
    outDirPath,
    previewDirPath: path.join(publicDirPath),
    publicDirPath,
    resourcesDirPath,
    spaDirPath: path.join(publicDirPath, SPA_DIR_NAME),
    templatesDirPath: path.join(outDirPath, TEMPLATES_DIR_NAME),
  };

  return config;
}

export function scaffoldDirectories(config: Config) {
  createDirSync(config.outDirPath);

  const directories = [
    'dataDirPath',
    'deployDirPath',
    'exportDirPath',
    'logsDirPath',
    'previewDirPath',
    'publicDirPath',
    'spaDirPath',
    'templatesDirPath',
  ];

  directories.forEach((key) => {
    const dirPath = config[key as keyof Config];

    if (typeof dirPath === 'string') {
      createDirSync(dirPath);
    }
  });

  copyDirSync(
    path.join(config.resourcesDirPath, PUBLIC_DIR_NAME),
    path.join(config.publicDirPath),
  );

  copyDirSync(
    path.join(config.resourcesDirPath, TEMPLATES_DIR_NAME),
    path.join(config.templatesDirPath),
  );
}
