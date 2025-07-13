import React, { useState } from 'react'

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
}

interface SelectContentProps {
  children: React.ReactNode
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

interface SelectValueProps {
  placeholder?: string
}

export function Select({ value, onValueChange, children }: SelectProps) {
  return (
    <div className="relative">
      {React.Children.map(children, child => 
        React.isValidElement(child) ? React.cloneElement(child, { value, onValueChange } as any) : child
      )}
    </div>
  )
}

export function SelectTrigger({ className = '', children }: SelectTriggerProps) {
  return (
    <button className={`w-full px-3 py-2 border-2 border-black bg-white text-left focus:outline-none ${className}`}>
      {children}
    </button>
  )
}

export function SelectContent({ children }: SelectContentProps) {
  return (
    <div className="absolute top-full left-0 right-0 bg-white border-2 border-black border-t-0 z-10">
      {children}
    </div>
  )
}

export function SelectItem({ value, children }: SelectItemProps) {
  return (
    <div className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
      {children}
    </div>
  )
}

export function SelectValue({ placeholder }: SelectValueProps) {
  return <span className="text-gray-500">{placeholder}</span>
}