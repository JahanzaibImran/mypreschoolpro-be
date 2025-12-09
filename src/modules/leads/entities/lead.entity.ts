import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SchoolEntity } from '../../schools/entities/school.entity';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  CONVERTED = 'converted',
  LOST = 'lost',
  NURTURING = 'nurturing',
  REGISTERED = 'registered',
  INVOICE_SENT = 'invoice_sent',
  APPROVED_FOR_REGISTRATION = 'approved_for_registration',
  ENROLLED = 'enrolled',
  TOURED = 'toured',
  INTERESTED = 'interested',
  NOT_INTERESTED = 'not_interested',
  DECLINED = 'declined',
  DROPPED = 'dropped',
  WAITLISTED = 'waitlisted',
  OFFER_SENT = 'offer_sent',
  CONFIRMED = 'confirmed',
}

export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  WALK_IN = 'walk_in',
  PHONE = 'phone',
  EMAIL = 'email',
  SOCIAL_MEDIA = 'social_media',
  ADVERTISEMENT = 'advertisement',
  OTHER = 'other',
}

@Entity('leads')
export class LeadEntity extends BaseEntity {

  // Parent/Guardian Information
  @Column({ type: 'text', nullable: false, name: 'parent_name' })
  parentName: string;

  @Column({ type: 'text', nullable: false, name: 'parent_email' })
  parentEmail: string;

  @Column({ type: 'text', nullable: true, name: 'parent_phone' })
  parentPhone: string | null;

  @Column({ type: 'text', nullable: true, name: 'secondary_contact_name' })
  secondaryContactName: string | null;

  @Column({ type: 'text', nullable: true, name: 'secondary_contact_phone' })
  secondaryContactPhone: string | null;

  // Child Information
  @Column({ type: 'text', nullable: false, name: 'child_name' })
  childName: string;

  @Column({ type: 'date', nullable: true, name: 'child_birthdate' })
  childBirthdate: Date | null;

  // School and Program Information
  @Column({ type: 'uuid', nullable: false, name: 'school_id' })
  schoolId: string;

  @Column({ type: 'text', nullable: true, name: 'program' })
  program: string | null; // e.g., "Full Day", "Half Day", "Preschool", "Pre-K"

  @Column({ type: 'text', nullable: true, name: 'address' })
  address: string | null;

  @Column({ type: 'text', nullable: true, name: 'city' })
  city: string | null;

  @Column({ type: 'text', nullable: true, name: 'state' })
  state: string | null;

  @Column({ type: 'text', nullable: false, name: 'zip_code' })
  zipCode: string;

  @Column({ type: 'text', nullable: true, name: 'emergency_contact_name' })
  emergencyContactName: string | null;

  @Column({ type: 'text', nullable: true, name: 'emergency_contact_phone' })
  emergencyContactPhone: string | null;

  // Lead Management
  @Column({
    type: 'enum',
    enum: LeadStatus,
    default: LeadStatus.NEW,
    name: 'lead_status',
  })
  leadStatus: LeadStatus;

  @Column({ type: 'text', nullable: true, name: 'lead_source' })
  leadSourceText: string | null;

  @Column({
    type: 'enum',
    enum: LeadSource,
    nullable: true,
    default: LeadSource.WEBSITE,
    name: 'lead_source_new',
  })
  leadSource: LeadSource | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'tour_date' })
  tourDate: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'application_date' })
  applicationDate: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'follow_up_date' })
  followUpDate: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'next_follow_up_at' })
  nextFollowUpAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, default: () => 'now()', name: 'last_activity_at' })
  lastActivityAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'conversion_date' })
  conversionDate: Date | null;

  @Column({ type: 'integer', nullable: true, default: 0, name: 'priority_score' })
  priorityScore: number | null;

  @Column({ type: 'integer', nullable: true, default: 0, name: 'lead_score' })
  leadScore: number | null;

  @Column({ type: 'integer', nullable: true, name: 'lead_rating' })
  leadRating: number | null;

  @Column({ type: 'text', nullable: true, default: 'medium', name: 'urgency' })
  urgency: string | null;

  @Column({ type: 'text', nullable: true, default: 'manual', name: 'assignment_method' })
  assignmentMethod: string | null;

  @Column({ type: 'boolean', nullable: true, default: true, name: 'is_active' })
  isActive: boolean | null;

  @Column({ type: 'numeric', nullable: true, name: 'median_income' })
  medianIncome: number | null;

  @Column({ type: 'text', nullable: true, name: 'medical_notes' })
  medicalNotes: string | null;

  @Column({ type: 'jsonb', nullable: true, default: {}, name: 'scoring_data' })
  scoringData: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true, default: {}, name: 'score_breakdown' })
  scoreBreakdown: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true, default: {}, name: 'custom_fields' })
  customFields: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true, default: {}, name: 'lead_qualification' })
  leadQualification: Record<string, any> | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'failed', 'refunded'],
    nullable: true,
    name: 'payment_status',
  })
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | null;

  @Column({ type: 'uuid', nullable: true, name: 'assigned_to' })
  assignedTo: string | null; // User ID of the staff member assigned

  // Conversion Tracking (Note: converted_to_enrollment_id and converted_at may not exist in schema)
  // Leaving them commented out since they're not in the Supabase schema
  // If you need them, they should be added via migration first

  // Relations
  @ManyToOne(() => SchoolEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: SchoolEntity;
}


