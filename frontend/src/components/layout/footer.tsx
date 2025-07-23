'use client'

import { useTranslations } from 'next-intl'
export function Footer() {
  const t = useTranslations('footer')
  
  return (
    <footer className="bg-black text-white border-t-[5px] border-orange-500">
      <div className="max-w-6xl mx-auto px-8 py-12 text-center">
        <h3 className="text-yellow-400 font-black text-xl uppercase mb-4">
          {t('title')}
        </h3>
        <p className="mb-4">
          {t('description')}
        </p>
        <p className="mb-4">
          {t('copyright')}
        </p>
        <p>
          {t('follow_us')}: 
          <a href="#" className="text-yellow-400 hover:text-orange-500 font-bold ml-2">
            {t('social.facebook')}
          </a> |
          <a href="#" className="text-yellow-400 hover:text-orange-500 font-bold mx-2">
            {t('social.instagram')}
          </a> |
          <a href="#" className="text-yellow-400 hover:text-orange-500 font-bold">
            {t('social.pinterest')}
          </a>
        </p>
      </div>
    </footer>
  )
}
