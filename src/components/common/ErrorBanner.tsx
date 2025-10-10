/**
 * ErrorBanner - Accessible error display component
 * Provides consistent error messaging with proper ARIA attributes
 */

import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ErrorBannerProps {
  title?: string
  message: string
  onDismiss?: () => void
  variant?: 'default' | 'destructive'
  className?: string
}

export function ErrorBanner({ 
  title = 'Error', 
  message, 
  onDismiss, 
  variant = 'destructive',
  className = ''
}: ErrorBannerProps) {
  return (
    <Alert 
      variant={variant} 
      role="alert" 
      aria-live="polite"
      className={`${className}`}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <strong className="font-semibold">{title}:</strong>
          <span className="ml-1">{message}</span>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="ml-2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Network error banner with retry functionality
 */
interface NetworkErrorBannerProps {
  message?: string
  onRetry?: () => void
  onDismiss?: () => void
}

export function NetworkErrorBanner({ 
  message = 'Network error occurred. Please check your connection and try again.',
  onRetry,
  onDismiss 
}: NetworkErrorBannerProps) {
  return (
    <ErrorBanner
      title="Connection Error"
      message={message}
      onDismiss={onDismiss}
      variant="destructive"
    >
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="ml-2"
        >
          Retry
        </Button>
      )}
    </ErrorBanner>
  )
}

/**
 * API error banner with specific error handling
 */
interface APIErrorBannerProps {
  error: Error | string
  onRetry?: () => void
  onDismiss?: () => void
}

export function APIErrorBanner({ error, onRetry, onDismiss }: APIErrorBannerProps) {
  const errorMessage = typeof error === 'string' ? error : error.message
  const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')
  
  if (isNetworkError) {
    return (
      <NetworkErrorBanner 
        message={errorMessage}
        onRetry={onRetry}
        onDismiss={onDismiss}
      />
    )
  }

  return (
    <ErrorBanner
      title="API Error"
      message={errorMessage}
      onDismiss={onDismiss}
      variant="destructive"
    >
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="ml-2"
        >
          Retry
        </Button>
      )}
    </ErrorBanner>
  )
}
