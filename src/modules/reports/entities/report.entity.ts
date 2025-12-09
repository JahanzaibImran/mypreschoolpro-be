import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';

@Entity('reports')
export class Report extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'report_name', type: 'text' })
  reportName: string;

  @Column({ name: 'report_type', type: 'text' })
  reportType: string;

  @Column({ name: 'file_name', type: 'text' })
  fileName: string;

  @Column({ name: 'file_size', type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ name: 'date_range_start', type: 'date', nullable: true })
  dateRangeStart: Date | null;

  @Column({ name: 'date_range_end', type: 'date', nullable: true })
  dateRangeEnd: Date | null;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata: Record<string, any> | null;

  // Relations
  @ManyToOne(() => SchoolEntity, { nullable: true })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity | null;
}
