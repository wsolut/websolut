import { copyTemplateDir } from './copy-template-dir';
import { copyTemplateFile } from './copy-template-file';
import { statSync } from 'fs';

export function copyTemplate(
  templatePath: string,
  destinationPath: string,
  data: object = {},
) {
  const templateStat = statSync(templatePath);

  if (templateStat.isDirectory()) {
    copyTemplateDir(templatePath, destinationPath, data);
  } else {
    copyTemplateFile(templatePath, destinationPath, data);
  }
}
