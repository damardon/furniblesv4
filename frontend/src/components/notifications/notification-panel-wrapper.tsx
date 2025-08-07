'use client'

import { useState, useEffect } from 'react'
import { NotificationPanel } from './notification-panel'
import { useNotificationStore } from '@/lib/stores/notification-store'

export function NotificationPanelWrapper() {
  // ✅ Usar el store existente para el estado
  const { 
    isNotificationPanelOpen: isOpen, 
    setNotificationPanelOpen: setIsOpen 
  } = useNotificationStore()

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <NotificationPanel 
      isOpen={isOpen} 
      onClose={handleClose} 
    />
  )
}