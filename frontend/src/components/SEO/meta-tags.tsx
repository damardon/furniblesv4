import Head from 'next/head'
import { useTranslations } from 'next-intl'

interface MetaTagsProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product' | 'profile'
  siteName?: string
  locale?: string
  alternateLocales?: string[]
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  price?: {
    amount: string
    currency: string
  }
  availability?: 'in stock' | 'out of stock' | 'preorder'
  condition?: 'new' | 'used' | 'refurbished'
  brand?: string
  category?: string
  noIndex?: boolean
  noFollow?: boolean
  canonical?: string
}

export function MetaTags({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  siteName = 'Furnibles',
  locale = 'es',
  alternateLocales = ['en'],
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  price,
  availability,
  condition,
  brand,
  category,
  noIndex = false,
  noFollow = false,
  canonical,
}: MetaTagsProps) {
  const t = useTranslations('seo')
  
  // Valores por defecto
  const defaultTitle = t('default_title')
  const defaultDescription = t('default_description')
  const defaultImage = '/images/og-image.jpg'
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://furnibles.com'
  
  // Construir título completo
  const fullTitle = title 
    ? `${title} | ${siteName}`
    : defaultTitle

  // Construir descripción
  const metaDescription = description || defaultDescription

  // Construir imagen completa
  const fullImage = image 
    ? (image.startsWith('http') ? image : `${baseUrl}${image}`)
    : `${baseUrl}${defaultImage}`

  // Construir URL completa
  const fullUrl = url 
    ? (url.startsWith('http') ? url : `${baseUrl}${url}`)
    : baseUrl

  // Construir keywords
  const allKeywords = [
    ...keywords,
    t('default_keywords').split(',').map(k => k.trim())
  ].join(', ')

  // JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type === 'product' ? 'Product' : 'WebSite',
    name: title || defaultTitle,
    description: metaDescription,
    url: fullUrl,
    image: fullImage,
    ...(type === 'product' && {
      brand: brand && {
        '@type': 'Brand',
        name: brand
      },
      category,
      offers: price && {
        '@type': 'Offer',
        price: price.amount,
        priceCurrency: price.currency,
        availability: `https://schema.org/${availability === 'in stock' ? 'InStock' : 'OutOfStock'}`,
        itemCondition: `https://schema.org/${condition === 'new' ? 'NewCondition' : 'UsedCondition'}`
      }
    }),
    ...(type === 'article' && {
      '@type': 'Article',
      headline: title,
      author: author && {
        '@type': 'Person',
        name: author
      },
      datePublished: publishedTime,
      dateModified: modifiedTime,
      articleSection: section,
      keywords: tags.join(', ')
    })
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={allKeywords} />
      <meta name="author" content={author || siteName} />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      
      {/* Robots */}
      <meta 
        name="robots" 
        content={`${noIndex ? 'noindex' : 'index'},${noFollow ? 'nofollow' : 'follow'}`} 
      />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Language */}
      <meta httpEquiv="content-language" content={locale} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:alt" content={title || defaultTitle} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale.replace('-', '_')} />
      
      {/* Alternate locales */}
      {alternateLocales.map((altLocale) => (
        <meta 
          key={altLocale}
          property="og:locale:alternate" 
          content={altLocale.replace('-', '_')} 
        />
      ))}
      
      {/* Article specific */}
      {type === 'article' && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Product specific */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price.amount} />
          <meta property="product:price:currency" content={price.currency} />
          {availability && <meta property="product:availability" content={availability} />}
          {condition && <meta property="product:condition" content={condition} />}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={title || defaultTitle} />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#d17943" />
      <meta name="msapplication-TileColor" content="#d17943" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  )
}

// Utility function to generate meta tags for products
export function generateProductMeta(product: {
  id: string
  title: string
  description: string
  price: number
  category: string
  imageUrl?: string
  slug: string
  seller?: {
    storeName: string
  }
}) {
  return {
    title: product.title,
    description: product.description,
    keywords: [product.category, 'muebles', 'planos', 'bricolaje', 'DIY'],
    image: product.imageUrl,
    url: `/productos/${product.slug}`,
    type: 'product' as const,
    price: {
      amount: product.price.toString(),
      currency: 'USD'
    },
    availability: 'in stock' as const,
    condition: 'new' as const,
    brand: product.seller?.storeName,
    category: product.category
  }
}

// Utility function for blog/article meta
export function generateArticleMeta(article: {
  title: string
  description: string
  slug: string
  author?: string
  publishedAt: string
  updatedAt?: string
  tags?: string[]
  imageUrl?: string
}) {
  return {
    title: article.title,
    description: article.description,
    url: `/blog/${article.slug}`,
    type: 'article' as const,
    author: article.author,
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    tags: article.tags,
    image: article.imageUrl
  }
}

// Utility function for seller profile meta
export function generateSellerMeta(seller: {
  storeName: string
  description?: string
  slug: string
  avatar?: string
}) {
  return {
    title: `${seller.storeName} - Tienda`,
    description: seller.description || `Descubre los productos de ${seller.storeName} en Furnibles`,
    url: `/vendedores/${seller.slug}`,
    type: 'profile' as const,
    keywords: ['vendedor', 'tienda', seller.storeName, 'muebles'],
    image: seller.avatar
  }
}

// Component wrapper for easy usage
export function SEOHead(props: MetaTagsProps) {
  return <MetaTags {...props} />
}