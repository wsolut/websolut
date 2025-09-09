import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../entities';
import { PageEntity } from '../pages/page.entity';
import * as path from 'path';
import { JobStatusEntity } from '../job-statuses';

export const PROJECTS_DIR_NAME = 'projects';

@Entity('projects')
export class ProjectEntity extends BaseEntity {
  constructor(data?: Partial<ProjectEntity>) {
    super();

    Object.assign(this, data);
  }

  @Column({ name: 'name', type: 'text', default: '', collation: 'NOCASE' })
  name: string = '';

  @Column({ name: 'description', type: 'text', default: '' })
  description: string = '';

  @Column({ name: 'figma_token', type: 'text', nullable: true })
  figmaToken: string | null = null;

  @Column({ name: 'tags', type: 'simple-array', default: '' })
  tags: string[] = [];

  @Column({ name: 'out_dir_path', type: 'text', nullable: true })
  outDirPath: string | null = null;

  @Column({ name: 'templates_dir_path', type: 'text', nullable: true })
  templatesDirPath: string | null = null;

  @Column({ name: 'assets_out_dir', type: 'text', nullable: true })
  assetsOutDir: string | null = null;

  @Column({ name: 'assets_prefix_path', type: 'text', nullable: true })
  assetsPrefixPath: string | null = null;

  @OneToMany(() => PageEntity, (page) => page.project, {
    cascade: true,
    eager: true,
  })
  pages!: PageEntity[];

  jobStatuses: JobStatusEntity[] = [];

  get pathForInternalExport(): string {
    return path.join(PROJECTS_DIR_NAME, this.id.toString());
  }
}
