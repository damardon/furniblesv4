'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
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

  const t = useTranslations('checkout.success')
  const tCommon = useTranslations('common')

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
          <p className="text-black font-black text-xl uppercase">{t('order_not_found')}</p>
        </div>
      </div>
    )
  }

  const shareOnTwitter = () => {
    const text = t('social.twitter_text', { orderNumber })
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${window.location.origin}`
    window.open(url, '_blank')
  }

  const shareOnWhatsApp = () => {
    const text = t('social.whatsapp_text')
    const url = `https://wa.me/?text=${encodeURIComponent(text)} ${window.location.origin}`
    window.open(url, '_blank')
  }

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}`
    window.open(url, '_blank')
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
              {tCommon('home')}
            </Link>
            <span>/</span>
            <span className="text-white">{t('breadcrumb')}</span>
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
              {t('success_message.title')}
            </h1>
            <p className="text-white font-bold text-lg">
              {t('success_message.order_processed', { orderNumber })}
            </p>
          </div>
          
          <p className="text-gray-600 font-bold text-lg max-w-2xl mx-auto">
            {t('success_message.description')}
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
              {t('action_cards.downloads.title')}
            </h3>
            <p className="text-sm text-gray-600 font-medium mb-4">
              {t('action_cards.downloads.description')}
            </p>
            <Link
              href="/descargas"
              className="inline-block bg-blue-500 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              {t('action_cards.downloads.button')}
            </Link>
          </div>

          {/* Email Confirmation */}
          <div 
            className="bg-yellow-100 border-4 border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <MailIcon className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-black text-black uppercase mb-2">
              {t('action_cards.email.title')}
            </h3>
            <p className="text-sm text-gray-600 font-medium mb-4">
              {t('action_cards.email.description')}
            </p>
            <div className="bg-white border-2 border-black px-3 py-1 text-xs font-black text-black uppercase">
              ✓ {t('action_cards.email.confirmation')}
            </div>
          </div>

          {/* Order Details */}
          <div 
            className="bg-purple-100 border-4 border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <FileTextIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-black text-black uppercase mb-2">
              {t('action_cards.order.title')}
            </h3>
            <p className="text-sm text-gray-600 font-medium mb-4">
              {t('action_cards.order.description')}
            </p>
            <Link
              href={`/pedidos/${orderNumber}`}
              className="inline-block bg-purple-500 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              {t('action_cards.order.button')}
            </Link>
          </div>

          {/* Write Review */}
          <div 
            className="bg-orange-100 border-4 border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
            style={{ boxShadow: '6px 6px 0 #000000' }}
          >
            <StarIcon className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-black text-black uppercase mb-2">
              {t('action_cards.review.title')}
            </h3>
            <p className="text-sm text-gray-600 font-medium mb-4">
              {t('action_cards.review.description')}
            </p>
            <Link
              href="/reviews"
              className="inline-block bg-orange-500 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
            >
              {t('action_cards.review.button')}
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
            {t('order_summary.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-black text-black uppercase mb-4">
                {t('order_summary.order_details')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-black">{t('order_summary.order_number')}:</span>
                  <span className="font-black text-orange-500">{orderNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-black">{t('order_summary.date')}:</span>
                  <span className="font-bold text-black">
                    {new Date().toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-black">{t('order_summary.status')}:</span>
                  <span className="bg-green-500 text-white px-2 py-1 text-xs font-black uppercase border border-black">
                    {t('order_summary.paid_status')}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-black text-black uppercase mb-4">
                {t('next_steps.title')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 border-2 border-black flex items-center justify-center text-white text-xs font-black">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-black text-sm">{t('next_steps.step1.title')}</p>
                    <p className="text-xs text-gray-600 font-medium">{t('next_steps.step1.description')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 border-2 border-black flex items-center justify-center text-white text-xs font-black">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-black text-sm">{t('next_steps.step2.title')}</p>
                    <p className="text-xs text-gray-600 font-medium">{t('next_steps.step2.description')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 border-2 border-black flex items-center justify-center text-white text-xs font-black">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-black text-sm">{t('next_steps.step3.title')}</p>
                    <p className="text-xs text-gray-600 font-medium">{t('next_steps.step3.description')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 border-2 border-black flex items-center justify-center text-white text-xs font-black">
                    4
                  </div>
                  <div>
                    <p className="font-bold text-black text-sm">{t('next_steps.step4.title')}</p>
                    <p className="text-xs text-gray-600 font-medium">{t('next_steps.step4.description')}</p>
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
            {t('support.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="bg-white border-3 border-black p-4 mb-4"
                   style={{ boxShadow: '3px 3px 0 #000000' }}>
                <MailIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-black text-black text-sm uppercase mb-2">
                  {t('support.email.title')}
                </h3>
                <p className="text-xs text-gray-600 font-medium mb-3">
                  {t('support.email.response_time')}
                </p>
                <a 
                  href="mailto:soporte@furnibles.com"
                  className="text-blue-600 text-xs font-bold hover:text-blue-800 transition-colors"
                >
                  {t('support.email.address')}
                </a>
              </div>
            </div>
            
            <div>
              <div className="bg-white border-3 border-black p-4 mb-4"
                   style={{ boxShadow: '3px 3px 0 #000000' }}>
                <FileTextIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-black text-black text-sm uppercase mb-2">
                  {t('support.help_center.title')}
                </h3>
                <p className="text-xs text-gray-600 font-medium mb-3">
                  {t('support.help_center.description')}
                </p>
                <Link 
                  href="/ayuda"
                  className="text-green-600 text-xs font-bold hover:text-green-800 transition-colors"
                >
                  {t('support.help_center.link')}
                </Link>
              </div>
            </div>
            
            <div>
              <div className="bg-white border-3 border-black p-4 mb-4"
                   style={{ boxShadow: '3px 3px 0 #000000' }}>
                <StarIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-black text-black text-sm uppercase mb-2">
                  {t('support.community.title')}
                </h3>
                <p className="text-xs text-gray-600 font-medium mb-3">
                  {t('support.community.description')}
                </p>
                <Link 
                  href="/comunidad"
                  className="text-purple-600 text-xs font-bold hover:text-purple-800 transition-colors"
                >
                  {t('support.community.link')}
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
              {t('cta.title')}
            </h2>
            <p className="text-gray-600 font-bold mb-6">
              {t('cta.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 bg-blue-500 border-4 border-black px-6 py-3 font-black text-white uppercase hover:bg-yellow-400 hover:text-black transition-all"
                style={{ boxShadow: '4px 4px 0 #000000' }}
              >
                <ShoppingBagIcon className="w-5 h-5" />
                {t('cta.explore_products')}
              </Link>
              
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-white border-4 border-black px-6 py-3 font-black text-black uppercase hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '4px 4px 0 #000000' }}
              >
                <HomeIcon className="w-5 h-5" />
                {t('cta.back_home')}
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
            {t('social.title')}
          </h3>
          <p className="text-gray-600 font-bold mb-4">
            {t('social.description')}
          </p>
          
          <div className="flex justify-center gap-4">
            <button 
              className="bg-blue-600 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              onClick={shareOnTwitter}
            >
              {t('social.twitter')}
            </button>
            
            <button 
              className="bg-green-600 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              onClick={shareOnWhatsApp}
            >
              {t('social.whatsapp')}
            </button>
            
            <button 
              className="bg-blue-800 border-3 border-black px-4 py-2 font-black text-white text-sm uppercase hover:bg-yellow-400 hover:text-black transition-all"
              style={{ boxShadow: '3px 3px 0 #000000' }}
              onClick={shareOnFacebook}
            >
              {t('social.facebook')}
            </button>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-12">
          <p className="text-gray-500 font-bold text-sm">
            {t('footer_message')}
          </p>
        </div>
      </div>
    </div>
  )
}