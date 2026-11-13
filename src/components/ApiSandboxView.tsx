import React, { useState } from 'react';
import { UserRoleType, User } from '../types';
import { 
  Play, 
  RefreshCw, 
  Key, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  FileJson,
  Send,
  AlertCircle,
  Copy
} from 'lucide-react';

interface ApiSandboxViewProps {
  currentUser: User | null;
  currentRole: UserRoleType;
  accessToken: string | null;
  refreshToken: string | null;
  onExecuteRefresh: () => Promise<void>;
  onExecuteLogin: (email: string, pass: string) => Promise<void>;
}

export const ApiSandboxView: React.FC<ApiSandboxViewProps> = ({
  currentUser,
  currentRole,
  accessToken,
  refreshToken,
  onExecuteRefresh,
  onExecuteLogin,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/v1/auth/me');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Decode JWT payload for visualization
  const parseJwt = (token: string | null) => {
    if (!token || typeof token !== 'string') return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2 || !parts[1]) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const decodedAccessToken = parseJwt(accessToken);
  const decodedRefreshToken = parseJwt(refreshToken);

  const executeApiCall = async () => {
    setIsLoading(true);
    try {
      let res: Response;
      if (selectedEndpoint === 'GET /api/v1/auth/me') {
        res = await fetch('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } else if (selectedEndpoint === 'GET /api/v1/users') {
        res = await fetch('/api/v1/users', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } else if (selectedEndpoint === 'GET /api/v1/roles') {
        res = await fetch('/api/v1/roles', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } else if (selectedEndpoint === 'GET /api/v1/audit-logs') {
        res = await fetch('/api/v1/audit-logs?limit=10', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } else if (selectedEndpoint === 'GET /api/v1/system/health') {
        res = await fetch('/api/v1/system/health');
      } else if (selectedEndpoint === 'POST /api/v1/auth/refresh') {
        res = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } else {
        res = await fetch('/api/v1/system/health');
      }

      const data = await res.json();
      setApiResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      });
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(label);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sandbox Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#22381E] text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="w-5 h-5 bg-[#D2E7C4] text-[#22381E] rounded flex items-center justify-center text-xs font-bold">03</span>
              <span>Live REST API & JWT Inspector</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Interactive API Workbench & Token Rotation Lab
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Test server-side authentication, role guards, and token refreshing against live endpoints.
            </p>
          </div>

          <button
            onClick={onExecuteRefresh}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#22381E] hover:bg-[#2E4B29] text-white text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Simulate JWT Token Refresh</span>
          </button>
        </div>
      </div>

      {/* JWT Tokens Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Access Token Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5F8F4D] animate-pulse"></span>
              <h3 className="font-semibold text-slate-900 text-sm">Access Token (Bearer JWT)</h3>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40 font-mono font-semibold">
              15 min TTL
            </span>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <div className="text-[11px] font-mono text-slate-500 mb-1">Encoded JWT:</div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-[#245B63] break-all max-h-20 overflow-y-auto">
                {accessToken || 'No active access token'}
              </div>
              {accessToken && (
                <button
                  onClick={() => handleCopy(accessToken, 'access')}
                  className="absolute right-2 top-7 p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded border border-slate-200 text-[10px] shadow-xs"
                >
                  {copiedToken === 'access' ? 'Copied' : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            <div>
              <div className="text-[11px] font-mono text-slate-500 mb-1">Decoded Payload Claims:</div>
              <pre className="p-3 rounded-lg bg-slate-900 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner">
                {decodedAccessToken ? JSON.stringify(decodedAccessToken, null, 2) : '// No active token'}
              </pre>
            </div>
          </div>
        </div>

        {/* Refresh Token Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5F8F4D]"></span>
              <h3 className="font-semibold text-slate-900 text-sm">Refresh Token (Token Family)</h3>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#D2E7C4] text-[#22381E] border border-[#5F8F4D]/30 font-mono font-semibold">
              7 day TTL
            </span>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <div className="text-[11px] font-mono text-slate-500 mb-1">Encoded Refresh Token:</div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-[#22381E] break-all max-h-20 overflow-y-auto">
                {refreshToken || 'No active refresh token'}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono text-slate-500 mb-1">Decoded Family Claims:</div>
              <pre className="p-3 rounded-lg bg-slate-900 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner">
                {decodedRefreshToken ? JSON.stringify(decodedRefreshToken, null, 2) : '// No active refresh token'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Live Endpoint Executor */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <Send className="w-4 h-4 text-[#22381E]" />
          <span>Execute Live API Endpoint</span>
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedEndpoint}
            onChange={(e) => setSelectedEndpoint(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white transition-colors"
          >
            <option value="GET /api/v1/auth/me">GET /api/v1/auth/me (Current Persona Profile)</option>
            <option value="GET /api/v1/users">GET /api/v1/users (Admin / Manager Protected)</option>
            <option value="GET /api/v1/roles">GET /api/v1/roles (All 9 RBAC Roles)</option>
            <option value="GET /api/v1/audit-logs">GET /api/v1/audit-logs (Security Audit Trail)</option>
            <option value="GET /api/v1/system/health">GET /api/v1/system/health (Public Healthcheck)</option>
            <option value="POST /api/v1/auth/refresh">POST /api/v1/auth/refresh (Rotate Tokens)</option>
          </select>

          <button
            onClick={executeApiCall}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#22381E] hover:bg-[#2E4B29] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Executing...' : 'Send Request'}</span>
          </button>
        </div>

        {/* Live Response Panel */}
        {apiResponse && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-slate-500">HTTP Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded font-bold ${
                    apiResponse.status >= 200 && apiResponse.status < 300
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : apiResponse.status === 403
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {apiResponse.status} {apiResponse.statusText}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Content-Type: application/json</span>
            </div>

            <pre className="p-4 rounded-lg bg-slate-900 font-mono text-xs text-[#D2E7C4] max-h-72 overflow-y-auto shadow-inner">
              {JSON.stringify(apiResponse.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

