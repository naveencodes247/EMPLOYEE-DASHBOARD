-- Migration: 20261010000008_add_phone_to_profiles.sql
-- Add phone number field to profiles table for corporate contact management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
