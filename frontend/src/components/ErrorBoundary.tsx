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
        <div className="min-h-screen bg-[#0D1713] flex items-center justify-center p-6 font-sans text-[#F1F5F2]">
          <div className="bg-[#14221B] border border-[#2A3D32] rounded-lg p-8 max-w-lg w-full shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 bg-rose-950/60 text-rose-400 border border-rose-800/50 rounded-lg flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-widest text-[#22C55E] uppercase font-bold mb-1">
                ScholarForge Recovery Console
              </div>
              <h2 className="text-xl font-display font-semibold text-[#F1F5F2]">
                Something went wrong in the workspace
              </h2>
              <p className="text-xs text-[#A6B5AB] mt-2 leading-relaxed">
                A UI rendering error occurred. You can reload the page or reset the active session.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#0D1713] text-rose-300 font-mono text-[11px] p-3 rounded text-left overflow-x-auto border border-rose-900/50 max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center gap-3 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#22C55E] hover:bg-[#16a34a] text-[#0D1713] text-xs font-semibold rounded transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleClearAndReset}
                className="px-4 py-2 bg-[#1B2D24] hover:bg-[#14532D] border border-[#2A3D32] text-[#F1F5F2] text-xs font-medium rounded transition-colors flex items-center gap-1.5"
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
