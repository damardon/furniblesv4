"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
}

const Modal = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Root>,
  ModalProps
>(({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg", 
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full h-full"
  }

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose} {...props}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
          onClick={closeOnOverlayClick ? onClose : undefined}
        />
        
        {/* Content */}
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]",
            "bg-white border-3 border-black rounded-lg shadow-lg duration-200",
            "max-h-[85vh] overflow-hidden",
            sizeClasses[size],
            className
          )}
          style={{ 
            boxShadow: "8px 8px 0 #000000",
            animation: "modalIn 0.2s ease-out"
          }}
          onPointerDownOutside={(e) => {
            if (!closeOnOverlayClick) {
              e.preventDefault()
            }
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-3 border-black bg-gray-50">
            <div className="space-y-1">
              <DialogPrimitive.Title className="text-xl font-black text-black uppercase">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-sm text-gray-600 font-medium">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            
            {showCloseButton && (
              <DialogPrimitive.Close asChild>
                <button
                  onClick={onClose}
                  className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none"
                >
                  <X className="h-6 w-6 text-black hover:text-red-600 transition-colors" />
                  <span className="sr-only">Cerrar</span>
                </button>
              </DialogPrimitive.Close>
            )}
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
})

Modal.displayName = "Modal"

// Componentes adicionales para composición
const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
))
ModalHeader.displayName = "ModalHeader"

const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-black text-black uppercase", className)}
    {...props}
  />
))
ModalTitle.displayName = "ModalTitle"

const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-gray-600 font-medium", className)}
    {...props}
  />
))
ModalDescription.displayName = "ModalDescription"

const ModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6", className)}
    {...props}
  />
))
ModalBody.displayName = "ModalBody"

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t-3 border-black bg-gray-50",
      className
    )}
    {...props}
  />
))
ModalFooter.displayName = "ModalFooter"

// Hook para control programático
const useModal = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const openModal = React.useCallback(() => setIsOpen(true), [])
  const closeModal = React.useCallback(() => setIsOpen(false), [])
  const toggleModal = React.useCallback(() => setIsOpen(prev => !prev), [])
  
  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  }
}

// Estilos CSS adicionales para animaciones
const modalStyles = `
  @keyframes modalIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  @keyframes modalOut {
    from {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.95);
    }
  }
`

// Componente para inyectar estilos
const ModalStyles = () => (
  <style jsx global>{modalStyles}</style>
)

export { 
  Modal, 
  ModalHeader, 
  ModalTitle, 
  ModalDescription, 
  ModalBody, 
  ModalFooter,
  ModalStyles,
  useModal
}