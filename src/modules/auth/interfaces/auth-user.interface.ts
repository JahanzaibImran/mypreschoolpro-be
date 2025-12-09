import { AppRole } from '../../../common/enums/app-role.enum';

export interface UserRole {
  id: string;
  role: AppRole;
  schoolId: string | null;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  roles: UserRole[];
  primaryRole: AppRole;
  schoolId: string | null;
}

export interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  schoolId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}