import { Entity, Column, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import { BaseEntity } from '../entities';
import { ProjectEntity, PROJECTS_DIR_NAME } from '../projects/project.entity';
import * as path from 'path';
import { JobStatusEntity } from '../job-statuses';

export const PAGES_DIR_NAME = 'pages';

@Entity('pages')
export class PageEntity extends BaseEntity {
  constructor(data?: Partial<PageEntity>) {
    super();

    Object.assign(this, data);
  }

  @Column({ name: 'path', type: 'text', default: '' })
  path: string = '';

  @Column({ name: 'figma_node_name', type: 'text', default: '' })
  figmaNodeName: string = '';

  @Column({ name: 'last_known_route', type: 'text', default: '' })
  lastKnownRoute: string = '';

  @Column({ name: 'figma_url', type: 'text', default: '' })
  figmaUrl: string = '';

  @Column({ name: 'figma_token', type: 'text', nullable: true })
  figmaToken: string | null = null;

  @Column({ name: 'figma_file_key', type: 'text', default: '' })
  figmaFileKey: string = '';

  @Column({ name: 'figma_node_id', type: 'text', default: '' })
  figmaNodeId: string = '';

  @Column({ name: 'home_page', type: 'boolean' })
  homePage: boolean = false;

  @Column({ name: 'has_committed_changes', type: 'boolean' })
  hasCommittedChanges: boolean = false;

  @ManyToOne(() => ProjectEntity, (project) => project.pages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([{ name: 'project_id', referencedColumnName: 'id' }])
  project!: ProjectEntity;

  @RelationId((page: PageEntity) => page.project)
  projectId!: number;

  jobStatuses: JobStatusEntity[] = [];

  get pathForInternalExport(): string {
    return path.join(PAGES_DIR_NAME, this.id.toString());
  }

  get contentVariantName(): string {
    return `${PROJECTS_DIR_NAME}_${this.projectId}`;
  }

  get hasPreview(): boolean {
    // if (this.synchronizeErrorCode > 0) return false;
    // if (!this.finishedSynchronizingAt) return false;
    // if (this.synchronizing) return false;

    return false;
  }
}
