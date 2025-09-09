import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { copyTemplateDir } from './copy-template-dir';

export function copyDataExample(
  dirName: string,
  destinationPath: string,
  data: object = {},
) {
  const sourcePath = join(
    dirname(dirname(fileURLToPath(import.meta.url))),
    'data-examples',
    dirName,
  );

  copyTemplateDir(sourcePath, destinationPath, data);
}
