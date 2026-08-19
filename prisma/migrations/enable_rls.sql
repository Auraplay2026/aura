-- ============================================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) HARDENING MIGRATION
-- Project: ipzqtmbxzoooimbcowcm
-- ============================================================================

-- 1. Enable Row-Level Security on all application tables
ALTER TABLE IF EXISTS public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Position" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."ActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."SupportConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."SupportChat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."SupportMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."GameSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."UserStreak" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."StreakHistory" ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all public anonymous access over PostgREST API
REVOKE ALL ON public."User" FROM anon;
REVOKE ALL ON public."Position" FROM anon;
REVOKE ALL ON public."Transaction" FROM anon;
REVOKE ALL ON public."Notification" FROM anon;
REVOKE ALL ON public."ActivityLog" FROM anon;
REVOKE ALL ON public."SupportConfig" FROM anon;
REVOKE ALL ON public."SupportChat" FROM anon;
REVOKE ALL ON public."SupportMessage" FROM anon;
REVOKE ALL ON public."GameSession" FROM anon;
REVOKE ALL ON public."UserStreak" FROM anon;
REVOKE ALL ON public."StreakHistory" FROM anon;

-- 3. Revoke generic authenticated PostgREST access (Prisma / Next.js backend uses direct postgres role)
REVOKE ALL ON public."User" FROM authenticated;
REVOKE ALL ON public."Position" FROM authenticated;
REVOKE ALL ON public."Transaction" FROM authenticated;
REVOKE ALL ON public."Notification" FROM authenticated;
REVOKE ALL ON public."ActivityLog" FROM authenticated;
REVOKE ALL ON public."SupportConfig" FROM authenticated;
REVOKE ALL ON public."SupportChat" FROM authenticated;
REVOKE ALL ON public."SupportMessage" FROM authenticated;
REVOKE ALL ON public."GameSession" FROM authenticated;
REVOKE ALL ON public."UserStreak" FROM authenticated;
REVOKE ALL ON public."StreakHistory" FROM authenticated;
