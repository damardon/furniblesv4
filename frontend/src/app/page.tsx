'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ProductCard } from '@/components/products/product-card'
import { featuredProducts } from '@/data/mockProducts'
import { ProductCategory } from '@/types'

export default function HomePage() {
  const t = useTranslations('home')

  const categories = [
    { 
      category: ProductCategory.BEDS, 
      icon: '🛏️', 
      name: t('bedroom'),
      href: '/productos?categoria=BEDS'
    },
    { 
      category: ProductCategory.TABLES, 
      icon: '🍽️', 
      name: t('living_dining'),
      href: '/productos?categoria=TABLES'
    },
    { 
      category: ProductCategory.DESKS, 
      icon: '💼', 
      name: t('kitchen'),
      href: '/productos?categoria=DESKS'
    },
    { 
      category: ProductCategory.OUTDOOR, 
      icon: '🌳', 
      name: t('outdoor'),
      href: '/productos?categoria=OUTDOOR'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* HERO SECTION SABDA */}
      <section 
        className="bg-gradient-to-br from-orange-200 to-yellow-200 border-b-[5px] border-black px-8 py-16"
        style={{ boxShadow: '0 8px 0 #000000' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="hero-content">
              <div 
                className="bg-orange-500 text-black inline-block mb-6 px-4 py-2 border-3 border-black font-black text-sm uppercase tracking-wide"
                style={{ boxShadow: '4px 4px 0 #000000' }}
              >
                ¡{t('exclusive_designs')}!
              </div>
              <h1 className="text-black mb-6 font-black text-6xl leading-tight uppercase">
                {t('hero_title')} <br />
                <span className="text-orange-500">{t('hero_subtitle')}</span>
              </h1>
              <p className="text-black font-bold text-xl mb-8 leading-relaxed">
                {t('exclusive_designs_desc')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/productos"
                  className="bg-white border-3 border-black font-black text-black text-lg uppercase px-8 py-4 hover:bg-yellow-400 transition-all"
                  style={{ boxShadow: '5px 5px 0 #000000' }}
                >
                  Ver Catálogo
                </Link>
                <Link 
                  href="/contacto"
                  className="bg-orange-500 border-3 border-black font-black text-black text-lg uppercase px-8 py-4 hover:bg-yellow-400 transition-all"
                  style={{ boxShadow: '5px 5px 0 #000000' }}
                >
                  Cotizar Ahora
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div 
                className="bg-yellow-400 text-black border-[5px] border-black rounded-full w-48 h-48 flex items-center justify-center text-center font-black text-lg uppercase leading-tight hover:scale-105 transition-transform"
                style={{ boxShadow: '8px 8px 0 #000000' }}
              >
                {t('quality')}<br />Premium<br />Garantizada
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CARACTERÍSTICAS SECTION */}
      <section className="px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-black mb-12 font-black text-5xl uppercase">
            ¿Qué incluyen nuestros planos?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div 
              className="bg-white border-[5px] border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-black mb-3 uppercase font-black text-lg">{t('step_by_step')}</h3>
              <p className="text-black font-medium">{t('step1')}</p>
            </div>
            
            <div 
              className="bg-white border-[5px] border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-black mb-3 uppercase font-black text-lg">Lista de Materiales</h3>
              <p className="text-black font-medium">{t('step2')}</p>
            </div>
            
            <div 
              className="bg-white border-[5px] border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <div className="text-6xl mb-4">✂️</div>
              <h3 className="text-black mb-3 uppercase font-black text-lg">Cortes Precisos</h3>
              <p className="text-black font-medium">{t('step3')}</p>
            </div>
            
            <div 
              className="bg-white border-[5px] border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <div className="text-6xl mb-4">🛠️</div>
              <h3 className="text-black mb-3 uppercase font-black text-lg">Soporte Técnico</h3>
              <p className="text-black font-medium">{t('step4')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section 
        className="bg-gradient-to-br from-blue-200 to-cyan-200 border-y-[5px] border-black px-8 py-16"
        style={{ boxShadow: 'inset 0 5px 0 #000000, inset 0 -5px 0 #000000' }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-black mb-12 font-black text-5xl uppercase">
            Productos Destacados
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center">
            <Link 
              href="/productos"
              className="bg-white border-3 border-black font-black text-black text-xl uppercase px-12 py-4 hover:bg-yellow-400 transition-all"
              style={{ boxShadow: '5px 5px 0 #000000' }}
            >
              Ver Todo el Catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS SECTION */}
      <section className="px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-black mb-12 font-black text-5xl uppercase">
            {t('categories')}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, index) => (
              <Link
                key={cat.category}
                href={cat.href}
                className="bg-white border-[5px] border-black p-8 text-center group cursor-pointer hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300 hover:bg-yellow-400"
                style={{ boxShadow: '8px 8px 0 #000000' }}
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <h3 className="text-black font-black uppercase text-lg">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section 
        className="bg-gradient-to-br from-orange-300 to-yellow-300 border-y-[5px] border-black px-8 py-16"
        style={{ boxShadow: 'inset 0 5px 0 #000000, inset 0 -5px 0 #000000' }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-black mb-12 font-black text-5xl uppercase">
            {t('join_community')}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div 
              className="bg-white border-[5px] border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <div className="text-4xl font-black text-orange-500 mb-2">1000+</div>
              <div className="text-black font-black uppercase text-sm">{t('models')}</div>
            </div>
            
            <div 
              className="bg-white border-[5px] border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <div className="text-4xl font-black text-orange-500 mb-2">15K+</div>
              <div className="text-black font-black uppercase text-sm">{t('members')}</div>
            </div>
            
            <div 
              className="bg-white border-[5px] border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <div className="text-4xl font-black text-orange-500 mb-2">25+</div>
              <div className="text-black font-black uppercase text-sm">{t('countries')}</div>
            </div>
            
            <div 
              className="bg-white border-[5px] border-black p-6 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <div className="text-4xl font-black text-orange-500 mb-2">98%</div>
              <div className="text-black font-black uppercase text-sm">Satisfacción</div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-black font-bold text-xl mb-8">
              {t('community_desc')}
            </p>
            <Link 
              href="/vender"
              className="bg-yellow-400 border-3 border-black font-black text-black text-xl uppercase px-12 py-4 hover:bg-orange-500 transition-all"
              style={{ boxShadow: '5px 5px 0 #000000' }}
            >
              {t('join_now')}
            </Link>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-8 py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div 
            className="bg-white border-[5px] border-black p-12 hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
            style={{ boxShadow: '8px 8px 0 #000000' }}
          >
            <h2 className="text-black mb-6 font-black text-4xl uppercase">
              ¡Transforma tu hogar hoy!
            </h2>
            <p className="text-black font-bold text-xl mb-8">
              Únete a miles de artesanos que ya están creando muebles únicos con nuestros planos premium.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/productos"
                className="bg-white border-3 border-black font-black text-black text-lg uppercase px-8 py-3 hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '4px 4px 0 #000000' }}
              >
                Explorar Catálogo
              </Link>
              <Link 
                href="/vender"
                className="bg-orange-500 border-3 border-black font-black text-black text-lg uppercase px-8 py-3 hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '4px 4px 0 #000000' }}
              >
                Vender mis Planos
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}