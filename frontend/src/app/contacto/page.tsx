'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MetaTags } from '@/components/SEO/meta-tags'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { NotificationType } from '@/types/additional'
import { useAuthStore } from '@/lib/stores/auth-store'

interface ContactForm {
  name: string
  email: string
  subject: string
  category: string
  message: string
  attachments?: File[]
}

export default function ContactoPage() {
  const t = useTranslations('contact')
  const tCommon = useTranslations('common')
  const { addNotification } = useNotificationStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
    attachments: []
  })

    // Helper para crear notificaciones completas
const createNotification = (
  type: NotificationType,
  title: string,
  message: string,
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
) => ({
  id: `notif-${Date.now()}`,
  userId: user?.id || '',
  type,
  title,
  message,
  data: {},
  isRead: false,
  readAt: undefined,
  sentAt: new Date().toISOString(),
  emailSent: false,
  orderId: undefined,
  priority: priority as any,
  channel: 'IN_APP' as any,
  groupKey: undefined,
  expiresAt: undefined,
  clickedAt: undefined,
  clickCount: 0,
  createdAt: new Date().toISOString()
})

  const categories = [
    { value: 'general', label: t('categories.general') },
    { value: 'technical', label: t('categories.technical') },
    { value: 'billing', label: t('categories.billing') },
    { value: 'seller', label: t('categories.seller') },
    { value: 'buyer', label: t('categories.buyer') },
    { value: 'partnership', label: t('categories.partnership') },
    { value: 'press', label: t('categories.press') },
    { value: 'legal', label: t('categories.legal') }
  ]

  const contactMethods = [
    {
      type: 'email',
      title: t('methods.email.title'),
      value: 'hello@furnibles.com',
      description: t('methods.email.description'),
      icon: '✉️',
      response: t('methods.email.response')
    },
    {
      type: 'support',
      title: t('methods.support.title'),
      value: 'support@furnibles.com',
      description: t('methods.support.description'),
      icon: '🛠️',
      response: t('methods.support.response')
    },
    {
      type: 'phone',
      title: t('methods.phone.title'),
      value: '+1 (555) 123-4567',
      description: t('methods.phone.description'),
      icon: '📞',
      response: t('methods.phone.response')
    },
    {
      type: 'whatsapp',
      title: t('methods.whatsapp.title'),
      value: '+1 (555) 987-6543',
      description: t('methods.whatsapp.description'),
      icon: '💬',
      response: t('methods.whatsapp.response')
    }
  ]

  const faqs = [
    {
      question: t('faq.seller_fees.question'),
      answer: t('faq.seller_fees.answer')
    },
    {
      question: t('faq.upload_products.question'),
      answer: t('faq.upload_products.answer')
    },
    {
      question: t('faq.payment_methods.question'),
      answer: t('faq.payment_methods.answer')
    },
    {
      question: t('faq.download_issues.question'),
      answer: t('faq.download_issues.answer')
    },
    {
      question: t('faq.refund_policy.question'),
      answer: t('faq.refund_policy.answer')
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.message) {
      
        addNotification(createNotification(
        'VALIDATION_ERROR' as NotificationType,
        t('form.error_title'),
        t('form.required_fields'),
        'HIGH'
      ))
      return
    }

    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      addNotification(createNotification(
        'MESSAGE_SENT' as NotificationType,
        t('form.success_title'),
        t('form.success_message')
      ))

      setFormData({
        name: '',
        email: '',
        subject: '',
        category: 'general',
        message: '',
        attachments: []
      })

    } catch (error) {
      addNotification(createNotification(
        'SYSTEM_ERROR' as NotificationType,
        t('form.error_title'),
        t('form.error_message'),
        'HIGH'
      ))
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({ 
      ...prev, 
      attachments: [...(prev.attachments || []), ...files] 
    }))
  }

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || []
    }))
  }

  return (
    <>
      <MetaTags
        title={t('page_title')}
        description={t('page_description')}
        keywords={['contacto', 'soporte', 'ayuda', 'atención al cliente']}
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t('page_title')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('page_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {t('form.title')}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.name')} *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          name: e.target.value 
                        }))}
                        placeholder={t('form.name_placeholder')}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.email')} *
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          email: e.target.value 
                        }))}
                        placeholder={t('form.email_placeholder')}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.subject')}
                      </label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          subject: e.target.value 
                        }))}
                        placeholder={t('form.subject_placeholder')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('form.category')}
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          category: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sabda-primary"
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.message')} *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        message: e.target.value 
                      }))}
                      placeholder={t('form.message_placeholder')}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sabda-primary resize-vertical"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.attachments')}
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      />
                      <label 
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center justify-center text-center"
                      >
                        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {t('form.attachment_text')}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          {t('form.attachment_limit')}
                        </span>
                      </label>
                    </div>

                    {formData.attachments && formData.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm text-gray-700 truncate">
                              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="min-w-[120px]"
                    >
                      {loading ? t('form.sending') : t('form.send')}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('methods.title')}
                </h2>
                
                <div className="space-y-4">
                  {contactMethods.map((method) => (
                    <div key={method.type} className="flex items-start gap-3">
                      <span className="text-xl">{method.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {method.title}
                        </h3>
                        <p className="text-sabda-primary font-medium text-sm">
                          {method.value}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {method.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {method.response}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('hours.title')}
                </h2>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('hours.monday_friday')}</span>
                    <span className="font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('hours.saturday')}</span>
                    <span className="font-medium">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('hours.sunday')}</span>
                    <span className="font-medium">{t('hours.closed')}</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      {t('hours.timezone')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('faq.title')}
                </h2>
                
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <details key={index} className="group">
                      <summary className="flex justify-between items-center cursor-pointer list-none">
                        <span className="font-medium text-gray-900 text-sm pr-2">
                          {faq.question}
                        </span>
                        <span className="text-gray-400 group-open:rotate-180 transition-transform">
                          ▼
                        </span>
                      </summary>
                      <div className="mt-2 text-sm text-gray-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    {t('faq.more_help')}
                  </p>
                  <div className="text-center mt-2">
                    <a 
                      href="/ayuda"
                      className="text-sabda-primary hover:text-sabda-primary-dark font-medium text-sm"
                    >
                      {t('faq.visit_help_center')}
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sabda-primary"></div>
                  <span className="text-gray-900">{t('form.sending')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}