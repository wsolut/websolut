import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../entities';

@Entity('job-statuses')
export class JobStatusEntity extends BaseEntity {
  constructor(data?: Partial<JobStatusEntity>) {
    super();

    Object.assign(this, data);
  }

  @Column({ name: 'name', type: 'text', default: '' })
  name: string = '';

  @Column({ name: 'resource_id', type: 'int8', nullable: false })
  resourceId: number = 0;

  @Column({ name: 'resource_type', type: 'text', nullable: false })
  resourceType: string = '';

  @Column({ name: 'started_at', type: 'datetime', nullable: true })
  startedAt: Date | null = null;

  @Column({ name: 'finished_at', type: 'datetime', nullable: true })
  finishedAt: Date | null = null;

  @Column({ name: 'data', type: 'json', nullable: true })
  data: object = {};

  @Column({ name: 'error_code', type: 'int8', default: 0 })
  errorCode: number = 0;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null = null;

  @Column({
    name: 'error_stack_trace',
    type: 'text',
    nullable: true,
  })
  errorStackTrace: string | null = null;
}
