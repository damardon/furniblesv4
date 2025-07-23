'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { MetaTags } from '@/components/SEO/meta-tags'

export default function TerminosPage() {
  const t = useTranslations('legal.terms')
  const tCommon = useTranslations('common')

  const sections = [
    {
      id: 'acceptance',
      title: t('acceptance.title'),
      content: t('acceptance.content')
    },
    {
      id: 'definitions',
      title: t('definitions.title'),
      content: t('definitions.content')
    },
    {
      id: 'services',
      title: t('services.title'),
      content: t('services.content')
    },
    {
      id: 'user_accounts',
      title: t('user_accounts.title'),
      content: t('user_accounts.content')
    },
    {
      id: 'seller_obligations',
      title: t('seller_obligations.title'),
      content: t('seller_obligations.content')
    },
    {
      id: 'buyer_obligations',
      title: t('buyer_obligations.title'),
      content: t('buyer_obligations.content')
    },
    {
      id: 'intellectual_property',
      title: t('intellectual_property.title'),
      content: t('intellectual_property.content')
    },
    {
      id: 'payments',
      title: t('payments.title'),
      content: t('payments.content')
    },
    {
      id: 'refunds',
      title: t('refunds.title'),
      content: t('refunds.content')
    },
    {
      id: 'prohibited_content',
      title: t('prohibited_content.title'),
      content: t('prohibited_content.content')
    },
    {
      id: 'platform_fees',
      title: t('platform_fees.title'),
      content: t('platform_fees.content')
    },
    {
      id: 'liability',
      title: t('liability.title'),
      content: t('liability.content')
    },
    {
      id: 'termination',
      title: t('termination.title'),
      content: t('termination.content')
    },
    {
      id: 'privacy',
      title: t('privacy.title'),
      content: t('privacy.content')
    },
    {
      id: 'modifications',
      title: t('modifications.title'),
      content: t('modifications.content')
    },
    {
      id: 'governing_law',
      title: t('governing_law.title'),
      content: t('governing_law.content')
    },
    {
      id: 'contact',
      title: t('contact.title'),
      content: t('contact.content')
    }
  ]

  const tableOfContents = sections.map((section, index) => ({
    ...section,
    number: index + 1
  }))

  return (
    <>
      <MetaTags
        title={t('page_title')}
        description={t('page_description')}
        keywords={['términos', 'condiciones', 'legal', 'marketplace', 'muebles']}
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t('page_title')}
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              {t('page_subtitle')}
            </p>
            <div className="text-sm text-gray-500">
              <p>{t('last_updated')}: {t('last_updated_date')}</p>
              <p>{t('effective_date')}: {t('effective_date_value')}</p>
            </div>
          </div>

          {/* Table of Contents */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('table_of_contents')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tableOfContents.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 transition-colors text-sm"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sabda-primary text-white text-xs flex items-center justify-center font-medium">
                    {item.number}
                  </span>
                  <span className="text-gray-700 hover:text-sabda-primary">
                    {item.title}
                  </span>
                </a>
              ))}
            </div>
          </Card>

          {/* Content Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={section.id} id={section.id}>
                <Card className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-sabda-primary text-white text-sm flex items-center justify-center font-semibold">
                    {index + 1}
                  </span>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {section.title}
                  </h2>
                </div>
                
                <div className="ml-12">
                  <div className="prose prose-gray max-w-none">
                    {section.content.split('\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-4 text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </Card>
              </div>
            ))}
          </div>

          {/* Important Notice */}
          <Card className="p-6 mt-8 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 text-amber-600">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">
                  {t('important_notice.title')}
                </h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  {t('important_notice.content')}
                </p>
              </div>
            </div>
          </Card>

          {/* Footer Actions */}
          <div className="mt-12 text-center">
            <div className="space-y-4">
              <p className="text-gray-600">
                {t('questions_text')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contacto"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sabda-primary hover:bg-sabda-primary-dark transition-colors"
                >
                  {t('contact_us')}
                </a>
                <a
                  href="/ayuda"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  {t('help_center')}
                </a>
              </div>
            </div>
          </div>

          {/* Download Options */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              {t('download_text')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('download_pdf')}
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {t('print')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}