import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

interface SellerPageProps {
  params: Promise<{ slug: string }>;
}

interface Seller {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  description: string;
  rating: number;
  totalSales: number;
  totalReviews: number;
  isVerified: boolean;
  avatar?: string;
  banner?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isActive: boolean;
    createdAt: string;
  };
  stats: {
    totalProducts: number;
    totalSales: number;
    avgRating: number;
    totalReviews: number;
  };
}

interface Product {
  id: string;
  title: string;
  description: string;
  slug: string;
  price: number;
  category: string;
  difficulty: string;
  status: string;
  imageFileIds: string;
  thumbnailFileIds: string;
  tags: string;
  estimatedTime: string;
  dimensions: string;
  rating: number;
  reviewCount: number;
  viewCount: number;
  downloadCount: number;
  favoriteCount: number;
  featured: boolean;
  createdAt: string;
  publishedAt: string;
  seller: {
    id: string;
    avatar?: string;
  };
}

interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ✅ Función mejorada para obtener datos del vendedor
async function getSellerBySlug(slug: string): Promise<Seller | null> {
  try {
    console.log('🔍 [FRONTEND] Fetching seller:', slug);
    console.log('🔍 [FRONTEND] API URL:', process.env.NEXT_PUBLIC_API_URL);
    
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sellers/${slug}`;
    console.log('🔍 [FRONTEND] Full URL:', url);
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 [FRONTEND] Response status:', response.status);
    console.log('🔍 [FRONTEND] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      if (response.status === 404) {
        console.log('🔍 [FRONTEND] Seller not found (404)');
        return null;
      }
      
      // Intentar leer el texto de la respuesta para debugging
      const responseText = await response.text();
      console.error('❌ [FRONTEND] Error response text:', responseText.substring(0, 500));
      
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [FRONTEND] Seller data received:', data);
    return data;
  } catch (error) {
    console.error('❌ [FRONTEND] Error fetching seller:', error);
    
    // Si el error es de parsing JSON, log adicional
    if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
      console.error('❌ [FRONTEND] Received HTML instead of JSON - check API URL and endpoint');
    }
    
    return null;
  }
}

// ✅ Función mejorada para obtener productos del vendedor
async function getSellerProducts(slug: string, page = 1, limit = 12): Promise<ProductsResponse | null> {
  try {
    console.log('🔍 [FRONTEND] Fetching seller products:', slug);
    
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/sellers/${slug}/products?page=${page}&limit=${limit}`;
    console.log('🔍 [FRONTEND] Products URL:', url);
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 [FRONTEND] Products response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('❌ [FRONTEND] Products error response:', responseText.substring(0, 500));
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [FRONTEND] Products data received:', data);
    return data;
  } catch (error) {
    console.error('❌ [FRONTEND] Error fetching seller products:', error);
    
    if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
      console.error('❌ [FRONTEND] Received HTML instead of JSON - check API URL and endpoint');
    }
    
    return null;
  }
}

// Generar metadata dinámica
export async function generateMetadata({ params }: SellerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const seller = await getSellerBySlug(slug);
  
  return {
    title: seller ? `${seller.storeName} | Furnibles` : `Vendedor: ${slug} | Furnibles`,
    description: seller 
      ? seller.description || `Tienda de ${seller.storeName} en Furnibles`
      : `Perfil del vendedor ${slug} en Furnibles`,
  };
}

// Componente para mostrar productos
function ProductCard({ product }: { product: Product }) {
  const images = product.imageFileIds ? JSON.parse(product.imageFileIds) : [];
  const thumbnails = product.thumbnailFileIds ? JSON.parse(product.thumbnailFileIds) : [];
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/productos/${product.slug}`}>
        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
          {thumbnails.length > 0 ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/thumbnail/${thumbnails[0]}`}
              alt={product.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center bg-gray-100">
              <span className="text-gray-400">Sin imagen</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-2xl font-bold text-green-600">${product.price}</span>
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-gray-400">({product.reviewCount})</span>
            </div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-500">
            <span>{product.category}</span>
            <span>{product.difficulty}</span>
          </div>
          
          {product.featured && (
            <div className="mt-2">
              <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                Destacado
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

export default async function SellerPage({ params }: SellerPageProps) {
  const { slug } = await params;

  // Obtener datos del vendedor y sus productos
  const [seller, productsData] = await Promise.all([
    getSellerBySlug(slug),
    getSellerProducts(slug),
  ]);

  // Si no existe el vendedor, mostrar 404
  if (!seller) {
    notFound();
  }

  const products = productsData?.data || [];
  const totalProducts = productsData?.total || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              {seller.user.avatar ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/api/files/image/${seller.user.avatar}`}
                  alt={seller.storeName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-white">
                  {seller.storeName.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-bold">{seller.storeName}</h1>
                {seller.isVerified && (
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    ✓ Verificado
                  </span>
                )}
              </div>
              <p className="text-gray-600">@{seller.slug}</p>
              <p className="text-sm text-gray-500">
                Miembro desde {new Date(seller.user.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{seller.stats.totalProducts}</div>
              <div className="text-sm text-gray-600">Productos</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{seller.stats.avgRating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Calificación</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{seller.stats.totalReviews}</div>
              <div className="text-sm text-gray-600">Reseñas</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{seller.stats.totalSales}</div>
              <div className="text-sm text-gray-600">Ventas</div>
            </div>
          </div>

          {seller.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Acerca de la tienda</h2>
              <p className="text-gray-600">{seller.description}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">
              Productos ({totalProducts})
            </h2>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">No hay productos disponibles</h3>
              <p>Este vendedor aún no tiene productos publicados o todos están pendientes de aprobación.</p>
            </div>
          )}

          {productsData && productsData.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="text-sm text-gray-500">
                Mostrando {products.length} de {totalProducts} productos
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}