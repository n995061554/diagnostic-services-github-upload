import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, ShieldCheck, CheckCircle2, Loader2, Stethoscope } from 'lucide-react';
import { User } from '../types';
import { ThemePalette } from '../utils/themeSystem';

interface LoginViewProps {
  onLoginSuccess: (session: { user: User; accessToken: string; refreshToken?: string }) => void;
  logoutNotice?: string | null;
  currentTheme: ThemePalette;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  logoutNotice,
  currentTheme
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setErrorMessage('Please enter both your identifier (email or username) and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.message || 'Authentication failed. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      if (!data.accessToken || !data.user) {
        setErrorMessage('Authentication succeeded but server response was incomplete.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    } catch (err: any) {
      setErrorMessage('Network error connecting to diagnostic authentication service. Please verify server connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 transition-colors duration-300 font-sans"
      style={{
        backgroundColor: currentTheme.brand.dominant,
        color: currentTheme.brand.forest,
      }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border shadow-sm mx-auto mb-2"
            style={{
              backgroundColor: currentTheme.brand.surface,
              borderColor: currentTheme.brand.lightPista,
            }}
          >
            <Stethoscope className="w-7 h-7" style={{ color: currentTheme.brand.forest }} />
          </div>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ color: currentTheme.brand.forest }}
          >
            Diagnostic Services
          </h1>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: currentTheme.typography.textSecondary }}
          >
            Enterprise Diagnostic Operations Portal
          </p>
        </div>

        {/* Notices */}
        {logoutNotice && (
          <div
            className="p-3.5 rounded-xl border text-xs flex items-center gap-2.5 shadow-2xs animate-fade-in"
            style={{
              backgroundColor: currentTheme.brand.surface,
              borderColor: currentTheme.brand.lightPista,
              color: currentTheme.brand.forest,
            }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{logoutNotice}</span>
          </div>
        )}

        {errorMessage && (
          <div
            className="p-3.5 rounded-xl border text-xs flex items-start gap-2.5 shadow-2xs bg-rose-50 border-rose-200 text-rose-800 animate-shake"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Login Card */}
        <div
          className="p-6 sm:p-8 rounded-2xl border shadow-lg space-y-6"
          style={{
            backgroundColor: currentTheme.brand.surface,
            borderColor: currentTheme.brand.lightPista,
          }}
        >
          <div className="border-b pb-3" style={{ borderColor: currentTheme.brand.lightPista }}>
            <h2 className="text-base font-bold" style={{ color: currentTheme.brand.forest }}>
              Sign in to your account
            </h2>
            <p className="text-xs mt-0.5" style={{ color: currentTheme.typography.textSecondary }}>
              Enter your corporate credentials to access your authorized workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-identifier"
                className="block text-xs font-bold tracking-wide uppercase"
                style={{ color: currentTheme.brand.forest }}
              >
                Email or username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4" style={{ color: currentTheme.typography.textSecondary }} />
                </div>
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={isLoading}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your corporate email or username"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: currentTheme.brand.dominant,
                    borderColor: currentTheme.brand.lightPista,
                    color: currentTheme.brand.forest,
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold tracking-wide uppercase"
                style={{ color: currentTheme.brand.forest }}
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4" style={{ color: currentTheme.typography.textSecondary }} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: currentTheme.brand.dominant,
                    borderColor: currentTheme.brand.lightPista,
                    color: currentTheme.brand.forest,
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: currentTheme.typography.textSecondary }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-button"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{
                backgroundColor: currentTheme.brand.forest,
                color: currentTheme.brand.dominant,
                borderColor: currentTheme.brand.forest,
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Security & Authorization Notice */}
          <div
            className="pt-3 border-t space-y-2 text-center"
            style={{ borderColor: currentTheme.brand.lightPista }}
          >
            <p
              className="text-[11.5px] font-medium leading-relaxed"
              style={{ color: currentTheme.typography.textSecondary }}
            >
              Your access is determined by your assigned role and permissions.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Role-Based Access Control Enforced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
