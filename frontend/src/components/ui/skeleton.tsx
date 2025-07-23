import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'avatar' | 'text' | 'button' | 'image'
  lines?: number
  width?: string
  height?: string
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', lines = 1, width, height, ...props }, ref) => {
    const baseClasses = "animate-pulse bg-gray-200 border-2 border-black"
    
    const variantStyles = {
      default: "h-4 w-full",
      card: "h-48 w-full",
      avatar: "h-12 w-12 rounded-full",
      text: "h-4 w-3/4",
      button: "h-10 w-24",
      image: "h-32 w-full"
    }

    const skeletonClasses = cn(
      baseClasses,
      variantStyles[variant],
      className
    )

    const customStyle = {
      ...(width && { width }),
      ...(height && { height }),
      boxShadow: '2px 2px 0 #000000'
    }

    if (variant === 'text' && lines > 1) {
      return (
        <div ref={ref} className="space-y-2" {...props}>
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={cn(
                baseClasses,
                i === lines - 1 ? "w-2/3" : "w-full",
                "h-4"
              )}
              style={{ boxShadow: '2px 2px 0 #000000' }}
            />
          ))}
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={skeletonClasses}
        style={customStyle}
        {...props}
      />
    )
  }
)

Skeleton.displayName = "Skeleton"

// Skeleton presets para casos comunes
const SkeletonCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn("bg-white border-4 border-black p-4", className)}
    style={{ boxShadow: '4px 4px 0 #000000' }}
    {...props}
  >
    <Skeleton variant="image" className="mb-4" />
    <Skeleton variant="text" lines={2} className="mb-2" />
    <div className="flex justify-between items-center">
      <Skeleton variant="button" />
      <Skeleton width="60px" height="20px" />
    </div>
  </div>
)

const SkeletonProduct = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn("bg-white border-4 border-black p-6", className)}
    style={{ boxShadow: '6px 6px 0 #000000' }}
    {...props}
  >
    <div className="flex items-start gap-4 mb-4">
      <Skeleton variant="image" className="w-16 h-16" />
      <div className="flex-1">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <div className="flex gap-2">
          <Skeleton width="80px" height="24px" />
          <Skeleton width="60px" height="24px" />
        </div>
      </div>
    </div>
    <Skeleton variant="text" lines={3} className="mb-4" />
    <div className="flex justify-between">
      <Skeleton variant="button" />
      <Skeleton width="80px" height="32px" />
    </div>
  </div>
)

const SkeletonDashboard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-6", className)} {...props}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" />
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton variant="button" width="120px" />
    </div>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div 
          key={i}
          className="bg-white border-4 border-black p-4 text-center"
          style={{ boxShadow: '4px 4px 0 #000000' }}
        >
          <Skeleton variant="avatar" className="mx-auto mb-2 w-8 h-8" />
          <Skeleton className="h-6 w-16 mx-auto mb-1" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
      ))}
    </div>
    
    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Skeleton variant="card" className="h-64" />
      </div>
      <div>
        <Skeleton variant="card" className="h-64" />
      </div>
    </div>
  </div>
)

const SkeletonTable = ({ 
  rows = 5, 
  columns = 4,
  className, 
  ...props 
}: { 
  rows?: number
  columns?: number 
} & React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn("bg-white border-4 border-black", className)}
    style={{ boxShadow: '4px 4px 0 #000000' }}
    {...props}
  >
    {/* Table Header */}
    <div className="border-b-2 border-black p-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-5" />
        ))}
      </div>
    </div>
    
    {/* Table Rows */}
    <div className="divide-y-2 divide-black">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, j) => (
              <Skeleton key={j} className="h-4" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonProduct, 
  SkeletonDashboard, 
  SkeletonTable 
}