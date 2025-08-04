// frontend/src/app/checkout/error/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CheckoutErrorPage() {
  const searchParams = useSearchParams()
  const [errorInfo, setErrorInfo] = useState({
    message: 'Ha ocurrido un error procesando tu pago',
    code: searchParams.get('error_code') || 'unknown',
    details: searchParams.get('error_message') || 'Error desconocido'
  })

  const getErrorDetails = (code: string) => {
    const errorMap: Record<string, { title: string; description: string; icon: string }> = {
      'card_declined': {
        title: 'Tarjeta Declinada',
        description: 'Tu tarjeta fue declinada por el banco. Intenta con otra tarjeta o contacta a tu banco.',
        icon: '💳'
      },
      'insufficient_funds': {
        title: 'Fondos Insuficientes',
        description: 'No tienes suficientes fondos en tu cuenta. Verifica tu saldo e intenta nuevamente.',
        icon: '💰'
      },
      'expired_card': {
        title: 'Tarjeta Expirada',
        description: 'Tu tarjeta ha expirado. Actualiza la información de tu tarjeta e intenta nuevamente.',
        icon: '📅'
      },
      'payment_cancelled': {
        title: 'Pago Cancelado',
        description: 'Has cancelado el pago. Puedes intentar nuevamente cuando estés listo.',
        icon: '🚫'
      },
      'network_error': {
        title: 'Error de Conexión',
        description: 'Hubo un problema de conexión. Verifica tu internet e intenta nuevamente.',
        icon: '🌐'
      },
      'unknown': {
        title: 'Error Desconocido',
        description: 'Ha ocurrido un error inesperado. Por favor intenta nuevamente o contacta soporte.',
        icon: '❓'
      }
    }

    return errorMap[code] || errorMap['unknown']
  }

  const errorDetails = getErrorDetails(errorInfo.code)

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header de error */}
        <div 
          className="bg-white border-4 border-black p-8 mb-8 text-center"
          style={{ boxShadow: '8px 8px 0 #000000' }}
        >
          <div className="text-8xl mb-4">{errorDetails.icon}</div>
          <h1 className="text-4xl font-black uppercase mb-4 text-red-500">
            Error en el Pago
          </h1>
          <h2 className="text-2xl font-bold mb-4">
            {errorDetails.title}
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            {errorDetails.description}
          </p>
        </div>

        {/* Detalles del error */}
        <div 
          className="bg-red-50 border-4 border-red-300 p-6 mb-8"
          style={{ boxShadow: '6px 6px 0 #dc2626' }}
        >
          <h3 className="font-black text-lg mb-4 flex items-center gap-2">
            <span>🔍</span>
            Detalles del Error
          </h3>
          
          <div className="space-y-3">
            <div>
              <span className="font-bold">Código de Error:</span>
              <span className="text-sm font-mono bg-red-100 px-2 py-1 ml-2">
                {errorInfo.code}
              </span>
            </div>
            
            <div>
              <span className="font-bold">Mensaje:</span>
              <p className="text-sm text-red-700 mt-1">
                {errorInfo.details}
              </p>
            </div>
            
            <div>
              <span className="font-bold">Fecha:</span>
              <span className="ml-2">
                {new Date().toLocaleString('es-ES')}
              </span>
            </div>
          </div>
        </div>

        {/* Soluciones sugeridas */}
        <div 
          className="bg-white border-4 border-black p-6 mb-8"
          style={{ boxShadow: '6px 6px 0 #000000' }}
        >
          <h3 className="font-black text-xl uppercase mb-6 flex items-center gap-2">
            <span>💡</span>
            ¿Qué puedes hacer?
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <p className="font-bold">Intenta nuevamente</p>
                <p className="text-sm text-gray-600">El error puede ser temporal. Vuelve a intentar el pago.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <p className="font-bold">Usa otro método de pago</p>
                <p className="text-sm text-gray-600">Prueba con PayPal o una tarjeta diferente.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <p className="font-bold">Verifica tus datos</p>
                <p className="text-sm text-gray-600">Asegúrate de que la información de tu tarjeta sea correcta.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
              <div>
                <p className="font-bold">Contacta soporte</p>
                <p className="text-sm text-gray-600">Nuestro equipo puede ayudarte a resolver el problema.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-4">
          <Link href="/checkout" className="block">
            <Button variant="primary" size="lg" className="w-full">
              🔄 Intentar Nuevamente
            </Button>
          </Link>
          
          <Link href="/carrito" className="block">
            <Button variant="outline" size="lg" className="w-full">
              🛒 Volver al Carrito
            </Button>
          </Link>
          
          <Link href="/contacto" className="block">
            <Button variant="secondary" size="lg" className="w-full">
              📞 Contactar Soporte
            </Button>
          </Link>
          
          <Link href="/" className="block">
            <Button variant="secondary" size="lg" className="w-full">
              🏠 Volver al Inicio
            </Button>
          </Link>
        </div>

        {/* Información de contacto */}
        <div 
          className="bg-blue-50 border-4 border-blue-300 p-6 mt-8"
          style={{ boxShadow: '6px 6px 0 #0066cc' }}
        >
          <h3 className="font-black text-lg mb-4 flex items-center gap-2">
            <span>🆘</span>
            ¿Necesitas Ayuda?
          </h3>
          
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>Email:</strong> soporte@furnibles.com
            </p>
            <p>
              <strong>WhatsApp:</strong> +1 (555) 123-4567
            </p>
            <p>
              <strong>Horario:</strong> Lunes a Viernes 9:00 AM - 6:00 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}