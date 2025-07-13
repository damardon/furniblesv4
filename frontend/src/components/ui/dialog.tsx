import React, { createContext, useContext } from 'react'

interface DialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = createContext<DialogContextType | null>(null)

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null
  
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white border-2 border-black max-w-md w-full max-h-[90vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  )
}

export function DialogContent({ className = '', style, children }: CardProps) {
  return (
    <div className={`p-6 ${className}`} style={style}>
      {children}
    </div>
  )
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mb-2">{children}</h2>
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 mb-4">{children}</p>
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 justify-end mt-4">{children}</div>
}

// src/components/ui/dropdown-menu.tsx (Versión simplificada)
export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-block">{children}</div>
}

export function DropdownMenuTrigger({ asChild, children }: { asChild?: boolean, children: React.ReactNode }) {
  return <>{children}</>
}

export function DropdownMenuContent({ align, className, children }: { align?: string, className?: string, children: React.ReactNode }) {
  return (
    <div className={`absolute top-full right-0 bg-white border-2 border-black z-10 min-w-48 ${className}`}>
      {children}
    </div>
  )
}

export function DropdownMenuItem({ onClick, className, children }: { onClick?: () => void, className?: string, children: React.ReactNode }) {
  return (
    <div 
      className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-2 font-bold text-sm text-gray-600">{children}</div>
}

export function DropdownMenuSeparator() {
  return <div className="border-t border-gray-200 my-1" />
}