import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthHeader } from './components/auth/AuthHeader';
import { AuthFooter } from './components/auth/AuthFooter';
import { SignInForm } from './components/auth/SignInForm';
import { EmailVerificationView } from './components/auth/EmailVerificationView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { ResetPasswordView } from './components/auth/ResetPasswordView';
import { CompanyCustomizerModal } from './components/auth/CompanyCustomizerModal';
import { EmployeePortal } from './components/employee/EmployeePortal';
import { ManagerPortal } from './components/manager/ManagerPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { TemporaryDashboardViewer, type DashboardViewType } from './components/ui/TemporaryDashboardViewer';
import { DEFAULT_BRAND_CONFIG } from './constants/branding';
import { supabase } from './lib/supabase';
import { authService } from './services/auth';
import type { AuthScreen, BrandConfig } from './types/auth';
import type { UserProfile } from './types/work';

type AppViewMode =
  | 'auth'
  | 'employee'
  | 'manager'
  | 'admin';

function MainApp() {
  const [viewMode, setViewMode] = useState<AppViewMode>('auth');
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('signIn');
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(DEFAULT_BRAND_CONFIG);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [registeredApplicantName, setRegisteredApplicantName] = useState('Applicant');
  const [registeredRole, setRegisteredRole] = useState<'employee' | 'manager'>('employee');
  const [registeredJobTitle, setRegisteredJobTitle] = useState('Team Member');
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [previewEmployeeId, setPreviewEmployeeId] = useState<string>('EMP03');
  const [previewEmployeeProfile, setPreviewEmployeeProfile] = useState<UserProfile | null>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // In development / preview mode, sync preview employee (default EMP03)
  useEffect(() => {
    if (viewMode === 'employee' && (!currentUserProfile || currentUserProfile.role !== 'employee')) {
      supabase
        .from('profiles')
        .select('*')
        .eq('system_id', previewEmployeeId)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile) {
            setPreviewEmployeeProfile({
              id: profile.id,
              name: profile.full_name || 'outFyt Member',
              email: profile.email,
              role: 'employee',
              department: 'Engineering Operations',
              jobTitle: profile.job_title || 'Associate',
              employeeId: profile.system_id || previewEmployeeId,
              avatarUrl: profile.avatar_url || null,
              timezone: profile.timezone || 'Asia/Kolkata',
              todayAttendance: {
                isCheckedIn: true,
                checkInTime: '09:00 AM',
                isOnBreak: false,
                breakStartTime: null,
                elapsedWorkingMinutes: 480,
              },
            });
          }
        });
    }
  }, [viewMode, previewEmployeeId, currentUserProfile]);

  // Helper to load and sync real user profile from Supabase
  const syncUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        setCurrentUserProfile({
          id: profile.id,
          name: profile.full_name || 'outFyt Member',
          email: profile.email,
          role: profile.role,
          department: 'Engineering Operations',
          jobTitle: profile.job_title || (profile.role === 'admin' ? 'System Administrator' : 'Associate'),
          employeeId: profile.system_id || 'ID-0001',
          avatarUrl: profile.avatar_url || null,
          timezone: profile.timezone || 'Asia/Kolkata',
          todayAttendance: {
            isCheckedIn: true,
            checkInTime: '09:00 AM',
            isOnBreak: false,
            breakStartTime: null,
            elapsedWorkingMinutes: 480,
          },
        });
      }
    } catch {
      // Ignore
    }
  };

  // Initialize and listen for Supabase Auth state changes
  useEffect(() => {
    const handleAuthSession = async (session: any) => {
      if (!session?.user) return;
      const userEmail = session.user.email || '';
      const meta = session.user.user_metadata || {};
      if (userEmail) setVerificationEmail(userEmail);
      if (meta.full_name) setRegisteredApplicantName(meta.full_name);
      if (meta.role === 'manager' || meta.role === 'employee') {
        setRegisteredRole(meta.role);
      }
      if (meta.job_title) setRegisteredJobTitle(meta.job_title);

      // Sync pending Google OAuth role/title and profile avatar
      try {
        const pendingRole = typeof window !== 'undefined' ? localStorage.getItem('pending_oauth_role') : null;
        const pendingJobTitle = typeof window !== 'undefined' ? localStorage.getItem('pending_oauth_job_title') : null;
        if (pendingRole || pendingJobTitle) {
          localStorage.removeItem('pending_oauth_role');
          localStorage.removeItem('pending_oauth_job_title');
          await supabase
            .from('profiles')
            .update({
              role: pendingRole === 'manager' ? 'manager' : 'employee',
              job_title: pendingJobTitle || undefined,
            })
            .eq('id', session.user.id)
            .neq('role', 'admin');
        }

        const googleAvatar = meta.avatar_url || meta.picture;
        if (googleAvatar) {
          await supabase
            .from('profiles')
            .update({ avatar_url: googleAvatar })
            .eq('id', session.user.id)
            .is('avatar_url', null);
        }
      } catch {
        // Non-blocking sync
      }

      try {
        const statusResult = await authService.checkAccountStatus(session.user.id);
        if (statusResult.status === 'active') {
          await syncUserProfile(session.user.id);
          if (statusResult.role === 'manager') setViewMode('manager');
          else if (statusResult.role === 'admin') {
            const currentHash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
            if (!currentHash || currentHash === 'admin') {
              window.location.hash = 'overview';
            }
            setViewMode('admin');
          }
          else setViewMode('employee');
        } else if (statusResult.status === 'suspended' || statusResult.status === 'rejected') {
          // Account is suspended or inactive
          await authService.signOut();
          setCurrentUserProfile(null);
          setViewMode('auth');
          setCurrentScreen('signIn');
        }
      } catch {
        // Gracefully fallback
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      handleAuthSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAccountCreated = (
    email: string,
    fullName?: string,
    requestedRole: 'employee' | 'manager' = 'employee',
    jobTitle: string = 'Team Member',
    emailConfirmed?: boolean
  ) => {
    setVerificationEmail(email);
    const applicantName = fullName || email.split('@')[0].replace('.', ' ') || 'New Applicant';
    setRegisteredApplicantName(applicantName);
    setRegisteredRole(requestedRole);
    setRegisteredJobTitle(jobTitle);

    if (emailConfirmed) {
      setViewMode(requestedRole);
    } else {
      setCurrentScreen('verifyEmail');
    }
  };

  const handleEmailConfirmed = () => {
    setViewMode(registeredRole);
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUserProfile(null);
    setViewMode('auth');
    setCurrentScreen('signIn');
  };

  // Dashboard preview controls for localhost development inspection
  const isLocalhostOrDev =
    import.meta.env.DEV ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '::1'));

  const showDashboardViewer =
    isLocalhostOrDev && import.meta.env.VITE_DISABLE_PREVIEW !== 'true';

  const handleSelectDashboardView = (view: DashboardViewType) => {
    if (view === 'auth') {
      setViewMode('auth');
      setCurrentScreen('signIn');
      return;
    }

    // Role Guard: Prevent privilege escalation if an authenticated session exists
    if (currentUserProfile) {
      if (view === 'admin' && currentUserProfile.role !== 'admin') {
        alert('Access Denied: Administrative console requires an authorized Administrator account.');
        return;
      }
      if (view === 'manager' && currentUserProfile.role === 'employee') {
        alert('Access Denied: Manager portal requires an authorized Manager account.');
        return;
      }
    }

    if (view === 'admin') {
      window.location.hash = 'overview';
    }
    setViewMode(view);
  };

  const activeViewerSelection: DashboardViewType =
    viewMode === 'auth' ? 'auth' : viewMode;

  // ---------------------------------------------------------------------------
  // Protected Role Portals (Accessible strictly to verified & active users)
  // ---------------------------------------------------------------------------
  if (viewMode === 'employee') {
    const isPreviewingOther = currentUserProfile && currentUserProfile.role !== 'employee';
    const effectiveEmployeeProfile =
      currentUserProfile && currentUserProfile.role === 'employee'
        ? currentUserProfile
        : previewEmployeeProfile;

    return (
      <>
        {isPreviewingOther && (
          <div className="bg-[#C5A059]/15 border-b border-[#C5A059]/30 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[var(--text-primary)] z-40 relative">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#C5A059] uppercase tracking-wider text-[11px]">
                Employee Workspace Preview
              </span>
              <span className="text-[var(--text-muted)]">·</span>
              <span>
                Active Employee:{' '}
                <strong className="font-semibold text-[var(--text-primary)]">
                  {effectiveEmployeeProfile?.name || 'Naveen Kumar'} ({effectiveEmployeeProfile?.employeeId || previewEmployeeId})
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-muted)]">Switch Employee Account:</span>
              <select
                value={previewEmployeeId}
                onChange={(e) => setPreviewEmployeeId(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] font-medium text-xs text-[var(--text-primary)] cursor-pointer outline-none shadow-xs"
              >
                <option value="EMP01">EMP01 — Priya Sharma (Team Member)</option>
                <option value="EMP02">EMP02 — Rohan Mehta (Senior Full-Stack Engineer)</option>
                <option value="EMP03">EMP03 — Naveen Kumar (Graphic & UI Designer)</option>
                <option value="EMP04">EMP04 — Priyanshu Kumar (QA Automation Engineer)</option>
                <option value="EMP05">EMP05 — Vikram Singh (DevOps & Cloud Engineer)</option>
                <option value="EMP06">EMP06 — Neha Patel (Backend Systems Developer)</option>
                <option value="EMP07">EMP07 — Karan Malhotra (QA & Automation Engineer)</option>
                <option value="EMP08">EMP08 — Sneha Iyer (Product & UX Designer)</option>
                <option value="EMP09">EMP09 — Arjun Rao (Infrastructure Specialist)</option>
                <option value="EMP10">EMP10 — Pooja Nair (Operations Associate)</option>
              </select>
            </div>
          </div>
        )}
        <EmployeePortal
          brandConfig={brandConfig}
          currentUserProfile={effectiveEmployeeProfile || undefined}
          onSignOut={handleSignOut}
          onUpdateUserProfile={(updated) => {
            if (currentUserProfile && currentUserProfile.role === 'employee') {
              setCurrentUserProfile((prev) => (prev ? { ...prev, ...updated } : (updated as any)));
            } else {
              setPreviewEmployeeProfile((prev) => (prev ? { ...prev, ...updated } : (updated as any)));
            }
          }}
        />
        {showDashboardViewer && (
          <TemporaryDashboardViewer
            currentView={activeViewerSelection}
            onSelectView={handleSelectDashboardView}
          />
        )}
      </>
    );
  }

  if (viewMode === 'manager') {
    return (
      <>
        <ManagerPortal
          brandConfig={brandConfig}
          currentUserProfile={currentUserProfile || undefined}
          onSignOut={handleSignOut}
          onUpdateUserProfile={(updated) => {
            setCurrentUserProfile((prev) => (prev ? { ...prev, ...updated } : (updated as any)));
          }}
        />
        {showDashboardViewer && (
          <TemporaryDashboardViewer
            currentView={activeViewerSelection}
            onSelectView={handleSelectDashboardView}
          />
        )}
      </>
    );
  }

  if (viewMode === 'admin') {
    // Trusted Admin Role Verification: Non-admin accounts cannot access Admin pages
    if (currentUserProfile && currentUserProfile.role !== 'admin') {
      return currentUserProfile.role === 'manager' ? (
        <>
          <ManagerPortal
            brandConfig={brandConfig}
            currentUserProfile={currentUserProfile}
            onSignOut={handleSignOut}
            onUpdateUserProfile={(updated) => {
              setCurrentUserProfile((prev) => (prev ? { ...prev, ...updated } : (updated as any)));
            }}
          />
          {showDashboardViewer && (
            <TemporaryDashboardViewer
              currentView="manager"
              onSelectView={handleSelectDashboardView}
            />
          )}
        </>
      ) : (
        <>
          <EmployeePortal
            brandConfig={brandConfig}
            currentUserProfile={currentUserProfile}
            onSignOut={handleSignOut}
            onUpdateUserProfile={(updated) => {
              setCurrentUserProfile((prev) => (prev ? { ...prev, ...updated } : (updated as any)));
            }}
          />
          {showDashboardViewer && (
            <TemporaryDashboardViewer
              currentView="employee"
              onSelectView={handleSelectDashboardView}
            />
          )}
        </>
      );
    }

    return (
      <>
        <AdminPortal
          brandConfig={brandConfig}
          currentUserProfile={currentUserProfile || undefined}
          onUpdateBrandConfig={setBrandConfig}
          onSignOut={handleSignOut}
          onUpdateUserProfile={(updated) => {
            setCurrentUserProfile((prev) => (prev ? { ...prev, ...updated } : (updated as any)));
          }}
        />
        {showDashboardViewer && (
          <TemporaryDashboardViewer
            currentView={activeViewerSelection}
            onSelectView={handleSelectDashboardView}
          />
        )}
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Public Authentication Stage (Employee ID + Password Sign In, Password Reset)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col justify-between transition-colors duration-200">
      {/* Top Application Bar */}
      <AuthHeader
        brandConfig={brandConfig}
        onOpenBrandModal={() => setIsBrandModalOpen(true)}
      />

      {/* Main Authentication Centered Stage */}
      <main className="flex-1 flex items-center justify-center px-4 py-4 sm:py-6">
        <div className="w-full max-w-md mx-auto">
          {/* Centered Authentication Card Surface */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-xs p-5 sm:p-7 transition-all duration-200">
            {currentScreen === 'signIn' && (
              <SignInForm
                brandConfig={brandConfig}
                onNavigateToForgotPassword={() => setCurrentScreen('forgotPassword')}
                onSignInSuccess={(role, profile) => {
                  if (profile) {
                    setCurrentUserProfile({
                      id: profile.id,
                      name: profile.full_name || 'outFyt Member',
                      email: profile.email,
                      role: profile.role,
                      department: 'Engineering Operations',
                      jobTitle: profile.job_title || (profile.role === 'admin' ? 'System Administrator' : 'Associate'),
                      employeeId: profile.system_id || 'ID-0001',
                      avatarUrl: profile.avatar_url || null,
                      timezone: profile.timezone || 'Asia/Kolkata',
                      todayAttendance: {
                        isCheckedIn: true,
                        checkInTime: '09:00 AM',
                        isOnBreak: false,
                        breakStartTime: null,
                        elapsedWorkingMinutes: 480,
                      },
                    });
                  }
                  if (role === 'admin') {
                    if (typeof window !== 'undefined') {
                      window.location.hash = 'overview';
                    }
                    setViewMode('admin');
                  } else if (role === 'manager') {
                    setViewMode('manager');
                  } else {
                    setViewMode('employee');
                  }
                }}
              />
            )}

            {currentScreen === 'verifyEmail' && (
              <EmailVerificationView
                email={verificationEmail || 'user@company.com'}
                brandConfig={brandConfig}
                onNavigateToSignIn={() => setCurrentScreen('signIn')}
                onChangeEmail={() => setCurrentScreen('signIn')}
                onEmailVerified={handleEmailConfirmed}
              />
            )}

            {currentScreen === 'forgotPassword' && (
              <ForgotPasswordView
                brandConfig={brandConfig}
                onNavigateToSignIn={() => setCurrentScreen('signIn')}
                onNavigateToResetPassword={() => setCurrentScreen('resetPassword')}
              />
            )}

            {currentScreen === 'resetPassword' && (
              <ResetPasswordView
                brandConfig={brandConfig}
                onNavigateToSignIn={() => setCurrentScreen('signIn')}
                onRequestNewLink={() => setCurrentScreen('forgotPassword')}
              />
            )}
          </div>
        </div>
      </main>

      {/* Subtle Copyright Footer */}
      <AuthFooter brandConfig={brandConfig} />

      {/* Company/Product Placeholder Customizer */}
      <CompanyCustomizerModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        brandConfig={brandConfig}
        onSave={(newConfig) => setBrandConfig(newConfig)}
      />

      {/* Temporary Dashboard Viewer */}
      {showDashboardViewer && (
        <TemporaryDashboardViewer
          currentView={activeViewerSelection}
          onSelectView={handleSelectDashboardView}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
