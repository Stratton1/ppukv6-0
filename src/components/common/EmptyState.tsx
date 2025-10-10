/**
 * EmptyState - Consistent empty state component
 * Provides user-friendly messaging when no data is available
 */

import { Search, Home, FileText, Users, Camera, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) {
  return (
    <Card className={`${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Predefined empty states for common scenarios
 */

export function EmptySearchState({ onClearSearch }: { onClearSearch?: () => void }) {
  return (
    <EmptyState
      icon={<Search className="h-12 w-12" />}
      title="No properties found"
      description="Try adjusting your search criteria or browse all available properties."
      action={onClearSearch ? {
        label: "Clear search",
        onClick: onClearSearch
      } : undefined}
    />
  )
}

export function EmptyPropertiesState({ onCreateProperty }: { onCreateProperty?: () => void }) {
  return (
    <EmptyState
      icon={<Home className="h-12 w-12" />}
      title="No properties yet"
      description="Get started by adding your first property or claiming an existing one."
      action={onCreateProperty ? {
        label: "Add property",
        onClick: onCreateProperty
      } : undefined}
    />
  )
}

export function EmptyDocumentsState({ onUploadDocument }: { onUploadDocument?: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="h-12 w-12" />}
      title="No documents uploaded"
      description="Upload EPC certificates, surveys, and other property documents to build your passport."
      action={onUploadDocument ? {
        label: "Upload document",
        onClick: onUploadDocument
      } : undefined}
    />
  )
}

export function EmptyPhotosState({ onUploadPhoto }: { onUploadPhoto?: () => void }) {
  return (
    <EmptyState
      icon={<Camera className="h-12 w-12" />}
      title="No photos uploaded"
      description="Add photos of your property to showcase its features and condition."
      action={onUploadPhoto ? {
        label: "Upload photo",
        onClick: onUploadPhoto
      } : undefined}
    />
  )
}

export function EmptyPartiesState({ onInviteParty }: { onInviteParty?: () => void }) {
  return (
    <EmptyState
      icon={<Users className="h-12 w-12" />}
      title="No parties added"
      description="Invite owners, tenants, or other interested parties to collaborate on this property."
      action={onInviteParty ? {
        label: "Invite party",
        onClick: onInviteParty
      } : undefined}
    />
  )
}

export function EmptyWatchlistState({ onBrowseProperties }: { onBrowseProperties?: () => void }) {
  return (
    <EmptyState
      icon={<Home className="h-12 w-12" />}
      title="Your watchlist is empty"
      description="Save properties you're interested in to track them easily."
      action={onBrowseProperties ? {
        label: "Browse properties",
        onClick: onBrowseProperties
      } : undefined}
    />
  )
}

export function EmptyNotesState({ onCreateNote }: { onCreateNote?: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="h-12 w-12" />}
      title="No notes yet"
      description="Add notes about this property to keep track of important information."
      action={onCreateNote ? {
        label: "Add note",
        onClick: onCreateNote
      } : undefined}
    />
  )
}

export function EmptyTasksState({ onCreateTask }: { onCreateTask?: () => void }) {
  return (
    <EmptyState
      icon={<AlertCircle className="h-12 w-12" />}
      title="No tasks yet"
      description="Create tasks to track property maintenance, improvements, or other activities."
      action={onCreateTask ? {
        label: "Create task",
        onClick: onCreateTask
      } : undefined}
    />
  )
}

/**
 * Error empty state
 */
export function ErrorEmptyState({ 
  error, 
  onRetry 
}: { 
  error: string
  onRetry?: () => void 
}) {
  return (
    <EmptyState
      icon={<AlertCircle className="h-12 w-12 text-destructive" />}
      title="Something went wrong"
      description={error}
      action={onRetry ? {
        label: "Try again",
        onClick: onRetry
      } : undefined}
    />
  )
}
