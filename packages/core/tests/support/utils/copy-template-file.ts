import { dirname, basename } from 'path';
import { renderTemplateFile } from './render-template-file';
import { mkdirSync, writeFileSync } from 'fs';

export function copyTemplateFile(
  templatePath: string,
  destinationPath: string,
  data: object = {},
) {
  const templateFileName = basename(templatePath);
  const content = renderTemplateFile(templatePath, data);

  if (templateFileName.endsWith('.ejs') && destinationPath.endsWith('.ejs')) {
    destinationPath = destinationPath.replace(/\.ejs$/, '');
  }

  mkdirSync(dirname(destinationPath), { recursive: true });

  writeFileSync(destinationPath, content);
}
