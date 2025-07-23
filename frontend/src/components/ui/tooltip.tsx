'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
  className?: string
  contentClassName?: string
  disabled?: boolean
  asChild?: boolean
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ 
    content, 
    children, 
    side = 'top', 
    align = 'center',
    delayDuration = 200,
    className,
    contentClassName,
    disabled = false,
    asChild = false,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)
    const [timeoutId, setTimeoutId] = React.useState<NodeJS.Timeout | null>(null)
    const tooltipRef = React.useRef<HTMLDivElement>(null)
    const triggerRef = React.useRef<HTMLDivElement>(null)

    const showTooltip = React.useCallback(() => {
      if (disabled) return
      
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      const id = setTimeout(() => {
        setIsVisible(true)
      }, delayDuration)
      
      setTimeoutId(id)
    }, [disabled, delayDuration, timeoutId])

    const hideTooltip = React.useCallback(() => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        setTimeoutId(null)
      }
      setIsVisible(false)
    }, [timeoutId])

    const getTooltipPosition = () => {
      const baseClasses = "absolute z-50 px-3 py-2 text-sm font-bold bg-black text-white border-2 border-black whitespace-nowrap transition-all duration-200"
      
      const sideClasses = {
        top: "bottom-full mb-2",
        bottom: "top-full mt-2", 
        left: "right-full mr-2",
        right: "left-full ml-2"
      }
      
      const alignClasses = {
        start: {
          top: "left-0",
          bottom: "left-0",
          left: "top-0",
          right: "top-0"
        },
        center: {
          top: "left-1/2 transform -translate-x-1/2",
          bottom: "left-1/2 transform -translate-x-1/2",
          left: "top-1/2 transform -translate-y-1/2", 
          right: "top-1/2 transform -translate-y-1/2"
        },
        end: {
          top: "right-0",
          bottom: "right-0",
          left: "bottom-0",
          right: "bottom-0"
        }
      }

      return cn(
        baseClasses,
        sideClasses[side],
        alignClasses[align][side],
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
        contentClassName
      )
    }

    const getArrowClasses = () => {
      const baseArrow = "absolute w-0 h-0 border-solid"
      
      const arrowStyles = {
        top: "top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black",
        bottom: "bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-black",
        left: "left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-black",
        right: "right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-black"
      }

      return cn(baseArrow, arrowStyles[side])
    }

    React.useEffect(() => {
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }, [timeoutId])

    return (
      <div 
        ref={ref}
        className={cn("relative inline-block", className)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        {...props}
      >
        <div ref={triggerRef}>
          {children}
        </div>
        
        {content && (
          <div
            ref={tooltipRef}
            className={getTooltipPosition()}
            style={{ boxShadow: '2px 2px 0 #000000' }}
            role="tooltip"
            aria-hidden={!isVisible}
          >
            {content}
            <div className={getArrowClasses()} />
          </div>
        )}
      </div>
    )
  }
)

Tooltip.displayName = "Tooltip"

// Componente TooltipProvider para contexto global (opcional)
interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
  skipDelayDuration?: number
}

const TooltipProvider: React.FC<TooltipProviderProps> = ({ 
  children, 
  delayDuration = 200,
  skipDelayDuration = 300 
}) => {
  return (
    <div data-tooltip-provider data-delay={delayDuration} data-skip-delay={skipDelayDuration}>
      {children}
    </div>
  )
}

// Hook para usar tooltips programáticamente
interface UseTooltipOptions {
  delayDuration?: number
  content: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  disabled?: boolean
}

const useTooltip = ({ delayDuration = 200, content, side = 'top', disabled = false }: UseTooltipOptions) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const show = React.useCallback(() => {
    if (disabled) return
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delayDuration)
  }, [disabled, delayDuration])

  const hide = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }, [])

  const toggle = React.useCallback(() => {
    if (isVisible) {
      hide()
    } else {
      show()
    }
  }, [isVisible, show, hide])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isVisible,
    show,
    hide,
    toggle,
    props: {
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: show,
      onBlur: hide
    }
  }
}

// Componentes especializados para casos comunes
interface InfoTooltipProps {
  content: React.ReactNode
  className?: string
  iconClassName?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
  content, 
  className, 
  iconClassName,
  side = 'top' 
}) => (
  <Tooltip content={content} side={side} className={className}>
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 border-2 border-black text-xs font-black hover:bg-yellow-400 transition-colors",
        iconClassName
      )}
      style={{ boxShadow: '2px 2px 0 #000000' }}
    >
      ?
    </button>
  </Tooltip>
)

const HelpTooltip: React.FC<InfoTooltipProps> = ({ 
  content, 
  className, 
  iconClassName,
  side = 'top' 
}) => (
  <Tooltip content={content} side={side} className={className}>
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 border-2 border-black text-xs font-black hover:bg-yellow-400 transition-colors",
        iconClassName
      )}
      style={{ boxShadow: '2px 2px 0 #000000' }}
    >
      💡
    </button>
  </Tooltip>
)

export { 
  Tooltip, 
  TooltipProvider, 
  InfoTooltip, 
  HelpTooltip, 
  useTooltip 
}