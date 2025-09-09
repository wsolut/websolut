import { DataSource } from 'typeorm';
import createProjects from './migrations/202506261413-create-projects';
import createPages from './migrations/202507062145-create-pages';
import createJobStatuses from './migrations/202509242151-create-job-statuses';

type Migration = {
  name: string;
  timestamp: string;
  up: (dataSource: DataSource) => Promise<void>;
  down: (dataSource: DataSource) => Promise<void>;
};

const migrations: Migration[] = [
  createProjects,
  createPages,
  createJobStatuses,
];

export async function migrateUp(dataSource: DataSource): Promise<void> {
  await run('up', dataSource);
}

export async function migrateDown(dataSource: DataSource): Promise<void> {
  await run('down', dataSource);
}

export async function run(
  direction: 'up' | 'down',
  dataSource: DataSource,
): Promise<void> {
  let appliedNames: string[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const appliedMigrations = await dataSource.query(
      `SELECT name FROM migrations;`,
    );

    // Type guard and safe extraction
    if (Array.isArray(appliedMigrations)) {
      appliedNames = appliedMigrations
        .map((migration: { name: string }) => migration.name)
        .filter((name): name is string => typeof name === 'string');
    }
  } catch {
    // If migrations table doesn't exist yet, no migrations have been applied
    appliedNames = [];
  }

  // Run pending migrations
  for (const migration of migrations) {
    if (direction === 'up' && !appliedNames.includes(migration.name)) {
      await migration[direction](dataSource);

      await dataSource.query(
        `INSERT INTO migrations (name, timestamp) VALUES (?, ?);`,
        [migration.name, migration.timestamp],
      );
    } else if (direction === 'down' && appliedNames.includes(migration.name)) {
      await migration[direction](dataSource);

      await dataSource.query(
        `DELETE FROM migrations WHERE name=? AND timestamp=?;`,
        [migration.name, migration.timestamp],
      );
    }
  }
}
