'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/products/product-card'
import { getFeaturedProducts, getMarketplaceStats, getTopSellers } from '@/lib/homepage-api'
import { ProductCategory } from '@/types'
import { ClipboardIcon, ShoppingCartIcon, ScissorsIcon, ToolsIcon } from '@/components/icons'

interface HomepageData {
  featuredProducts: any[]
  stats: any
  topSellers: any[]
  loading: boolean
}

export default function HomePage() {
  const t = useTranslations('home')
  
  const [data, setData] = useState<HomepageData>({
    featuredProducts: [],
    stats: null,
    topSellers: [],
    loading: true
  })

  // ✅ Cargar datos reales al montar el componente
  useEffect(() => {
    async function loadHomepageData() {
      console.log('🚀 [HOMEPAGE] Loading real data...')
      
      try {
        const [products, stats, sellers] = await Promise.all([
          getFeaturedProducts(),
          getMarketplaceStats(),
          getTopSellers()
        ])

        setData({
          featuredProducts: products,
          stats,
          topSellers: sellers,
          loading: false
        })
        
        console.log('✅ [HOMEPAGE] All data loaded successfully')
      } catch (error) {
        console.error('❌ [HOMEPAGE] Error loading data:', error)
        setData(prev => ({ ...prev, loading: false }))
      }
    }

    loadHomepageData()
  }, [])

  const categories = [
    { 
      category: ProductCategory.STORAGE, 
      icon: '🛏️', 
      name: t('storage'),
      href: '/productos?categoria=STORAGE'
    },
    { 
      category: ProductCategory.LIVING_DINING, 
      icon: '🍽️', 
      name: t('living_dining'),
      href: '/productos?categoria=LIVING_DINING'
    },
    { 
      category: ProductCategory.STORAGE, 
      icon: '💼', 
      name: t('storage'),
      href: '/productos?categoria=STORAGE'
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
      {/* HERO SECTION SABDA - SIN CAMBIOS */}
      <section 
        className="bg-cover bg-center bg-no-repeat border-b-[5px] border-black px-8 py-36"
        style={{ 
        backgroundImage: 'url(/images/hero-background.jpg)',
        backgroundSize: '100%',
        boxShadow: '0 8px 0 #000000' 
        }}
      >
          <div className="max-w-6xl ml-0">           
          <div className="max-w-6xl -ml-8">           
          <div className="max-w-6xl ml-20">          
          <div className="max-w-4xl mx-auto">        
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="hero-content -ml-8 lg:flex-1 lg:max-w-none">  
              <div 
                className="bg-orange-500 text-black inline-block mb-10 px-12 py-8 border-3 border-black font-black text-4xl uppercase tracking-wide"
                style={{ boxShadow: '4px 4px 0 #000000' }}
              >
                ¡{t('exclusive_designs')}!
              </div>
              <h1 className="text-black mb-16 font-black text-6xl leading-tight uppercase" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: '1000' }}>
                {t('hero_title')} <br />
                <span className="text-black">{t('hero_subtitle')}</span>
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
        </div>
        </div>
        </div>
      </section>

      {/* CARACTERÍSTICAS SECTION - SIN CAMBIOS */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-white">
        <div className="w-full">
          <h2 
            className="text-center text-black mb-8 sm:mb-12 lg:mb-16 font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            ¿Qué incluyen nuestros planos?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 xl:gap-12">
            
            {/* Tarjeta 1: Documento */}
            <div 
              className="bg-white border-[4px] border-black p-8 sm:p-10 lg:p-12 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <div className="flex justify-center mb-6">
                <div 
                  className="bg-orange-100 border-[4px] border-black p-6 flex items-center justify-center"
                  style={{ boxShadow: '6px 6px 0 #000000' }}
                >
                  <ClipboardIcon size="2xl" className="text-black" />
                </div>
              </div>
              <h3 
                className="text-black mb-4 uppercase font-black text-xl sm:text-2xl lg:text-3xl"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {t('step_by_step')}
              </h3>
              <p 
                className="text-black font-semibold text-lg sm:text-xl lg:text-2xl"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {t('step1')}
              </p>
            </div>
            
            {/* Tarjeta 2: Carrito */}
            <div 
              className="bg-white border-[4px] border-black p-8 sm:p-10 lg:p-12 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <div className="flex justify-center mb-6">
                <div 
                  className="bg-blue-100 border-[4px] border-black p-6 flex items-center justify-center"
                  style={{ boxShadow: '6px 6px 0 #000000' }}
                >
                  <ShoppingCartIcon size="2xl" className="text-black" />
                </div>
              </div>
              <h3 
                className="text-black mb-4 uppercase font-black text-xl sm:text-2xl lg:text-3xl"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Lista de Materiales
              </h3>
              <p 
                className="text-black font-semibold text-lg sm:text-xl lg:text-2xl"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {t('step2')}
              </p>
            </div>
            
            {/* Tarjeta 3: Tijeras - DIMENSIONES EXACTAS */}
            <div 
              className="bg-white border-[4px] border-black p-8 sm:p-10 lg:p-12 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <div className="flex justify-center mb-6">
                <div 
                  className="bg-green-100 border-[4px] border-black p-6 flex items-center justify-center"
                  style={{ boxShadow: '6px 6px 0 #000000' }}
                >
                  <ScissorsIcon size="2xl" className="text-black" />
                </div>
              </div>
              <h3 
                className="text-black mb-4 uppercase font-black text-xl sm:text-2xl lg:text-3xl"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Dimensiones Exactas
              </h3>
              <p 
                className="text-black font-semibold text-lg sm:text-xl lg:text-2xl"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {t('step3')}
              </p>
            </div>
            
            {/* Tarjeta 4: Herramientas */}
            <div 
              className="bg-white border-[4px] border-black p-8 sm:p-10 lg:p-12 text-center hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ boxShadow: '8px 8px 0 #000000' }}
            >
              <div className="flex justify-center mb-6">
                <div 
                  className="bg-purple-100 border-[4px] border-black p-6 flex items-center justify-center"
                  style={{ boxShadow: '6px 6px 0 #000000' }}
                >
                  <ToolsIcon size="2xl" className="text-black" />
                </div>
              </div>
              <h3 
                className="text-black mb-4 uppercase font-black text-xl sm:text-2xl lg:text-3xl"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Soporte Técnico
              </h3>
              <p 
                className="text-black font-semibold text-lg sm:text-xl lg:text-2xl"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {t('step4')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ PRODUCTOS DESTACADOS - AHORA CON DATOS REALES */}
      <section 
        className="bg-gradient-to-br from-blue-200 to-cyan-200 border-y-[5px] border-black px-8 py-16"
        style={{ boxShadow: 'inset 0 5px 0 #000000, inset 0 -5px 0 #000000' }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 
            className="text-center text-black mb-12 font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Productos Destacados
          </h2>
          
          {data.loading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚡</div>
              <p className="text-black font-bold text-2xl">Cargando productos increíbles...</p>
              <div className="flex justify-center gap-2 mt-4">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          ) : data.featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {data.featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="text-center">
                <Link 
                  href="/productos"
                  className="bg-white border-3 border-black font-black text-black text-xl uppercase px-12 py-4 hover:bg-yellow-400 transition-all"
                  style={{ boxShadow: '5px 5px 0 #000000' }}
                >
                  Ver Todo el Catálogo ({data.stats?.totalProducts || 'muchos'} productos)
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛠️</div>
              <p className="text-black font-bold text-2xl mb-4">¡Productos en camino!</p>
              <p className="text-black text-lg">Nuestros artesanos están preparando increíbles planos para ti.</p>
            </div>
          )}
        </div>
      </section>

                       {/* ✅ VENDEDORES DESTACADOS - VERSIÓN CORREGIDA */}
      {data.topSellers.length > 0 && (
        <section className="px-8 py-16 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-center text-black mb-12 font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl uppercase"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Vendedores Destacados
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {data.topSellers.map((seller) => {
                // ✅ Validaciones de seguridad
                const storeName = seller.storeName || seller.user?.firstName || 'Vendedor'
                const slug = seller.slug || '#'
                const productCount = seller.productCount || 0
                const avgRating = seller.avgRating || 4.0
                
                return (
                  <Link
                    key={seller.id || Math.random()}
                    href={slug !== '#' ? `/vendedores/${slug}` : '#'}
                    className="bg-white border-[5px] border-black p-6 text-center group cursor-pointer hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300 hover:bg-yellow-400"
                    style={{ boxShadow: '8px 8px 0 #000000' }}
                  >
                    <div className="w-16 h-16 bg-orange-500 border-3 border-black mx-auto mb-4 flex items-center justify-center overflow-hidden">
                      {seller.avatar ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/image/${seller.avatar}`}
                          alt={storeName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // ✅ CORREGIDO: Manejo seguro del fallback
                            const target = e.currentTarget as HTMLImageElement
                            target.style.display = 'none'
                            
                            // Crear y mostrar el texto de fallback
                            const parent = target.parentElement
                            if (parent && !parent.querySelector('.fallback-text')) {
                              const fallbackSpan = document.createElement('span')
                              fallbackSpan.className = 'fallback-text text-2xl font-black text-black'
                              fallbackSpan.textContent = storeName.charAt(0).toUpperCase()
                              parent.appendChild(fallbackSpan)
                            }
                          }}
                        />
                      ) : (
                        <span className="text-2xl font-black text-black">
                          {storeName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-black font-black uppercase text-lg mb-2">
                      {storeName}
                    </h3>
                    
                    <p className="text-sm text-gray-600 font-bold mb-2">
                      {productCount} producto{productCount !== 1 ? 's' : ''}
                    </p>
                    
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <span className="text-orange-500">⭐</span>
                      <span className="text-black font-bold text-sm">
                        {avgRating.toFixed(1)}
                      </span>
                      {seller.isVerified && (
                        <span className="text-green-500 ml-1" title="Vendedor verificado">✓</span>
                      )}
                    </div>
                    
                    {seller.user?.firstName && seller.user?.lastName && (
                      <p className="text-xs text-gray-500">
                        {seller.user.firstName} {seller.user.lastName}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>

            <div className="text-center">
              <Link 
                href="/vendedores"
                className="bg-orange-500 border-3 border-black font-black text-black text-xl uppercase px-12 py-4 hover:bg-yellow-400 transition-all"
                style={{ boxShadow: '5px 5px 0 #000000' }}
              >
                Ver Todos los Vendedores
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CATEGORÍAS SECTION - SIN CAMBIOS */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 bg-white">
        <div className="w-full">
          <h2 
            className="text-center text-black mb-8 sm:mb-12 lg:mb-16 font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            {t('categories')}
          </h2>
          
          {/* Grid de categorías estilo banner - 5 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
            
            {/* LIVING & COMEDOR */}
            <Link
              href="/productos?categoria=LIVING_DINING"
              className="group relative h-80 lg:h-96 overflow-hidden border-[4px] border-black hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ 
                boxShadow: '8px 8px 0 #000000',
                backgroundImage: 'url(/images/living.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Overlay para legibilidad */}
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between p-6">
                <h3 
                  className="text-white font-black text-xl sm:text-2xl lg:text-3xl xl:text-2xl uppercase leading-tight"
                  style={{ 
                    fontFamily: 'Montserrat, sans-serif',
                    textShadow: '2px 2px 4px #000000'
                  }}
                >
                  LIVING &<br />COMEDOR
                </h3>
                
                <button 
                  className="bg-white border-[3px] border-black font-black text-black text-sm uppercase px-4 py-2 hover:bg-yellow-400 transition-all self-start"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  IR →
                </button>
              </div>
            </Link>

            {/* CUARTO */}
            <Link
              href="/productos?categoria=BEDROOM"
              className="group relative h-80 lg:h-96 overflow-hidden border-[4px] border-black hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ 
                boxShadow: '8px 8px 0 #000000',
                backgroundImage: 'url(/images/cuarto.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Overlay para legibilidad */}
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between p-6">
                <h3 
                  className="text-white font-black text-xl sm:text-2xl lg:text-3xl xl:text-2xl uppercase leading-tight"
                  style={{ 
                    fontFamily: 'Montserrat, sans-serif',
                    textShadow: '2px 2px 4px #000000'
                  }}
                >
                  CUARTO
                </h3>
                
                <button 
                  className="bg-white border-[3px] border-black font-black text-black text-sm uppercase px-4 py-2 hover:bg-yellow-400 transition-all self-start"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  IR →
                </button>
              </div>
            </Link>

            {/* NÓRDICO */}
            <Link
              href="/productos?categoria=NORDIC"
              className="group relative h-80 lg:h-96 overflow-hidden border-[4px] border-black hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ 
                boxShadow: '8px 8px 0 #000000',
                backgroundImage: 'url(/images/nordico.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Overlay para legibilidad */}
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between p-6">
                <h3 
                  className="text-white font-black text-xl sm:text-2xl lg:text-3xl xl:text-2xl uppercase leading-tight"
                  style={{ 
                    fontFamily: 'Montserrat, sans-serif',
                    textShadow: '2px 2px 4px #000000'
                  }}
                >
                  NÓRDICO
                </h3>
                
                <button 
                  className="bg-white border-[3px] border-black font-black text-black text-sm uppercase px-4 py-2 hover:bg-yellow-400 transition-all self-start"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  IR →
                </button>
              </div>
            </Link>

            {/* OUTDOOR */}
            <Link
              href="/productos?categoria=OUTDOOR"
              className="group relative h-80 lg:h-96 overflow-hidden border-[4px] border-black hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ 
                boxShadow: '8px 8px 0 #000000',
                backgroundImage: 'url(/images/outdoor.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Overlay para legibilidad */}
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between p-6">
                <h3 
                  className="text-white font-black text-xl sm:text-2xl lg:text-3xl xl:text-2xl uppercase leading-tight"
                  style={{ 
                    fontFamily: 'Montserrat, sans-serif',
                    textShadow: '2px 2px 4px #000000'
                  }}
                >
                  OUTDOOR
                </h3>
                
                <button 
                  className="bg-white border-[3px] border-black font-black text-black text-sm uppercase px-4 py-2 hover:bg-yellow-400 transition-all self-start"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  IR →
                </button>
              </div>
            </Link>

            {/* ORGANIZACIÓN */}
            <Link
              href="/productos?categoria=ORGANIZATION"
              className="group relative h-80 lg:h-96 overflow-hidden border-[4px] border-black hover:translate-x-[-3px] hover:translate-y-[-3px] transition-all duration-300"
              style={{ 
                boxShadow: '8px 8px 0 #000000',
                backgroundImage: 'url(/images/storage.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Overlay para legibilidad */}
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between p-6">
                <h3 
                  className="text-white font-black text-xl sm:text-2xl lg:text-3xl xl:text-2xl uppercase leading-tight"
                  style={{ 
                    fontFamily: 'Montserrat, sans-serif',
                    textShadow: '2px 2px 4px #000000'
                  }}
                >
                  ORGANIZACIÓN
                </h3>
                
                <button 
                  className="bg-white border-[3px] border-black font-black text-black text-sm uppercase px-4 py-2 hover:bg-yellow-400 transition-all self-start"
                  style={{ boxShadow: '4px 4px 0 #000000' }}
                >
                  IR →
                </button>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="relative bg-cover bg-center bg-no-repeat border-y-[5px] border-black px-8 py-16"
        style={{ 
        backgroundImage: 'url(/images/comunidad.jpg)',
        boxShadow: 'inset 0 5px 0 #000000, inset 0 -5px 0 #000000' 
        }}
      >
  {/* Overlay para mejorar legibilidad del texto */}
  <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 max-w-6xl mx-auto">
          <h2 
            className="text-center text-black mb-12 font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl uppercase"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
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
            <p className="text-white font-bold text-2xl mb-8">
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
            <h2 
              className="text-black mb-6 font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl uppercase"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
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