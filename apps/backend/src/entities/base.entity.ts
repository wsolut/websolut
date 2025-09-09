import {
  PrimaryGeneratedColumn,
  Entity,
  Column,
  BeforeUpdate,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    precision: 3,
    default: () => "(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))",
  })
  createdAt!: Date;

  @Column({
    name: 'updated_at',
    type: 'datetime',
    default: () => "(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))",
  })
  protected _updatedAt!: Date;
  protected _updatedAtManuallySet = false;

  get updatedAt(): Date {
    return this._updatedAt;
  }

  set updatedAt(value: Date) {
    this._updatedAt = value;
    this._updatedAtManuallySet = true;
  }

  @BeforeUpdate()
  beforeUpdate(): void {
    if (!this._updatedAtManuallySet) {
      this._updatedAt = new Date();
    }
    // Reset the flag for next update
    this._updatedAtManuallySet = false;
  }
}
