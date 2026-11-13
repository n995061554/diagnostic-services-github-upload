import React, { useState, useEffect } from 'react';
import {
  Building2,
  Lock,
  Mail,
  Phone,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Clock,
  KeyRound,
  Check,
  X,
  Briefcase
} from 'lucide-react';
import { customerApiService, customerAuthStore } from '../customerApiService';
import { CustomerAuthSession, CustomerRole } from '../customerAppTypes';

export interface CustomerAuthViewProps {
  onAuthenticated: (session: CustomerAuthSession) => void;
}

type AuthScreen = 'welcome' | 'lab_signin' | 'office_signin' | 'register' | 'otp' | 'forgot_password' | 'reset_password';

export const CustomerAuthView: React.FC<CustomerAuthViewProps> = ({ onAuthenticated }) => {
  const [screen, setScreen] = useState<AuthScreen>('welcome');

  // Laboratory Sign In State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Office Sign In State
  const [officeIdentifier, setOfficeIdentifier] = useState('');
  const [officePassword, setOfficePassword] = useState('');
  const [showOfficePassword, setShowOfficePassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Registration Form State (Mandatory Fields)
  const [regLabName, setRegLabName] = useState('');
  const [regContactName, setRegContactName] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // OTP Verification State
  const [otpToken, setOtpToken] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState<number>(600);
  const [activeIdentifier, setActiveIdentifier] = useState<string>('');

  // Password Reset State
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Resend Timer Countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // OTP Expiry Countdown
  useEffect(() => {
    if (screen !== 'otp' || otpExpirySeconds <= 0) return;
    const timer = setInterval(() => {
      setOtpExpirySeconds(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, otpExpirySeconds]);

  // Validation Helpers
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
  };

  const passwordValidation = {
    length: regPassword.length >= 8,
    upper: /[A-Z]/.test(regPassword),
    lower: /[a-z]/.test(regPassword),
    number: /[0-9]/.test(regPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(regPassword),
    matches: regPassword === regConfirmPassword && regConfirmPassword.length > 0
  };

  const isPasswordStrong =
    passwordValidation.length &&
    passwordValidation.upper &&
    passwordValidation.lower &&
    passwordValidation.number &&
    passwordValidation.special;

  // Handle Laboratory Account Sign In
  const handleLabSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage('Please enter your laboratory mobile number or email ID, and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await customerApiService.loginCustomer(loginIdentifier.trim(), loginPassword);
      if (res.success && res.session) {
        const role = res.session.role || res.session.user?.customerRole || res.session.user?.roleType;
        if (
          role === 'SERVICE_ENGINEER' ||
          role === 'SALES_PERSON' ||
          role === 'OFFICE_ADMIN' ||
          role === 'OFFICE_STAFF' ||
          role === 'SUPER_ADMIN'
        ) {
          setErrorMessage('Office staff accounts cannot sign in through the Laboratory Portal. Please use the Office Use Only login.');
          return;
        }
        onAuthenticated(res.session);
      } else {
        if (res.isPendingActivation) {
          setActiveIdentifier(loginIdentifier.trim());
          setOtpToken(res.otpToken || '');
          setDebugOtp(res.debugOtp || null);
          setScreen('otp');
          setErrorMessage('Account is pending OTP verification. Please enter the 6-digit code.');
        } else {
          setErrorMessage(res.message || 'Invalid laboratory credentials.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Office Use Only Sign In
  const handleOfficeSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!officeIdentifier.trim() || !officePassword) {
      setErrorMessage('Please enter your official employee ID or email address, and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await customerApiService.loginCustomer(officeIdentifier.trim(), officePassword);
      if (res.success && res.session) {
        const role = res.session.role || res.session.user?.customerRole || res.session.user?.roleType;
        if (
          role === 'OWNER' ||
          role === 'ADMIN' ||
          role === 'VIEWER' ||
          role === 'CUSTOMER'
        ) {
          setErrorMessage('Customer accounts cannot access the Internal Office Portal. Please sign in via the Laboratory Portal.');
          return;
        }
        onAuthenticated(res.session);
      } else {
        setErrorMessage(res.message || 'Invalid employee credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Registration Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (
      !regLabName.trim() ||
      !regContactName.trim() ||
      !regAddress.trim() ||
      !regEmail.trim() ||
      !regPhone.trim() ||
      !regPassword
    ) {
      setErrorMessage('Please fill in all mandatory fields marked with an asterisk (*).');
      return;
    }

    if (!isValidEmail(regEmail)) {
      setErrorMessage('Please provide a valid institutional or personal email address.');
      return;
    }

    if (!isValidPhone(regPhone)) {
      setErrorMessage('Please provide a valid 10-digit mobile number.');
      return;
    }

    if (!isPasswordStrong) {
      setErrorMessage('Password does not meet strong security requirements.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Password confirmation does not match chosen password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await customerApiService.registerCustomer({
        labName: regLabName.trim(),
        contactPersonName: regContactName.trim(),
        labAddress: regAddress.trim(),
        email: regEmail.trim(),
        contactNumber: regPhone.trim(),
        password: regPassword,
        confirmPassword: regConfirmPassword
      });

      if (res.success) {
        setActiveIdentifier(regEmail.trim());
        setOtpToken(res.otpToken || '');
        setDebugOtp(res.debugOtp || null);
        setOtpDigits(['', '', '', '', '', '']);
        setResendCooldown(30);
        setOtpExpirySeconds(600);
        setScreen('otp');
        setSuccessMessage('Registration initiated! Enter the 6-digit OTP code sent to your contact.');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP Digit Input
  const handleOtpChange = (index: number, value: string) => {
    const val = value.slice(-1);
    const updated = [...otpDigits];
    updated[index] = val;
    setOtpDigits(updated);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle OTP Verification Submit
  const handleVerifyOtp = async () => {
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (screen === 'otp') {
        const res = await customerApiService.verifyRegistrationOtp({
          otpToken,
          otp: enteredOtp,
          identifier: activeIdentifier
        });

        if (res.success && res.session) {
          onAuthenticated(res.session);
        } else {
          setErrorMessage(res.message);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage(null);
    try {
      const res = await customerApiService.resendOtp({
        otpToken,
        identifier: activeIdentifier
      });
      if (res.success) {
        if (res.otpToken) setOtpToken(res.otpToken);
        if (res.debugOtp) setDebugOtp(res.debugOtp);
        setResendCooldown(30);
        setOtpExpirySeconds(600);
        setSuccessMessage('Fresh 6-digit verification OTP dispatched!');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend OTP.');
    }
  };

  // Handle Forgot Password Step 1
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your registered mobile number or email ID.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await customerApiService.forgotPassword(loginIdentifier.trim());
      if (res.success) {
        setActiveIdentifier(loginIdentifier.trim());
        setResetToken(res.token || '');
        setDebugOtp(res.debugOtp || null);
        setOtpDigits(['', '', '', '', '', '']);
        setScreen('reset_password');
        setSuccessMessage('Verification code dispatched to your registered contact.');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reset Password Step 2 & 3
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Password confirmation does not match new password.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      // 1. Verify OTP
      const vRes = await customerApiService.verifyOtp(activeIdentifier, enteredOtp, resetToken);
      if (!vRes.success) {
        setErrorMessage(vRes.message);
        setIsSubmitting(false);
        return;
      }

      // 2. Set New Password
      const rRes = await customerApiService.resetPassword(activeIdentifier, vRes.resetToken || resetToken, newPassword);
      if (rRes.success) {
        setScreen('lab_signin');
        setSuccessMessage('Password reset successfully! Please sign in with your new password.');
        setLoginPassword('');
      } else {
        setErrorMessage(rRes.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0E1035] text-white font-sans overflow-y-auto select-none">
      {/* ------------------------------------------------------------------ */}
      {/* BRAND HEADER BAR */}
      {/* ------------------------------------------------------------------ */}
      <div className="pt-8 pb-4 px-5 flex items-center justify-between border-b border-[#15253F] bg-[#0E1035]/95 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-white shadow-md p-0.5 shrink-0 border border-[#D0DEE5]/40 flex items-center justify-center">
            <img src="/logo.jpeg" alt="Diagnostic Services" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-tight">Diagnostic Services</h1>
            <p className="text-[10px] text-[#D0DEE5] font-semibold">Institutional Customer Portal</p>
          </div>
        </div>

        {screen !== 'welcome' && (
          <button
            id="btn-auth-back"
            onClick={() => {
              setErrorMessage(null);
              setSuccessMessage(null);
              if (screen === 'lab_signin' || screen === 'office_signin') setScreen('welcome');
              else if (screen === 'register') setScreen('welcome');
              else if (screen === 'otp') setScreen('register');
              else if (screen === 'forgot_password') setScreen('lab_signin');
              else if (screen === 'reset_password') setScreen('forgot_password');
            }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#D0DEE5] transition cursor-pointer flex items-center gap-1 text-xs px-2.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* NOTIFICATIONS & ALERTS */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-5 pt-3">
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded-2xl flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in shadow-md">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug font-medium">{errorMessage}</div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white cursor-pointer">&times;</button>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-200 animate-in fade-in shadow-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug font-medium">{successMessage}</div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white cursor-pointer">&times;</button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SCREEN 1: CLEAN MAIN WELCOME SCREEN (Strict Requirement 1) */}
      {/* ------------------------------------------------------------------ */}
      {screen === 'welcome' && (
        <div className="flex-1 px-6 py-8 flex flex-col justify-between items-center text-center animate-in fade-in select-none">
          {/* Top / Center Branding Section */}
          <div className="w-full flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white p-2.5 shadow-2xl border-2 border-[#D0DEE5]/40 flex items-center justify-center">
              <img src="/logo.jpeg" alt="Diagnostic Services" className="w-full h-full object-contain rounded-2xl" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                Diagnostic Services
              </h2>
              <p className="text-xs font-semibold text-[#D0DEE5] tracking-wide">
                Institutional Customer Portal
              </p>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="w-full space-y-3.5 max-w-sm">
            <button
              id="btn-sign-in-lab"
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setScreen('lab_signin');
              }}
              className="w-full py-4 px-5 bg-white text-[#0E1035] hover:bg-[#D0DEE5] font-black rounded-2xl text-sm transition shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>Sign In to Laboratory Account</span>
              <ArrowRight className="w-4 h-4 text-[#0E1035]" />
            </button>

            <button
              id="btn-create-account"
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setScreen('register');
              }}
              className="w-full py-3.5 px-5 bg-[#15253F] hover:bg-[#2B3D5B] text-white font-bold rounded-2xl text-sm transition border border-[#D0DEE5]/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>Create New Account</span>
            </button>
          </div>

          {/* Bottom Distinct Secondary Entry: Office Use Only */}
          <div className="w-full pt-8 pb-2 text-center">
            <button
              id="btn-office-use-only"
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setScreen('office_signin');
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-[#D0DEE5]/80 hover:text-white transition rounded-xl bg-[#15253F]/60 hover:bg-[#15253F] border border-[#2B3D5B] cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#D0DEE5]" />
              <span>Office Use Only</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SCREEN 2: LABORATORY ACCOUNT SIGN IN (Strict Requirement 2) */}
      {/* ------------------------------------------------------------------ */}
      {screen === 'lab_signin' && (
        <div className="flex-1 p-6 flex flex-col justify-between animate-in fade-in select-none">
          <div>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Laboratory Portal
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Sign In to Laboratory Account</h2>
              <p className="text-xs text-[#D0DEE5]/90 mt-1">
                Enter your registered mobile number or email ID.
              </p>
              {/* Authorized roles banner */}
              <div className="mt-3 p-2.5 bg-[#15253F]/80 rounded-xl border border-[#2B3D5B] flex items-center justify-between text-[11px]">
                <span className="text-[#D0DEE5]/70 font-semibold">Authorized Roles:</span>
                <div className="flex items-center gap-1.5 font-bold text-[#D0DEE5]">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">Lab Owner</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">Lab Admin</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">Lab Viewer</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleLabSignIn} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-1.5">
                  Mobile Number / Email ID *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                  <input
                    id="lab-login-identifier"
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. lab.director@metropolisdiag.com or 9876543210"
                    className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-3 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5]">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setScreen('forgot_password');
                    }}
                    className="text-[11px] font-bold text-[#D0DEE5] hover:text-white hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                  <input
                    id="lab-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-10 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#D0DEE5]/60 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-lab-login"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-white text-[#0E1035] hover:bg-[#D0DEE5] font-black rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0E1035]" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 text-[#0E1035]" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-6 text-center space-y-3">
            <div className="text-xs text-[#D0DEE5]/80">
              Don't have an institutional laboratory account?
            </div>
            <button
              id="btn-goto-register"
              onClick={() => {
                setErrorMessage(null);
                setScreen('register');
              }}
              className="w-full py-3 px-4 bg-[#15253F] hover:bg-[#2B3D5B] text-[#D0DEE5] hover:text-white font-bold rounded-2xl text-xs transition border border-[#2B3D5B] cursor-pointer"
            >
              Create New Account &rarr;
            </button>
            <p className="text-[10px] text-[#D0DEE5]/50">
              Role permissions and tenant isolation are enforced by the authenticated backend session.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SCREEN: OFFICE USE ONLY LOGIN (Strict Requirement 4) */}
      {/* ------------------------------------------------------------------ */}
      {screen === 'office_signin' && (
        <div className="flex-1 p-6 flex flex-col justify-between animate-in fade-in select-none">
          <div>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>Internal Personnel Only</span>
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Office &amp; Field Staff Sign In</h2>
              <p className="text-xs text-[#D0DEE5]/90 mt-1">
                Secure access for authorized internal operations and engineering team.
              </p>
              {/* Authorized roles banner */}
              <div className="mt-3 p-2.5 bg-[#15253F]/80 rounded-xl border border-[#2B3D5B] space-y-1.5 text-[11px]">
                <div className="text-[#D0DEE5]/70 font-semibold">Authorized Roles:</div>
                <div className="flex flex-wrap gap-1.5 font-bold text-[#D0DEE5]">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white">Field Sales</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white">Field Service Engineer</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white">Staff Attendance / Punch In</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleOfficeSignIn} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-1.5">
                  Official Email / Employee ID *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                  <input
                    id="office-login-identifier"
                    type="text"
                    required
                    value={officeIdentifier}
                    onChange={(e) => setOfficeIdentifier(e.target.value)}
                    placeholder="e.g. service.eng@a2zdiagnostic.com"
                    className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-3 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-1.5">
                  Office Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                  <input
                    id="office-login-password"
                    type={showOfficePassword ? 'text' : 'password'}
                    required
                    value={officePassword}
                    onChange={(e) => setOfficePassword(e.target.value)}
                    placeholder="Enter authorized office password"
                    className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-10 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOfficePassword(!showOfficePassword)}
                    className="absolute right-3.5 top-3.5 text-[#D0DEE5]/60 hover:text-white cursor-pointer"
                  >
                    {showOfficePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-office-login"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-amber-400 text-[#0E1035] hover:bg-amber-300 font-black rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0E1035]" />
                ) : (
                  <>
                    <span>Sign In to Office Console</span>
                    <ArrowRight className="w-4 h-4 text-[#0E1035]" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-6 text-center space-y-3">
            <button
              onClick={() => {
                setErrorMessage(null);
                setScreen('welcome');
              }}
              className="text-xs font-semibold text-[#D0DEE5]/70 hover:text-white hover:underline cursor-pointer"
            >
              &larr; Back to Laboratory Customer Portal
            </button>
            <p className="text-[10px] text-[#D0DEE5]/50">
              Access logged with geofence verification and server-authoritative audit trail.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SCREEN 3: CLEAN REGISTRATION FORM (Requirement 2 & 5) */}
      {/* ------------------------------------------------------------------ */}
      {screen === 'register' && (
        <div className="flex-1 p-6 animate-in fade-in">
          <div className="mb-5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 inline-block mb-1.5">
              First Registrant = Account Owner
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">Create Laboratory Account</h2>
            <p className="text-xs text-[#D0DEE5] mt-1">
              One clean registration form for your diagnostic center or hospital.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-3.5 pb-6">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-1">
                Lab / Hospital Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={regLabName}
                  onChange={(e) => setRegLabName(e.target.value)}
                  placeholder="e.g. Apollo Pathology & Diagnostic Center"
                  className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-3 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-1">
                Contact Person Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={regContactName}
                  onChange={(e) => setRegContactName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kulkarni"
                  className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-3 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-1">
                Lab / Hospital Address *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="e.g. Ground Floor, Sunrise Healthcare, Powai, Mumbai"
                  className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-3 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-1">
                  Email ID *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="lab@diagnosticcenter.com"
                    className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-3 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-1">
                  Contact Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210 (10 digits)"
                    className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-3 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-1">
                Create Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 8 chars with uppercase, number & symbol"
                  className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-10 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-3.5 text-[#D0DEE5]/60 hover:text-white cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Checklist */}
              {regPassword.length > 0 && (
                <div className="p-2.5 bg-[#15253F]/60 rounded-xl border border-[#2B3D5B] mt-2 space-y-1 text-[10px]">
                  <div className="font-bold text-[#D0DEE5]">Security Checklist:</div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <span className={`flex items-center gap-1 ${passwordValidation.length ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordValidation.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 8+ Characters
                    </span>
                    <span className={`flex items-center gap-1 ${passwordValidation.upper ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordValidation.upper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Uppercase Letter
                    </span>
                    <span className={`flex items-center gap-1 ${passwordValidation.lower ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordValidation.lower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Lowercase Letter
                    </span>
                    <span className={`flex items-center gap-1 ${passwordValidation.number ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordValidation.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Number Digit
                    </span>
                    <span className={`flex items-center gap-1 ${passwordValidation.special ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {passwordValidation.special ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Special Char (!@#$)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-enter chosen password"
                  className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-3 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition font-mono"
                />
              </div>
              {regConfirmPassword.length > 0 && regPassword !== regConfirmPassword && (
                <div className="text-[10px] text-rose-400 mt-1 font-semibold">Passwords do not match.</div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-white text-[#0E1035] hover:bg-[#D0DEE5] font-black rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#0E1035]" />
              ) : (
                <>
                  <span>Register &amp; Send OTP</span>
                  <ArrowRight className="w-4 h-4 text-[#0E1035]" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setScreen('signin')}
                className="text-xs text-[#D0DEE5] hover:text-white hover:underline cursor-pointer"
              >
                Already have an account? Sign In &rarr;
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SCREEN 4: 6-DIGIT OTP VERIFICATION (Requirement 3) */}
      {/* ------------------------------------------------------------------ */}
      {screen === 'otp' && (
        <div className="flex-1 p-6 flex flex-col justify-between animate-in fade-in">
          <div>
            <div className="mb-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#15253F] border border-[#2B3D5B] flex items-center justify-center mb-3">
                <KeyRound className="w-6 h-6 text-[#D0DEE5]" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Enter Verification Code</h2>
              <p className="text-xs text-[#D0DEE5] mt-1.5 max-w-xs mx-auto">
                We sent a 6-digit OTP code to <strong className="text-white">{activeIdentifier}</strong>. Account activates upon verification.
              </p>
            </div>

            {/* 6-Digit Boxes */}
            <div className="flex justify-center gap-2.5 my-6">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-11 h-12 text-center text-lg font-black font-mono bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-xl text-white outline-none transition focus:ring-2 focus:ring-[#D0DEE5]/30"
                />
              ))}
            </div>

            {/* Test Helper (Fast simulation fill) */}
            {debugOtp && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-400/30 rounded-xl mb-4 text-center">
                <span className="text-[11px] text-amber-200 font-mono">
                  Simulation OTP: <strong>{debugOtp}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const digits = debugOtp.split('').slice(0, 6);
                    setOtpDigits(digits);
                  }}
                  className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-400 text-black hover:bg-amber-300 cursor-pointer"
                >
                  Quick Fill
                </button>
              </div>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={isSubmitting || otpDigits.join('').length !== 6}
              className="w-full py-3.5 px-4 bg-white text-[#0E1035] hover:bg-[#D0DEE5] font-black rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#0E1035]" />
              ) : (
                <>
                  <span>Verify &amp; Activate Account</span>
                  <CheckCircle2 className="w-4 h-4 text-[#0E1035]" />
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-6 space-y-2">
            <div className="text-xs text-[#D0DEE5]/70 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Code expires in:{' '}
                <strong className="text-white font-mono">
                  {Math.floor(otpExpirySeconds / 60)}:
                  {String(otpExpirySeconds % 60).padStart(2, '0')}
                </strong>
              </span>
            </div>

            <div>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-xs font-bold text-[#D0DEE5] hover:text-white hover:underline cursor-pointer disabled:opacity-40"
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Did not receive code? Resend OTP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SCREEN 5: FORGOT PASSWORD REQUEST */}
      {/* ------------------------------------------------------------------ */}
      {screen === 'forgot_password' && (
        <div className="flex-1 p-6 flex flex-col justify-between animate-in fade-in">
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-black text-white tracking-tight">Forgot Password</h2>
              <p className="text-xs text-[#D0DEE5] mt-1">
                Enter your registered mobile number or email ID to receive a verification OTP code.
              </p>
            </div>

            <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-1.5">
                  Mobile Number / Email ID *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter registered mobile or email"
                    className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-3 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-white text-[#0E1035] hover:bg-[#D0DEE5] font-black rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0E1035]" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4 text-[#0E1035]" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => setScreen('lab_signin')}
              className="text-xs text-[#D0DEE5] hover:text-white hover:underline cursor-pointer"
            >
              Remember your password? Sign In &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SCREEN 6: RESET PASSWORD WITH OTP */}
      {/* ------------------------------------------------------------------ */}
      {screen === 'reset_password' && (
        <div className="flex-1 p-6 flex flex-col justify-between animate-in fade-in">
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-black text-white tracking-tight">Set New Password</h2>
              <p className="text-xs text-[#D0DEE5] mt-1">
                Enter the 6-digit OTP sent to <strong className="text-white">{activeIdentifier}</strong> and create your new secure password.
              </p>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-2 text-center">
                  6-Digit OTP Verification Code *
                </label>
                <div className="flex justify-center gap-2 mb-3">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-input-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-10 h-11 text-center text-base font-black font-mono bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-xl text-white outline-none transition"
                    />
                  ))}
                </div>

                {debugOtp && (
                  <div className="p-2 bg-amber-500/10 border border-amber-400/30 rounded-xl mb-3 text-center">
                    <span className="text-[10px] text-amber-200 font-mono">
                      Simulation OTP: <strong>{debugOtp}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpDigits(debugOtp.split('').slice(0, 6))}
                      className="ml-2 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-black hover:bg-amber-300 cursor-pointer"
                    >
                      Fill
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-1">
                  Create New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-10 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3.5 text-[#D0DEE5]/60 hover:text-white cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D0DEE5] mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#D0DEE5]/60 absolute left-3.5 top-3.5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-[#15253F] border border-[#2B3D5B] focus:border-[#D0DEE5] rounded-2xl py-3 pl-10 pr-3 text-xs text-white placeholder-[#D0DEE5]/40 outline-none transition font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-white text-[#0E1035] hover:bg-[#D0DEE5] font-black rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0E1035]" />
                ) : (
                  <>
                    <span>Reset Password &amp; Sign In</span>
                    <CheckCircle2 className="w-4 h-4 text-[#0E1035]" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => setScreen('lab_signin')}
              className="text-xs text-[#D0DEE5] hover:text-white hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
