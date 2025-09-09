import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PageEntity } from '../pages/page.entity';
import { ProjectEntity } from '../projects/project.entity';
import { JobStatusEntity } from '../job-statuses/job-status.entity';

const entities = [PageEntity, ProjectEntity, JobStatusEntity];

export const typeormConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: ':memory:',
  synchronize: true, // No migrations in memory mode
  logging: false,
  entities,
  extra: {
    useUTC: true, // Enable UTC for date/time handling
  },
};

export function buildTypeOrmConfig(
  customConfig?: TypeOrmModuleOptions,
): TypeOrmModuleOptions {
  const ormConfig = { ...typeormConfig };

  if (customConfig) Object.assign(ormConfig, customConfig);

  return ormConfig;
}
