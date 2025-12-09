import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';

@Entity('lead_scoring_config')
export class LeadScoringConfig extends BaseEntity {
  @Column({ name: 'config_name', type: 'varchar', length: 255, unique: true })
  configName: string;

  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  @Column({ name: 'proximity_weight', type: 'decimal', precision: 5, scale: 2, default: 0.3 })
  proximityWeight: number;

  @Column({ name: 'income_weight', type: 'decimal', precision: 5, scale: 2, default: 0.4 })
  incomeWeight: number;

  @Column({ name: 'age_weight', type: 'decimal', precision: 5, scale: 2, default: 0.3 })
  ageWeight: number;

  @Column({ name: 'max_distance_miles', type: 'decimal', precision: 10, scale: 2, default: 25 })
  maxDistanceMiles: number;

  @Column({ name: 'min_income_threshold', type: 'decimal', precision: 12, scale: 2, default: 0 })
  minIncomeThreshold: number;

  @Column({ name: 'max_income_threshold', type: 'decimal', precision: 12, scale: 2, default: 200000 })
  maxIncomeThreshold: number;

  @Column({ name: 'ideal_age_min', type: 'integer', default: 2 })
  idealAgeMin: number;

  @Column({ name: 'ideal_age_max', type: 'integer', default: 5 })
  idealAgeMax: number;
}


