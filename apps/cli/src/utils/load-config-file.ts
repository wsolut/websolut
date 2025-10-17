import { existsSync } from 'fs';
import { createConfigFile } from './create-config-file';

export function loadConfig<T>(configPath: string, defaultConfig: T): T {
  let config = { ...defaultConfig };

  if (!existsSync(configPath)) {
    createConfigFile(configPath, config as Record<string, string>);
  }

  interface ConfigModule {
    default: (opts: { mode: string }) => T;
  }

  let configModule: ConfigModule | undefined = undefined;

  try {
    configModule = require.apply(null, [configPath]) as ConfigModule;
  } catch {
    configModule = undefined;
  }

  if (configModule?.default) {
    config = configModule.default({
      mode: process.env.NODE_ENV ?? 'development',
    });
  }

  return config;
}
