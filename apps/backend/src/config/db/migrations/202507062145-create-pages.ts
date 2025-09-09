import { DataSource } from 'typeorm';

export default {
  name: 'create-pages',
  timestamp: '202507062145',

  async up(dataSource: DataSource): Promise<void> {
    await dataSource.query(`
      CREATE TABLE "pages" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "path" TEXT NOT NULL DEFAULT '' COLLATE NOCASE,
        "project_id" INTEGER NOT NULL,
        "figma_url" TEXT NOT NULL DEFAULT '',
        "figma_token" TEXT,
        "figma_file_key" TEXT NOT NULL DEFAULT '',
        "figma_node_id" TEXT NOT NULL DEFAULT '',
        "figma_node_name" TEXT NOT NULL DEFAULT '',
        "home_page" BOOLEAN NOT NULL DEFAULT 0,
        "last_known_route" TEXT NOT NULL DEFAULT '',
        "has_committed_changes" BOOLEAN NOT NULL DEFAULT 0,
        "created_at" DATETIME(3) NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
        "updated_at" DATETIME(3) NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await dataSource.query(`
      CREATE UNIQUE INDEX idx_pages_project_id_path ON pages(project_id, path);
    `);
  },

  async down(dataSource: DataSource): Promise<void> {
    await dataSource.query(`
      DROP INDEX idx_pages_project_id_path;
    `);

    await dataSource.query(`
      DROP TABLE "pages"
    `);
  },
};
