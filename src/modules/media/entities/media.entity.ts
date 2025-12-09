import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { LeadEntity } from '../../leads/entities/lead.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';

export enum MediaFileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

@Entity('media')
export class Media extends BaseEntity {
  @Column({ name: 'child_id', type: 'uuid' })
  childId: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ name: 'file_url', type: 'text' })
  fileUrl: string;

  @Column({
    name: 'file_type',
    type: 'enum',
    enum: MediaFileType,
  })
  fileType: MediaFileType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  // Relations
  @ManyToOne(() => LeadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'child_id' })
  child: LeadEntity;

  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;
}


