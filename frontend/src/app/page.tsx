import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🏠 Furnibles
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/products" className="text-gray-600 hover:text-gray-900">
                Explorar
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Iniciar Sesión
              </Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Registrarse
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Marketplace de Planos de{' '}
            <span className="text-blue-600">Muebles DIY</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre miles de planos digitales para crear tus propios muebles. 
            Desde mesas hasta estanterías, encuentra el proyecto perfecto para tu hogar.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link 
              href="/products"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Explorar Planos
            </Link>
            <Link 
              href="/seller/dashboard"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Vender mis Planos
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📐</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Planos Detallados
            </h3>
            <p className="text-gray-600">
              Todos los planos incluyen medidas precisas, lista de materiales y instrucciones paso a paso.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Descarga Instantánea
            </h3>
            <p className="text-gray-600">
              Compra y descarga tus planos al instante. Sin esperas, sin complicaciones.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Calidad Garantizada
            </h3>
            <p className="text-gray-600">
              Todos los planos son revisados por expertos antes de ser publicados en la plataforma.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gray-900 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para crear tu próximo proyecto?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Únete a miles de carpinteros y entusiastas del DIY que ya están creando 
            muebles increíbles con nuestros planos.
          </p>
          <Link 
            href="/register"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Comenzar Ahora
          </Link>
        </div>
      </main>
    </div>
  )
}
