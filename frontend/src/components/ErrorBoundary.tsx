import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ScholarForge ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  private handleClearAndReset = () => {
    localStorage.removeItem('scholarforge_token')
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f1f3d] flex items-center justify-center p-6 font-sans text-slate-200">
          <div className="bg-[#162a52] border border-[#203a6b] rounded-2xl p-8 max-w-lg w-full shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-widest text-[#3b82f6] uppercase font-bold mb-1">
                ScholarForge Recovery Console
              </div>
              <h2 className="text-xl font-bold font-serif text-white">
                Something went wrong in the workspace
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                A UI rendering error occurred. You can reload the page or reset the active session.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#0f1f3d] text-rose-300 font-mono text-[11px] p-3 rounded-lg text-left overflow-x-auto border border-rose-900/50 max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center gap-3 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleClearAndReset}
                className="px-4 py-2 bg-[#1e3a6a] hover:bg-[#254680] text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
