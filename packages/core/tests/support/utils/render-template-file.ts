import ejs from 'ejs';
import { readFileSync } from 'fs';
import { extname } from 'path';

export function renderTemplateFile(filePath: string, data: object): string {
  const filePathExt = extname(filePath);
  let content = readFileSync(filePath, 'utf8');

  if (filePathExt === '.ejs') {
    content = ejs.render(content, data);
  }

  return content;
}
