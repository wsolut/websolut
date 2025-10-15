import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
// import * as WebsolutCore from '@wsolut/websolut-core';
import pkg from '../package.json';
import { select } from '@inquirer/prompts';

const DEFAULT_SERVER_PORT = 7070;

interface Options {
  figmaToken: string;
  controlDataPath: string;
  serverPort: number;
}

interface DefaultCommandOptions {
  figmaToken: string;
  controlDataPath: string;
  serverPort?: number;
}

interface AddCommandOptions {
  figmaToken: string;
}

class WebsolutCLI {
  constructor() {
    this.setupGracefulShutdown();
  }

  async defaultCommand(cliOptions: DefaultCommandOptions): Promise<void> {
    try {
      const options = this.validateOptions(cliOptions);

      console.log(chalk.cyan('\n🎨 Websolut Configuration:'));
      console.log(
        chalk.gray(`  • Control Data Path: ${options.controlDataPath}`),
      );
      console.log(chalk.gray(`  • Server port: ${options.serverPort}`));
      console.log();

      await this.waitForUserInput(options);
    } catch (error) {
      showError('✖ Failed to start Websolut');
      showError(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      process.exit(1);
    }
  }

  addCommand(_cliOptions: AddCommandOptions) {
    try {
      void console.log(chalk.cyan('\n🎨 Websolut Configuration:'));
    } catch (error) {
      showError('✖ Failed to add Figma file');
      showError(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const cleanup = () => {
      console.log(chalk.yellow('\n🛑 Shutting down Websolut CLI...'));
      // await this.stopApiServer();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGUSR1', cleanup);
    process.on('SIGUSR2', cleanup);
  }

  private validateOptions(cliOptions: DefaultCommandOptions): Options {
    const errors: string[] = [];

    const options: Options = {
      serverPort: Number(cliOptions.serverPort),
      figmaToken: cliOptions.figmaToken,
      controlDataPath: path.resolve(cliOptions.controlDataPath),
    };

    if (Number.isNaN(options.serverPort)) {
      options.serverPort = DEFAULT_SERVER_PORT;
    }

    if ((options.controlDataPath ?? '') === '')
      errors.push('control-data-path is required');

    if ((options.figmaToken ?? '') === '')
      errors.push('figma-token is required');

    if (
      options.serverPort &&
      (options.serverPort < 1 || options.serverPort > 65535)
    ) {
      errors.push('API server port must be between 1 and 65535');
    }

    if (errors.length > 0) {
      showError('✖ Invalid options provided:');
      errors.forEach((error) => showError(`  • ${error}`));
      process.exit(1);
    }

    return options;
  }

  async waitForUserInput(_options: Options): Promise<void> {
    while (true) {
      const answer = await select({
        message: 'Select a command',
        choices: [
          {
            name: 'Synchronize all Figma files',
            value: 'sync-all-figma-files',
            description:
              'Recreate all HTML and CSS files with the latest changes from Figma',
          },
          {
            name: 'Synchronize a Figma file',
            value: 'sync-figma-file',
            description:
              'Recreate the HTML and CSS files of a give Figma File with the latest changes from Figma',
          },
          {
            name: 'Add new Figma file',
            value: 'add-figma-file',
            description: 'Add a new Figma file to the project',
          },
          {
            name: 'Edit a Figma file',
            value: 'edit-figma-file',
            description: 'Edit an existing Figma file in the project',
          },
          {
            name: 'Delete a Figma file',
            value: 'delete-figma-file',
            description: 'Delete an existing Figma file from the project',
          },
          {
            name: 'Quit',
            value: 'quit',
            description: 'Quit the application',
          },
        ],
      });

      if (answer === 'quit') {
        console.log(chalk.yellow('👋 Goodbye!'));
        process.exit(0);
      }
    }
  }
}

export function main(argv: string[]): void {
  const program = new Command();

  program
    .name('websolut')
    .description(pkg.description)
    .version(pkg.version)
    .requiredOption(
      '--figma-token [token]',
      'Figma API token',
      process.env.FIGMA_TOKEN,
    )
    .option(
      '--control-data-path [path]',
      'Path where websolut will save and load config and data files from.',
      `.websolut`,
    )
    .option(
      '--server-port [port]',
      `Port for the REST server that supports the figma plugin.`,
      `${DEFAULT_SERVER_PORT}`,
    )
    .action(async (options: DefaultCommandOptions) => {
      const cli = new WebsolutCLI();

      await cli.defaultCommand(options);
    });

  program
    .command('add')
    .description('Add a new Figma file to the project')
    .action((options: AddCommandOptions) => {
      const cli = new WebsolutCLI();

      cli.addCommand(options);
    });

  program
    .command('help')
    .description('Display help information')
    .action(() => {
      console.log(chalk.cyan('Websolut CLI - Usage Examples:'));
      console.log();
      console.log(chalk.yellow('Basic usage:'));
      console.log('  websolut --figma-token "<figma-token>"');
      console.log();
      console.log(chalk.yellow('With custom options:'));
      console.log('  websolut \\');
      console.log('    --figma-token "<figma-token>" \\');
      console.log('    --control-data-path ".websolut" \\');
      console.log('    --server-port 7070 \\');
      console.log();
    });

  program.parse(argv);
}

// Auto-run main when this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv);
}

function showError(message) {
  console.error(chalk.red.bold(`Error: ${message}`));
}
