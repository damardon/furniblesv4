'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import {
  Search,
  HelpCircle,
  Download,
  CreditCard,
  Shield,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Book,
  Wrench,
  Users,
  Star
} from 'lucide-react'

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  
  const t = useTranslations('help')
  const tCommon = useTranslations('common')

  // Categorías de ayuda
  const helpCategories = [
    { id: 'all', label: t('categories.all'), icon: HelpCircle },
    { id: 'orders', label: t('categories.orders'), icon: FileText },
    { id: 'downloads', label: t('categories.downloads'), icon: Download },
    { id: 'payments', label: t('categories.payments'), icon: CreditCard },
    { id: 'sellers', label: t('categories.sellers'), icon: Users },
    { id: 'technical', label: t('categories.technical'), icon: Wrench },
  ]

  // Preguntas frecuentes
  const faqs = [
    {
      id: '1',
      category: 'orders',
      question: t('faqs.download_after_purchase.question'),
      answer: t('faqs.download_after_purchase.answer')
    },
    {
      id: '2',
      category: 'downloads',
      question: t('faqs.pdf_not_opening.question'),
      answer: t('faqs.pdf_not_opening.answer')
    },
    {
      id: '3',
      category: 'payments',
      question: t('faqs.payment_methods.question'),
      answer: t('faqs.payment_methods.answer')
    },
    {
      id: '4',
      category: 'sellers',
      question: t('faqs.how_to_sell.question'),
      answer: t('faqs.how_to_sell.answer')
    },
    {
      id: '5',
      category: 'technical',
      question: t('faqs.tools_needed.question'),
      answer: t('faqs.tools_needed.answer')
    },
    {
      id: '6',
      category: 'orders',
      question: t('faqs.refunds.question'),
      answer: t('faqs.refunds.answer')
    },
    {
      id: '7',
      category: 'technical',
      question: t('faqs.measurements.question'),
      answer: t('faqs.measurements.answer')
    },
    {
      id: '8',
      category: 'sellers',
      question: t('faqs.commission.question'),
      answer: t('faqs.commission.answer')
    }
  ]

  // Filtrar FAQs
  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b-[5px] border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="p-4 bg-blue-500 border-3 border-black mx-auto w-fit mb-6">
            <HelpCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-black uppercase text-black mb-4">
            {t('hero.title')}
          </h1>
          <p className="text-lg font-bold text-gray-700 mb-8 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>

          {/* Búsqueda */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-3 border-black font-bold text-lg focus:outline-none focus:bg-yellow-400 transition-all"
                style={{ boxShadow: '5px 5px 0 #000000' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Accesos Rápidos */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black uppercase text-black text-center mb-8">
            {t('quick_access.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/pedidos"
              className="group p-6 bg-white border-3 border-black hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '5px 5px 0 #000000' }}
            >
              <FileText className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="font-black text-lg uppercase mb-2">{t('quick_access.my_orders.title')}</h3>
              <p className="text-sm font-bold text-gray-600 group-hover:text-black">
                {t('quick_access.my_orders.description')}
              </p>
            </Link>

            <Link
              href="/descargas"
              className="group p-6 bg-white border-3 border-black hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '5px 5px 0 #000000' }}
            >
              <Download className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="font-black text-lg uppercase mb-2">{t('quick_access.my_downloads.title')}</h3>
              <p className="text-sm font-bold text-gray-600 group-hover:text-black">
                {t('quick_access.my_downloads.description')}
              </p>
            </Link>

            <Link
              href="/vendedor-dashboard"
              className="group p-6 bg-white border-3 border-black hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '5px 5px 0 #000000' }}
            >
              <Users className="h-8 w-8 text-orange-600 mb-4" />
              <h3 className="font-black text-lg uppercase mb-2">{t('quick_access.sell.title')}</h3>
              <p className="text-sm font-bold text-gray-600 group-hover:text-black">
                {t('quick_access.sell.description')}
              </p>
            </Link>

            <a
              href="mailto:soporte@furnibles.com"
              className="group p-6 bg-white border-3 border-black hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '5px 5px 0 #000000' }}
            >
              <Mail className="h-8 w-8 text-red-600 mb-4" />
              <h3 className="font-black text-lg uppercase mb-2">{t('quick_access.contact.title')}</h3>
              <p className="text-sm font-bold text-gray-600 group-hover:text-black">
                {t('quick_access.contact.description')}
              </p>
            </a>
          </div>
        </div>
      </section>

      {/* Preguntas Frecuentes */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black uppercase text-black text-center mb-8">
            {t('faq.title')}
          </h2>

          {/* Filtros por categoría */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {helpCategories.map((category) => {
              const Icon = category.icon
              const isActive = selectedCategory === category.id
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 font-black text-sm uppercase transition-all border-2
                    ${isActive 
                      ? 'bg-orange-500 text-black border-black' 
                      : 'bg-white text-black border-black hover:bg-yellow-400'
                    }
                  `}
                  style={{ 
                    boxShadow: isActive ? '3px 3px 0 #000000' : '2px 2px 0 #000000',
                    transform: isActive ? 'translate(-1px, -1px)' : 'none'
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                </button>
              )
            })}
          </div>

          {/* Lista de FAQs */}
          <div className="space-y-4">
            {filteredFAQs.map((faq) => {
              const isExpanded = expandedFAQ === faq.id
              
              return (
                <div
                  key={faq.id}
                  className="bg-white border-3 border-black"
                  style={{ boxShadow: '5px 5px 0 #000000' }}
                >
                  <button
                    onClick={() => setExpandedFAQ(isExpanded ? null : faq.id)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-yellow-400 transition-all"
                  >
                    <h3 className="font-black text-lg text-black pr-4">
                      {faq.question}
                    </h3>
                    {isExpanded ? (
                      <ChevronDown className="h-6 w-6 text-black flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-6 w-6 text-black flex-shrink-0" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t-2 border-black bg-gray-50">
                      <p className="font-bold text-gray-700 leading-relaxed pt-4">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-black text-gray-600 mb-2">
                {t('no_results.title')}
              </h3>
              <p className="text-gray-500">
                {t('no_results.description')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Recursos Adicionales */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black uppercase text-black text-center mb-8">
            {t('additional_resources.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
              <Book className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="font-black text-lg uppercase mb-2">{t('additional_resources.guides.title')}</h3>
              <p className="text-sm font-bold text-gray-600 mb-4">
                {t('additional_resources.guides.description')}
              </p>
              <a 
                href="/guias" 
                className="inline-flex items-center gap-2 text-purple-600 font-black hover:underline"
              >
                {t('additional_resources.guides.link')} <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="p-6 bg-white border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
              <Shield className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="font-black text-lg uppercase mb-2">{t('additional_resources.security.title')}</h3>
              <p className="text-sm font-bold text-gray-600 mb-4">
                {t('additional_resources.security.description')}
              </p>
              <a 
                href="/seguridad" 
                className="inline-flex items-center gap-2 text-green-600 font-black hover:underline"
              >
                {t('additional_resources.security.link')} <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="p-6 bg-white border-3 border-black" style={{ boxShadow: '5px 5px 0 #000000' }}>
              <Star className="h-8 w-8 text-yellow-600 mb-4" />
              <h3 className="font-black text-lg uppercase mb-2">{t('additional_resources.reviews.title')}</h3>
              <p className="text-sm font-bold text-gray-600 mb-4">
                {t('additional_resources.reviews.description')}
              </p>
              <a 
                href="/reviews" 
                className="inline-flex items-center gap-2 text-yellow-600 font-black hover:underline"
              >
                {t('additional_resources.reviews.link')} <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="py-12 bg-white border-t-[5px] border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black uppercase text-black mb-8">
            {t('contact.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-gray-50 border-2 border-black">
              <Mail className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-black text-lg uppercase mb-2">{t('contact.email.title')}</h3>
              <p className="text-sm font-bold text-gray-600 mb-3">
                {t('contact.email.response_time')}
              </p>
              <a 
                href="mailto:soporte@furnibles.com"
                className="text-blue-600 font-black hover:underline"
              >
                {t('contact.email.address')}
              </a>
            </div>

            <div className="p-6 bg-gray-50 border-2 border-black">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <h3 className="font-black text-lg uppercase mb-2">{t('contact.hours.title')}</h3>
              <p className="text-sm font-bold text-gray-600">
                {t('contact.hours.schedule')}
              </p>
            </div>

            <div className="p-6 bg-gray-50 border-2 border-black">
              <MessageSquare className="h-8 w-8 text-orange-600 mx-auto mb-4" />
              <h3 className="font-black text-lg uppercase mb-2">{t('contact.chat.title')}</h3>
              <p className="text-sm font-bold text-gray-600 mb-3">
                {t('contact.chat.coming_soon')}
              </p>
              <span className="text-gray-500 text-sm">
                {t('contact.chat.in_development')}
              </span>
            </div>
          </div>

          <div 
            className="p-6 bg-yellow-400 border-3 border-black max-w-md mx-auto"
            style={{ boxShadow: '5px 5px 0 #000000' }}
          >
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-4" />
            <h3 className="font-black text-lg uppercase mb-2">
              {t('guarantee.title')}
            </h3>
            <p className="text-sm font-bold text-black">
              {t('guarantee.description')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}