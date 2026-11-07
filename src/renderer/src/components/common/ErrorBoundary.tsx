import React, { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-[#070b19] text-[#e6ebf5] select-text">
          <div className="p-4 rounded-lg bg-[#0b1226] border border-red-500/40 max-w-lg w-full shadow-xl">
            <div className="flex items-center gap-2 text-red-400 font-bold font-mono text-sm mb-2">
              <span>⚠️</span>
              <span>{this.props.fallbackTitle || 'Component Error'}</span>
            </div>
            <pre className="text-xs font-mono text-red-300/90 whitespace-pre-wrap break-all p-2 rounded bg-black/40 border border-white/5 max-h-40 overflow-y-auto">
              {this.state.error?.message || 'Unknown error occurred'}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-3 px-3 py-1.5 text-xs font-mono font-medium rounded bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
