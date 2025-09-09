import { join } from 'path';
import { copyTemplate } from './copy-template';
import { readdirSync } from 'fs';

export function copyTemplateDir(
  templatePath: string,
  destinationPath: string,
  data: object = {},
) {
  const files = readdirSync(templatePath);

  files.forEach((file) => {
    const src = join(templatePath, file);
    const dest = join(destinationPath, file);

    copyTemplate(src, dest, data);
  });
}
