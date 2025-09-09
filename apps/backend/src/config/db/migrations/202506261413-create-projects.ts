import { DataSource } from 'typeorm';

export default {
  name: 'create-projects',
  timestamp: '202506261413',

  async up(dataSource: DataSource): Promise<void> {
    await dataSource.query(`
      CREATE TABLE "projects" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" TEXT NOT NULL DEFAULT '' COLLATE NOCASE,
        "description" TEXT NOT NULL DEFAULT '',
        "tags" TEXT NOT NULL DEFAULT '',
        "figma_token" TEXT,
        "out_dir_path" TEXT,
        "templates_dir_path" TEXT,
        "assets_out_dir" TEXT,
        "assets_prefix_path" TEXT,
        "created_at" DATETIME(3) NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
        "updated_at" DATETIME(3) NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
      )
    `);

    await dataSource.query(`
      CREATE UNIQUE INDEX idx_projects_name ON projects(name);
    `);
  },

  async down(dataSource: DataSource): Promise<void> {
    await dataSource.query(`
      DROP INDEX idx_projects_name;
    `);

    await dataSource.query(`
      DROP TABLE "projects"
    `);
  },
};
