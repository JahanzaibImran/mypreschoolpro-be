import { AppRole } from '../enums/app-role.enum';

/**
 * JWT Payload interface matching Supabase JWT token structure.
 * This interface ensures type safety when working with JWT tokens.
 */
export interface JwtPayload {
  /** User ID (subject) from Supabase auth.users table */
  sub: string;
  
  /** User email address */
  email: string;
  
  /** User role (optional, may be in token or loaded from database) */
  role?: AppRole;
  
  /** School ID associated with the user (optional) */
  school_id?: string;
  
  /** Audience (typically 'authenticated' for Supabase) */
  aud?: string;
  
  /** Token expiration timestamp */
  exp?: number;
  
  /** Token issued at timestamp */
  iat?: number;
}



