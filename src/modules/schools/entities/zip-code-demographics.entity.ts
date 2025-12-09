import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('zip_code_demographics')
export class ZipCodeDemographics extends BaseEntity {
  @Column({ name: 'zip_code', type: 'varchar', length: 20, unique: true })
  zipCode: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ name: 'median_income', type: 'decimal', precision: 12, scale: 2, default: 0 })
  medianIncome: number;

  @Column({ type: 'integer', default: 0 })
  population: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;
}


