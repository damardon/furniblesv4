import Head from 'next/head'
import { useTranslations } from 'next-intl'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product' | 'profile'
  locale?: string
  siteName?: string
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  price?: {
    amount: number
    currency: string
  }
  availability?: 'instock' | 'outofstock' | 'preorder'
  brand?: string
  category?: string
  noindex?: boolean
  nofollow?: boolean
  canonical?: string
  alternates?: Array<{
    href: string
    hreflang: string
  }>
  structuredData?: object
}

export function MetaTags({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  locale = 'es_ES',
  siteName = 'Furnibles',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  price,
  availability,
  brand,
  category,
  noindex = false,
  nofollow = false,
  canonical,
  alternates = [],
  structuredData
}: SEOProps) {
  const t = useTranslations('seo')
  
  // Default values
  const defaultTitle = t('default.title')
  const defaultDescription = t('default.description')
  const defaultKeywords = t('default.keywords').split(',')
  const defaultImage = '/images/og-default.jpg'
  
  // Construct final values
  const finalTitle = title ? `${title} | ${siteName}` : defaultTitle
  const finalDescription = description || defaultDescription
  const finalKeywords = [...defaultKeywords, ...keywords].join(', ')
  const finalImage = image || defaultImage
  const finalUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  
  // Ensure absolute URLs
  const absoluteImage = finalImage.startsWith('http') ? finalImage : `${process.env.NEXT_PUBLIC_APP_URL}${finalImage}`
  const absoluteUrl = finalUrl.startsWith('http') ? finalUrl : `${process.env.NEXT_PUBLIC_APP_URL}${finalUrl}`

  // Generate robots content
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ')

  // Schema.org structured data
  const generateStructuredData = () => {
    if (structuredData) {
      return structuredData
    }

    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': type === 'product' ? 'Product' : 'WebPage',
      name: title || siteName,
      description: finalDescription,
      url: absoluteUrl,
      image: absoluteImage
    }

    if (type === 'product' && price) {
      return {
        ...baseSchema,
        '@type': 'Product',
        brand: {
          '@type': 'Brand',
          name: brand || siteName
        },
        category: category,
        offers: {
          '@type': 'Offer',
          price: price.amount,
          priceCurrency: price.currency,
          availability: `https://schema.org/${availability === 'instock' ? 'InStock' : availability === 'outofstock' ? 'OutOfStock' : 'PreOrder'}`,
          seller: {
            '@type': 'Organization',
            name: siteName
          }
        }
      }
    }

    if (type === 'article') {
      return {
        ...baseSchema,
        '@type': 'Article',
        headline: title,
        author: {
          '@type': 'Person',
          name: author || siteName
        },
        publisher: {
          '@type': 'Organization',
          name: siteName,
          logo: {
            '@type': 'ImageObject',
            url: `${process.env.NEXT_PUBLIC_APP_URL}/images/logo.png`
          }
        },
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        articleSection: section,
        keywords: tags.join(', ')
      }
    }

    // Website/Organization schema
    return {
      ...baseSchema,
      '@type': 'WebSite',
      publisher: {
        '@type': 'Organization',
        name: siteName,
        url: process.env.NEXT_PUBLIC_APP_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${process.env.NEXT_PUBLIC_APP_URL}/images/logo.png`
        },
        sameAs: [
          'https://facebook.com/furnibles',
          'https://instagram.com/furnibles',
          'https://twitter.com/furnibles'
        ]
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${process.env.NEXT_PUBLIC_APP_URL}/productos?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    }
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content={author || siteName} />
      <meta name="robots" content={robotsContent} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Language Alternates */}
      {alternates.map((alt, index) => (
        <link key={index} rel="alternate" hrefLang={alt.hreflang} href={alt.href} />
      ))}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Open Graph - Article specific */}
      {type === 'article' && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Open Graph - Product specific */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price.amount.toString()} />
          <meta property="product:price:currency" content={price.currency} />
          {availability && <meta property="product:availability" content={availability} />}
          {brand && <meta property="product:brand" content={brand} />}
          {category && <meta property="product:category" content={category} />}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@furnibles" />
      <meta name="twitter:creator" content="@furnibles" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={absoluteImage} />
      
      {/* Additional Twitter tags for products */}
      {type === 'product' && price && (
        <>
          <meta name="twitter:label1" content="Price" />
          <meta name="twitter:data1" content={`${price.currency} ${price.amount}`} />
          {availability && (
            <>
              <meta name="twitter:label2" content="Availability" />
              <meta name="twitter:data2" content={availability} />
            </>
          )}
        </>
      )}
      
      {/* Favicon and App Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />
      
      {/* Theme Colors */}
      <meta name="theme-color" content="#F9750B" />
      <meta name="msapplication-TileColor" content="#F9750B" />
      
      {/* Additional SEO */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData())
        }}
      />
    </Head>
  )
}

// Preset components for common pages
export function ProductSEO({
  product,
  seller,
  images = [],
  reviews = 0,
  rating = 0
}: {
  product: {
    title: string
    description: string
    price: number
    category: string
    tags?: string[]
    slug: string
  }
  seller: {
    name: string
    storeName: string
  }
  images?: string[]
  reviews?: number
  rating?: number
}) {
  const t = useTranslations('seo.product')
  
  return (
    <MetaTags
      title={product.title}
      description={`${product.description} | ${t('by_seller', { seller: seller.storeName })}`}
      keywords={[product.category, 'muebles', 'planos', 'DIY', ...(product.tags || [])]}
      image={images[0]}
      url={`/productos/${product.slug}`}
      type="product"
      price={{
        amount: product.price,
        currency: 'USD'
      }}
      availability="instock"
      brand={seller.storeName}
      category={product.category}
      structuredData={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description,
        image: images,
        brand: {
          '@type': 'Brand',
          name: seller.storeName
        },
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        aggregateRating: reviews > 0 ? {
          '@type': 'AggregateRating',
          ratingValue: rating,
          reviewCount: reviews
        } : undefined
      }}
    />
  )
}

export function CategorySEO({
  category,
  productCount = 0
}: {
  category: string
  productCount?: number
}) {
  const t = useTranslations('seo.category')
  
  return (
    <MetaTags
      title={t('title', { category })}
      description={t('description', { category, count: productCount })}
      keywords={[category, 'muebles', 'planos', 'DIY', 'carpintería']}
      url={`/productos?categoria=${category}`}
      type="website"
    />
  )
}

export function SellerSEO({
  seller,
  productCount = 0,
  rating = 0
}: {
  seller: {
    storeName: string
    description?: string
    slug: string
  }
  productCount?: number
  rating?: number
}) {
  const t = useTranslations('seo.seller')
  
  return (
    <MetaTags
      title={seller.storeName}
      description={seller.description || t('description', { 
        storeName: seller.storeName, 
        count: productCount 
      })}
      keywords={[seller.storeName, 'vendedor', 'tienda', 'muebles', 'planos']}
      url={`/vendedores/${seller.slug}`}
      type="profile"
      author={seller.storeName}
    />
  )
}

export function BlogSEO({
  article,
  author
}: {
  article: {
    title: string
    description: string
    slug: string
    publishedAt: string
    updatedAt?: string
    tags?: string[]
    image?: string
  }
  author: {
    name: string
  }
}) {
  return (
    <MetaTags
      title={article.title}
      description={article.description}
      keywords={['blog', 'muebles', 'DIY', ...(article.tags || [])]}
      image={article.image}
      url={`/blog/${article.slug}`}
      type="article"
      author={author.name}
      publishedTime={article.publishedAt}
      modifiedTime={article.updatedAt}
      tags={article.tags}
    />
  )
}

export default MetaTags