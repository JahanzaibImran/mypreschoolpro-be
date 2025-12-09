export enum AppRole {
  SUPER_ADMIN = 'super_admin',
  SCHOOL_OWNER = 'school_owner',
  SCHOOL_ADMIN = 'school_admin',
  ADMISSIONS_STAFF = 'admissions_staff',
  TEACHER = 'teacher',
  PARENT = 'parent',
}

export const APP_ROLE_PRIORITY: Record<AppRole, number> = {
  [AppRole.SUPER_ADMIN]: 1,
  [AppRole.SCHOOL_OWNER]: 2,
  [AppRole.SCHOOL_ADMIN]: 3,
  [AppRole.ADMISSIONS_STAFF]: 4,
  [AppRole.TEACHER]: 5,
  [AppRole.PARENT]: 6,
};

