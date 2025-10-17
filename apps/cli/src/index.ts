import { Command } from 'commander';
import pkg from '../package.json';
import {
  CLI,
  Config,
  TEMPLATE_NAMES,
  DEFAULT_CONFIG,
  DEFAULT_CONFIG_FILE_NAME,
  DEFAULT_CONFIG_DIR_NAME,
  ConvertOptions,
  TEMPLATES_DIR_NAME,
} from './cli';
import { join, resolve } from 'path';
import { copyDirSync, createDirSync, loadConfig } from './utils';
const RESOURCES_DIR_NAME = 'resources';

export function main(argv: string[]): void {
  const program = new Command();

  program.name('websolut').description(pkg.description).version(pkg.version);

  program
    .command('convert')
    .description(
      'Fetches the latest data from Figma and outputs the files, based on the provided template.',
    )
    .argument(
      '<figma-url>',
      'Figma file URL with a node id, e.g. https://www.figma.com/file/xxxxxx/xxxxx?node-id=0%3A1',
    )
    .option(
      '--config-dir <path>',
      'Path to the configuration file.',
      DEFAULT_CONFIG_DIR_NAME,
    )
    .option(
      '--assets-out-dir <path>',
      'Path to where the assets, of the exported files, will be saved.',
    )
    .option(
      '--assets-prefix-path <path>',
      'Path used to prefix the path for each asset inside the exported files.',
    )
    .option('--figma-token <token>', 'Figma API token.')
    .option(
      '--file-name <name>',
      'Name of the file without extension, e.g. "landing-page".',
    )
    .option(
      '--template-name <name>',
      `Name of the template to use for the exported files, e.g. "${TEMPLATE_NAMES.join(', ')}".`,
    )
    .option(
      '--out-dir <path>',
      'Path to where the exported files will be saved.',
    )
    .action(async (figmaUrl: string, options: ConvertOptions) => {
      const globalConfig = loadGlobalConfig(options.configDir);
      const cli = new CLI(globalConfig);
      await cli.convert({ figmaUrl, ...options });
    });

  program.parse(argv);
}

// Auto-run main when this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv);
}

function loadGlobalConfig(configDir: string): Config {
  const configPath = resolve(
    process.cwd(),
    configDir,
    DEFAULT_CONFIG_FILE_NAME,
  );

  const config = loadConfig<Config>(configPath, DEFAULT_CONFIG);

  const templatesSrc = join(__dirname, RESOURCES_DIR_NAME, TEMPLATES_DIR_NAME);
  const templatesDirPath = join(configDir, TEMPLATES_DIR_NAME);

  createDirSync(templatesDirPath);
  copyDirSync(templatesSrc, templatesDirPath);

  return config;
}
