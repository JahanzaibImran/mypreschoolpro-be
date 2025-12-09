-- Migration to create users table (replacing Supabase auth.users dependency)
-- Run this migration to set up custom authentication system

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update profiles table to reference our users table instead of auth.users
ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update user_roles table to reference our users table
ALTER TABLE public.user_roles 
    DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update other tables that reference auth.users
-- Schools owner_id
ALTER TABLE public.schools 
    DROP CONSTRAINT IF EXISTS schools_owner_id_fkey;

ALTER TABLE public.schools 
    ADD CONSTRAINT schools_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES public.users(id);

-- Students teacher_id
ALTER TABLE public.students 
    DROP CONSTRAINT IF EXISTS students_teacher_id_fkey;

ALTER TABLE public.students 
    ADD CONSTRAINT students_teacher_id_fkey 
    FOREIGN KEY (teacher_id) REFERENCES public.users(id);

-- Classes teacher_id  
ALTER TABLE public.classes 
    DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey;

ALTER TABLE public.classes 
    ADD CONSTRAINT classes_teacher_id_fkey 
    FOREIGN KEY (teacher_id) REFERENCES public.users(id);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);







