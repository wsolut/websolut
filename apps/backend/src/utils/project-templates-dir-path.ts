import { ProjectEntity } from '../projects';
import * as fs from 'fs';

export function projectTemplatesDirPath(
  project: ProjectEntity,
  fallbackDirPath: string,
): string {
  const templatesDirPath = project.templatesDirPath;

  if (templatesDirPath && fs.existsSync(templatesDirPath)) {
    return templatesDirPath;
  }

  return fallbackDirPath;
}
