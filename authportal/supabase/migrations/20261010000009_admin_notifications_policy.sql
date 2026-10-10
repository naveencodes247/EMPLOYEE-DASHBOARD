-- Migration: Allow Admins to view all notifications for organization-wide audit
-- File: 20261010000009_admin_notifications_policy.sql

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.work_notifications;
CREATE POLICY "Admins can view all notifications"
  ON public.work_notifications FOR SELECT
  USING ((SELECT app_security.is_admin()));
