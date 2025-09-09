import { DataSource } from 'typeorm';

export default {
  name: 'create-job-statuses',
  timestamp: '202509242151',

  async up(dataSource: DataSource): Promise<void> {
    await dataSource.query(`
      CREATE TABLE "job-statuses" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" TEXT NOT NULL DEFAULT '',
        "resource_id" INTEGER NOT NULL,
        "resource_type" TEXT NOT NULL,
        "error_code" INTEGER NOT NULL DEFAULT 0,
        "error_message" TEXT,
        "error_stack_trace" TEXT,
        "started_at" DATETIME(3),
        "finished_at" DATETIME(3),
        "data" TEXT,
        "created_at" DATETIME(3) NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
        "updated_at" DATETIME(3) NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
      )
    `);
  },

  async down(dataSource: DataSource): Promise<void> {
    await dataSource.query(`
      DROP TABLE "job-statuses"
    `);
  },
};
