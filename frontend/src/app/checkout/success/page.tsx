// frontend/src/app/checkout/success/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PaymentDetails {
  paymentId: string
  amount: number
  status: string
  orderItems: any[]
  customerEmail: string
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const paymentId = searchParams.get('payment_id')

  useEffect(() => {
    if (!paymentId) {
      router.push('/')
      return
    }

    fetchPaymentDetails()
  }, [paymentId])

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/details/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentDetails(data)
      } else {
        setError('No se pudieron cargar los detalles del pago')
      }
    } catch (error) {
      console.error('Error fetching payment details:', error)
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl font-bold">Verificando tu pago...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="mb-6">{error}</p>
          <Button onClick={() => router.push('/')} variant="primary">
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Header de éxito */}
        <div className="text-center mb-12">
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-4xl font-black uppercase mb-4 text-green-600">
            ¡Pago Exitoso!
          </h1>
          <p className="text-xl text-gray-600">
            Tu compra ha sido procesada correctamente
          </p>
        </div>

        {/* Detalles del pago */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Información del pago */}
          <div 
            className="bg-white border-4 border-black p-6"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <h2 className="font-black text-xl uppercase mb-4">Detalles del Pago</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-bold">ID de Pago:</span>
                <span className="font-mono text-sm">{paymentId}</span>
              </div>
              
              {paymentDetails && (
                <>
                  <div className="flex justify-between">
                    <span className="font-bold">Estado:</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 text-sm font-bold border border-green-600">
                      {paymentDetails.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-bold">Total:</span>
                    <span className="text-xl font-black text-orange-500">
                      ${paymentDetails.amount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-bold">Email:</span>
                    <span>{paymentDetails.customerEmail}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Productos comprados */}
          <div 
            className="bg-white border-4 border-black p-6"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <h2 className="font-black text-xl uppercase mb-4">Productos Comprados</h2>
            
            {paymentDetails?.orderItems ? (
              <div className="space-y-3">
                {paymentDetails.orderItems.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-2">
                    <h4 className="font-bold">{item.productTitle}</h4>
                    <p className="text-sm text-gray-600">Por: {item.seller}</p>
                    <p className="font-bold text-orange-500">${item.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Cargando productos...</p>
            )}
          </div>
        </div>

        {/* Próximos pasos */}
        <div 
          className="bg-blue-50 border-4 border-blue-500 p-6 mb-8"
          style={{ boxShadow: '6px 6px 0 #0066cc' }}
        >
          <h2 className="font-black text-xl uppercase mb-4 text-blue-800">
            ¿Qué sigue?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-3xl mb-2">📧</div>
              <h3 className="font-bold mb-1">Confirmación por email</h3>
              <p className="text-blue-700">Recibirás un email con todos los detalles</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">📁</div>
              <h3 className="font-bold mb-1">Descarga tus archivos</h3>
              <p className="text-blue-700">Accede a tus productos desde tu cuenta</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">🛠️</div>
              <h3 className="font-bold mb-1">¡A construir!</h3>
              <p className="text-blue-700">Disfruta creando tus muebles</p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/mi-cuenta/compras">
            <Button variant="primary" size="lg">
              📁 Ver mis compras
            </Button>
          </Link>
          
          <Link href="/productos">
            <Button variant="outline" size="lg">
              🛒 Continuar comprando
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline" size="lg">
              🏠 Volver al inicio
            </Button>
          </Link>
        </div>

        {/* Información adicional */}
        <div className="text-center mt-12 text-sm text-gray-600">
          <p>¿Tienes problemas con tu compra?</p>
          <Link href="/soporte" className="text-orange-500 hover:underline font-bold">
            Contacta a nuestro equipo de soporte
          </Link>
        </div>
      </div>
    </div>
  )
}