// frontend/src/components/ui/tabs.tsx
import React, { createContext, useContext } from 'react'

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | null>(null)

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string  // ← AGREGAR ESTA LÍNEA
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>  {/* ← USAR className AQUÍ */}
    </TabsContext.Provider>
  )
}

// Resto del código igual...
export function TabsList({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={`flex ${className}`}>{children}</div>
}

export function TabsTrigger({ value, className, children }: { value: string, className?: string, children: React.ReactNode }) {
  const context = useContext(TabsContext)
  const isActive = context?.value === value
  
  return (
    <button
      className={`px-4 py-2 font-bold ${isActive ? 'bg-orange-500 text-black' : 'bg-white text-gray-600'} ${className}`}
      onClick={() => context?.onValueChange(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children }: { value: string, children: React.ReactNode }) {
  const context = useContext(TabsContext)
  if (context?.value !== value) return null
  
  return <div>{children}</div>
}