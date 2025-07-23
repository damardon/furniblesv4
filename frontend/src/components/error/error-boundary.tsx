'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
  errorBoundaryStack?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
  copied: boolean
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showReportButton?: boolean
  className?: string
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  resetError: () => void
  showDetails: boolean
  toggleDetails: () => void
  copyError: () => void
  copied: boolean
  onReport?: () => void
  showReportButton?: boolean
}

// Default Error Fallback Component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  showDetails,
  toggleDetails,
  copyError,
  copied,
  onReport,
  showReportButton = true
}) => {
  const t = useTranslations('error_boundary')

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div 
        className="w-full max-w-2xl bg-white border-4 border-black p-8"
        style={{ boxShadow: '6px 6px 0 #000000' }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-400 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-black text-black uppercase mb-2">
            {t('title')}
          </h1>
          
          <p className="text-gray-600 font-bold">
            {t('description')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="bg-red-100 border-3 border-red-500 p-4 mb-6"
            style={{ boxShadow: '3px 3px 0 #000000' }}
          >
            <h2 className="font-black text-red-800 text-sm uppercase mb-2 flex items-center gap-2">
              <Bug className="w-4 h-4" />
              {t('error_details')}
            </h2>
            <p className="text-red-700 font-medium text-sm break-words">
              {error.message || t('unknown_error')}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button
            onClick={resetError}
            className="flex-1"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('try_again')}
          </Button>
          
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            {t('go_home')}
          </Button>

          {showReportButton && onReport && (
            <Button
              onClick={onReport}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Bug className="w-4 h-4 mr-2" />
              {t('report_bug')}
            </Button>
          )}
        </div>

        {/* Technical Details Toggle */}
        {(error || errorInfo) && (
          <div>
            <button
              onClick={toggleDetails}
              className="flex items-center gap-2 w-full p-3 bg-gray-100 border-2 border-black font-bold text-sm uppercase hover:bg-yellow-400 transition-all mb-4"
              style={{ boxShadow: '2px 2px 0 #000000' }}
            >
              <Bug className="w-4 h-4" />
              {t('technical_details')}
              {showDetails ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>

            {showDetails && (
              <div 
                className="bg-gray-50 border-2 border-gray-300 p-4"
                style={{ boxShadow: '2px 2px 0 #000000' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-gray-800 text-xs uppercase">
                    {t('stack_trace')}
                  </h3>
                  <Button
                    onClick={copyError}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        {t('copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        {t('copy')}
                      </>
                    )}
                  </Button>
                </div>
                
                <pre className="text-xs font-mono text-gray-700 bg-white p-3 border border-gray-300 overflow-auto max-h-40 whitespace-pre-wrap">
                  {error?.stack || error?.message || t('no_stack_trace')}
                  {errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {errorInfo.componentStack}
                    </>
                  )}
                </pre>

                <div className="mt-3 text-xs text-gray-500 font-medium">
                  <p><strong>{t('timestamp')}:</strong> {new Date().toISOString()}</p>
                  <p><strong>{t('user_agent')}:</strong> {navigator.userAgent}</p>
                  <p><strong>{t('url')}:</strong> {window.location.href}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div 
          className="mt-6 p-4 bg-blue-100 border-3 border-blue-500"
          style={{ boxShadow: '2px 2px 0 #000000' }}
        >
          <h3 className="font-black text-blue-800 text-sm uppercase mb-2">
            {t('help.title')}
          </h3>
          <ul className="text-blue-700 text-sm font-medium space-y-1">
            <li>• {t('help.refresh_page')}</li>
            <li>• {t('help.clear_cache')}</li>
            <li>• {t('help.try_different_browser')}</li>
            <li>• {t('help.contact_support')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Error Boundary Class Component
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private timeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.groupEnd()
    }

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo)

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }

  componentWillUnmount() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
  }

  private logErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Log to your error reporting service (Sentry, LogRocket, etc.)
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      })
    } catch (logError) {
      console.error('Failed to log error to service:', logError)
    }
  }

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false
    })
  }

  private toggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails
    }))
  }

  private copyError = async () => {
    try {
      const errorText = [
        `Error: ${this.state.error?.message || 'Unknown error'}`,
        `Stack: ${this.state.error?.stack || 'No stack trace'}`,
        `Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}`,
        `URL: ${window.location.href}`,
        `Timestamp: ${new Date().toISOString()}`,
        `User Agent: ${navigator.userAgent}`
      ].join('\n\n')

      await navigator.clipboard.writeText(errorText)
      
      this.setState({ copied: true })
      
      // Reset copied state after 2 seconds
      this.timeoutId = setTimeout(() => {
        this.setState({ copied: false })
      }, 2000)
      
    } catch (err) {
      console.error('Failed to copy error to clipboard:', err)
    }
  }

  private reportError = () => {
    // Open email client or redirect to support
    const subject = encodeURIComponent('Error Report - FURNIBLES')
    const body = encodeURIComponent([
      'I encountered an error on FURNIBLES:',
      '',
      `Error: ${this.state.error?.message || 'Unknown error'}`,
      `URL: ${window.location.href}`,
      `Timestamp: ${new Date().toISOString()}`,
      '',
      'Additional details:',
      '(Please describe what you were doing when the error occurred)'
    ].join('\n'))
    
    window.open(`mailto:support@furnibles.com?subject=${subject}&body=${body}`)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <div className={cn("error-boundary", this.props.className)}>
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
            showDetails={this.state.showDetails}
            toggleDetails={this.toggleDetails}
            copyError={this.copyError}
            copied={this.state.copied}
            onReport={this.reportError}
            showReportButton={this.props.showReportButton}
          />
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    console.error('Handled Error:', error)
    
    // You can dispatch to error reporting service here
    if (process.env.NODE_ENV === 'production') {
      // Log to service
    }
  }, [])

  return { handleError }
}

// HOC for wrapping components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Specific Error Boundaries for different sections
export const ProductErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      console.error('Product Error:', error, errorInfo)
    }}
    className="product-error-boundary"
  >
    {children}
  </ErrorBoundary>
)

export const CheckoutErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      console.error('Checkout Error:', error, errorInfo)
      // Maybe redirect to cart or show recovery options
    }}
    className="checkout-error-boundary"
  >
    {children}
  </ErrorBoundary>
)

export const DashboardErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      console.error('Dashboard Error:', error, errorInfo)
    }}
    className="dashboard-error-boundary"
  >
    {children}
  </ErrorBoundary>
)

export default ErrorBoundary