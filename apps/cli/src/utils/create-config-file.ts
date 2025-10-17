import { writeFileSync } from 'fs';
import { createDirSync } from './create-dir-sync';
import { dirname } from 'path';

export function createConfigFile(
  configPath: string,
  config: Record<string, string>,
): void {
  let returnContent = '';

  Object.entries(config).forEach(([key, value]) => {
    value =
      key === 'figmaToken' && value === process.env.FIGMA_TOKEN
        ? 'process.env.FIGMA_TOKEN'
        : `'${value}'`;

    returnContent += `    ${key}: ${value},\n`;
  });

  createDirSync(dirname(configPath));

  writeFileSync(
    configPath,
    `import dotenv from 'dotenv';

export default ({ mode }) => {
dotenv.config({ path: [\`.env.$\{mode}\`, '.env'] });

return {
${returnContent}  };
}
`,
  );
}
