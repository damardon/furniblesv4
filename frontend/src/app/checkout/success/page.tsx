'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  CheckCircleIcon, 
  DownloadIcon, 
  MailIcon, 
  FileTextIcon,
  HomeIcon,
  ShoppingBagIcon,
  StarIcon,
  GiftIcon
} from 'lucide-react'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    if (!orderNumber) {
      router.push('/productos')
      return
    }

    // Hide confetti after animation
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [orderNumber, router])

  if (!orderNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-black font-black text-xl uppercase">Orden no encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              {['🎉', '🎊', '⭐', '💰', '🏆'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-green-400 border-b-4 border-black p-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 text-black font-black text-sm uppercase">
            <Link href="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-white">Compra Exitosa</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div 
            className="inline-block bg-green-500 border-6 border-black p-8 mb-6"
            style={{ boxShadow: '12px 12px 0 #000000' }}
          >
            <CheckCircleIcon className="w-20 h-20 text-white mx-auto mb-4" />
            <h1 className="text-4xl font-black text-white uppercase mb-2">
              ¡Compra Exitosa!
            </h1>
            <p className="text-white font-bold text-lg">
              Tu pedido #{orderNumber} ha sido procesado
            </p>
          </div>
          
          <p className="text-gray-600 font-bold text-lg max-w-2xl mx-auto">
            Gracias por tu compra. Hemos enviado los detalles de tu pedido y los enlaces de descarga a tu email.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Download Access */}
          <div 
            className="bg-blue-100 border-4 border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <DownloadIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-black text-black uppercase mb-2">
              Descargas
            </h3>
            <p className="text-sm text-gray-600 font-medium mb-4">
              Accede a tus archivos inmediatamente
            </p>
            <Link
              href="/descargas"
              className="inline-block bg-blue-500 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              Ver Descargas
            </Link>
          </div>

          {/* Email Confirmation */}
          <div 
            className="bg-yellow-100 border-4 border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <MailIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-black text-black uppercase mb-2">
              Email Enviado
            </h3>
            <p className="text-sm text-gray-600 font-medium mb-4">
              Revisa tu bandeja de entrada
            </p>
            <div className="bg-white border-2 border-black px-3 py-1 text-xs font-black text-black uppercase">
              ✓ Confirmación
            </div>
          </div>

          {/* Order Details */}
          <div 
            className="bg-purple-100 border-4 border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <FileTextIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-black text-black uppercase mb-2">
              Mi Pedido
            </h3>
            <p className="text-sm text-gray-600 font-medium mb-4">
              Ver detalles y factura
            </p>
            <Link
              href={`/pedidos/${orderNumber}`}
              className="inline-block bg-purple-500 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              Ver Detalles
            </Link>
          </div>

          {/* Write Review */}
          <div 
            className="bg-orange-100 border-4 border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <StarIcon className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-black text-black uppercase mb-2">
              Califica
            </h3>
            <p className="text-sm text-gray-600 font-medium mb-4">
              Comparte tu experiencia
            </p>
            <Link
              href="/reviews"
              className="inline-block bg-orange-500 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              Escribir Review
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div 
          className="bg-white border-4 border-black p-8 mb-8"
          style={{ boxShadow: '6px 6px 0 #000000' }}
        >
          <h2 className="text-2xl font-black text-black uppercase mb-6 flex items-center gap-3">
            <GiftIcon className="w-6 h-6" />
            Tu Compra
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-black text-black uppercase mb-4">Detalles del Pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-black">Número de Pedido:</span>
                  <span className="font-black text-orange-500">{orderNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-black">Fecha:</span>
                  <span className="font-bold text-black">
                    {new Date().toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-black">Estado:</span>
                  <span className="bg-green-500 text-white px-2 py-1 text-xs font-black uppercase border border-black">
                    PAGADO
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-black text-black uppercase mb-4">Próximos Pasos</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 border-2 border-black flex items-center justify-center text-white text-xs font-black">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-black text-sm">Revisa tu email</p>
                    <p className="text-xs text-gray-600 font-medium">Confirmación y enlaces de descarga</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 border-2 border-black flex items-center justify-center text-white text-xs font-black">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-black text-sm">Descarga tus archivos</p>
                    <p className="text-xs text-gray-600 font-medium">Disponibles por 30 días</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 border-2 border-black flex items-center justify-center text-white text-xs font-black">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-black text-sm">¡Construye tu proyecto!</p>
                    <p className="text-xs text-gray-600 font-medium">Sigue las instrucciones del PDF</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 border-2 border-black flex items-center justify-center text-white text-xs font-black">
                    4
                  </div>
                  <div>
                    <p className="font-bold text-black text-sm">Comparte tu resultado</p>
                    <p className="text-xs text-gray-600 font-medium">Escribe una review con fotos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div 
          className="bg-gray-100 border-4 border-black p-8 mb-8"
          style={{ boxShadow: '6px 6px 0 #000000' }}
        >
          <h2 className="text-2xl font-black text-black uppercase mb-6 text-center">
            ¿Necesitas Ayuda?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="bg-white border-3 border-black p-4 mb-4"
                   style={{ boxShadow: '3px 3px 0 #000000' }}>
                <MailIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-black text-black text-sm uppercase mb-2">Soporte por Email</h3>
                <p className="text-xs text-gray-600 font-medium mb-3">
                  Respuesta en menos de 24 horas
                </p>
                <a 
                  href="mailto:soporte@furnibles.com"
                  className="text-blue-600 text-xs font-bold hover:text-blue-800 transition-colors"
                >
                  soporte@furnibles.com
                </a>
              </div>
            </div>
            
            <div>
              <div className="bg-white border-3 border-black p-4 mb-4"
                   style={{ boxShadow: '3px 3px 0 #000000' }}>
                <FileTextIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-black text-black text-sm uppercase mb-2">Centro de Ayuda</h3>
                <p className="text-xs text-gray-600 font-medium mb-3">
                  Preguntas frecuentes y tutoriales
                </p>
                <Link 
                  href="/ayuda"
                  className="text-green-600 text-xs font-bold hover:text-green-800 transition-colors"
                >
                  Ver Ayuda →
                </Link>
              </div>
            </div>
            
            <div>
              <div className="bg-white border-3 border-black p-4 mb-4"
                   style={{ boxShadow: '3px 3px 0 #000000' }}>
                <StarIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-black text-black text-sm uppercase mb-2">Comunidad</h3>
                <p className="text-xs text-gray-600 font-medium mb-3">
                  Conecta con otros makers
                </p>
                <Link 
                  href="/comunidad"
                  className="text-purple-600 text-xs font-bold hover:text-purple-800 transition-colors"
                >
                  Unirse →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div 
            className="bg-yellow-100 border-4 border-black p-8 mb-8"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <h2 className="text-2xl font-black text-black uppercase mb-4">
              ¡Sigue Construyendo!
            </h2>
            <p className="text-gray-600 font-bold mb-6">
              Descubre más proyectos increíbles en nuestro catálogo
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 bg-blue-500 border-4 border-black px-6 py-3 font-black text-white uppercase hover:bg-yellow-400 hover:text-black transition-all"
                style={{ boxShadow: '4px 4px 0 #000000' }}
              >
                <ShoppingBagIcon className="w-5 h-5" />
                Explorar Más Productos
              </Link>
              
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-white border-4 border-black px-6 py-3 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '4px 4px 0 #000000' }}
              >
                <HomeIcon className="w-5 h-5" />
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>

        {/* Social Sharing */}
        <div 
          className="bg-white border-4 border-black p-6 text-center"
          style={{ boxShadow: '6px 6px 0 #000000' }}
        >
          <h3 className="text-lg font-black text-black uppercase mb-4">
            Comparte tu Experiencia
          </h3>
          <p className="text-gray-600 font-bold mb-4">
            ¡Cuéntales a tus amigos sobre Furnibles!
          </p>
          
          <div className="flex justify-center gap-4">
            <button 
              className="bg-blue-600 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=¡Acabo de comprar un increíble proyecto de muebles en @Furnibles! Orden ${orderNumber} 🪵✨&url=${window.location.origin}`, '_blank')}
            >
              Twitter
            </button>
            
            <button 
              className="bg-green-600 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              onClick={() => window.open(`https://wa.me/?text=¡Acabo de comprar un increíble proyecto de muebles en Furnibles! ${window.location.origin}`, '_blank')}
            >
              WhatsApp
            </button>
            
            <button 
              className="bg-blue-800 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}`, '_blank')}
            >
              Facebook
            </button>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-12">
          <p className="text-gray-500 font-bold text-sm">
            Gracias por confiar en Furnibles. ¡Esperamos ver tu proyecto terminado! 🪵
          </p>
        </div>
      </div>
    </div>
  )
}