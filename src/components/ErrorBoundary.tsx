import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

const ComponentBase = React.Component as new (props: Props) => {
  props: Props;
  state: State;
  setState: (updater: Partial<State> | ((prevState: State) => Partial<State>)) => void;
};

export class ErrorBoundary extends ComponentBase {
  public state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary caught runtime exception]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0E1035] text-white flex items-center justify-center p-4">
          <div className="bg-[#15253F] border border-[#2B3D5B] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-black text-white tracking-wide">
                {this.props.fallbackTitle || 'A2Z Platform Runtime Notice'}
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                A component runtime exception occurred. The application state has been safely preserved.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/40 border border-white/10 rounded-2xl p-3 text-left overflow-x-auto text-[11px] font-mono text-rose-300 max-h-36">
                <strong>Error:</strong> {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="py-2.5 px-5 bg-[#D0DEE5] hover:bg-white text-[#0E1035] font-black rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
