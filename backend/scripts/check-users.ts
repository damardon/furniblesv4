// scripts/check-users.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n')
    
    // Obtener todos los usuarios con sus perfiles relacionados
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        emailVerifiedAt: true,
        status: true,
        isActive: true,
        createdAt: true,
        // Incluir perfiles relacionados
        sellerProfile: {
          select: {
            storeName: true,
            slug: true,
            rating: true,
            totalSales: true,
            totalReviews: true,
            isVerified: true,
            website: true,
            phone: true,
          }
        },
        buyerProfile: {
          select: {
            totalOrders: true,
            totalSpent: true,
            totalReviews: true,
            phone: true,
            preferences: true,
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    if (users.length === 0) {
      console.log('❌ No se encontraron usuarios en la base de datos')
      console.log('💡 Ejecuta el script de creación: npx ts-node scripts/create-test-users.ts')
      return
    }

    console.log(`✅ Encontrados ${users.length} usuarios:\n`)
    
    // Contadores por rol
    let adminCount = 0
    let sellerCount = 0 
    let buyerCount = 0

    users.forEach((user, index) => {
      console.log(`${index + 1}. 👤 ${user.firstName} ${user.lastName}`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   🏷️  Role: ${user.role}`)
      console.log(`   ✅ Email verificado: ${user.emailVerified ? 'Sí' : 'No'}`)
      console.log(`   📅 Verificado el: ${user.emailVerifiedAt ? user.emailVerifiedAt.toLocaleDateString() : 'N/A'}`)
      console.log(`   🟢 Status: ${user.status} (${user.isActive ? 'Activo' : 'Inactivo'})`)
      console.log(`   📅 Creado: ${user.createdAt.toLocaleDateString()}`)

      // Información específica por rol
      if (user.role === 'SELLER' && user.sellerProfile) {
        console.log(`   🏪 Tienda: ${user.sellerProfile.storeName}`)
        console.log(`   🔗 Slug: /${user.sellerProfile.slug}`)
        console.log(`   ⭐ Rating: ${user.sellerProfile.rating} (${user.sellerProfile.totalReviews} reseñas)`)
        console.log(`   💰 Ventas: ${user.sellerProfile.totalSales}`)
        console.log(`   ✅ Verificado: ${user.sellerProfile.isVerified ? 'Sí' : 'No'}`)
        if (user.sellerProfile.website) {
          console.log(`   🌐 Website: ${user.sellerProfile.website}`)
        }
        if (user.sellerProfile.phone) {
          console.log(`   📞 Teléfono: ${user.sellerProfile.phone}`)
        }
        sellerCount++
      } else if (user.role === 'BUYER' && user.buyerProfile) {
        console.log(`   🛒 Órdenes: ${user.buyerProfile.totalOrders}`)
        console.log(`   💵 Total gastado: $${user.buyerProfile.totalSpent}`)
        console.log(`   ⭐ Reseñas escritas: ${user.buyerProfile.totalReviews}`)
        if (user.buyerProfile.phone) {
          console.log(`   📞 Teléfono: ${user.buyerProfile.phone}`)
        }
        if (user.buyerProfile.preferences) {
          console.log(`   ⚙️  Preferencias: ${JSON.stringify(user.buyerProfile.preferences, null, 2)}`)
        }
        buyerCount++
      } else if (user.role === 'ADMIN') {
        adminCount++
      }

      console.log('   ' + '-'.repeat(50))
    })

    // Resumen
    console.log(`\n📊 RESUMEN POR ROLES:`)
    console.log(`👑 Administradores: ${adminCount}`)
    console.log(`🏪 Vendedores: ${sellerCount}`)
    console.log(`🛒 Compradores: ${buyerCount}`)
    console.log(`📈 Total usuarios: ${users.length}`)

    // Verificar usuarios de prueba específicos
    console.log(`\n🧪 VERIFICACIÓN DE USUARIOS DE PRUEBA:`)
    const testEmails = [
      'admin@test.com',
      'juan@muebles.com', 
      'maria@artesanias.com',
      'cliente@gmail.com',
      'buyer@test.com'
    ]

    const foundTestUsers = users.filter(user => testEmails.includes(user.email))
    console.log(`✅ Usuarios de prueba encontrados: ${foundTestUsers.length}/${testEmails.length}`)
    
    const missingUsers = testEmails.filter(email => 
      !users.some(user => user.email === email)
    )
    
    if (missingUsers.length > 0) {
      console.log(`❌ Usuarios faltantes: ${missingUsers.join(', ')}`)
      console.log(`💡 Ejecuta: npx ts-node scripts/create-test-users.ts`)
    }

    // Verificar preferencias de notificación
    console.log(`\n🔔 VERIFICANDO PREFERENCIAS DE NOTIFICACIÓN:`)
    const preferences = await prisma.notificationPreference.findMany({
      where: {
        userId: { in: users.map(u => u.id) }
      },
      select: {
        userId: true,
        emailEnabled: true,
        digestFrequency: true,
        timezone: true,
        user: {
          select: {
            email: true,
            firstName: true
          }
        }
      }
    })

    console.log(`✅ Preferencias configuradas: ${preferences.length}/${users.length}`)
    
    if (preferences.length < users.length) {
      console.log(`⚠️  Algunos usuarios no tienen preferencias de notificación configuradas`)
    }

    // Mostrar estadísticas de la base de datos
    console.log(`\n📈 ESTADÍSTICAS ADICIONALES:`)
    
    const productsCount = await prisma.product.count()
    console.log(`📦 Productos: ${productsCount}`)
    
    const ordersCount = await prisma.order.count()
    console.log(`🛍️  Órdenes: ${ordersCount}`)
    
    const reviewsCount = await prisma.review.count()
    console.log(`⭐ Reseñas: ${reviewsCount}`)

    console.log(`\n🎯 INSTRUCCIONES PARA PROBAR LOGIN:`)
    console.log(`1. Ve a tu página de login`)
    console.log(`2. Usa cualquiera de estos emails:`)
    foundTestUsers.forEach(user => {
      const passwords = {
        'admin@test.com': 'admin123',
        'juan@muebles.com': 'seller123', 
        'maria@artesanias.com': 'maria456',
        'cliente@gmail.com': 'buyer123',
        'buyer@test.com': 'test123'
      }
      console.log(`   • ${user.email} / ${passwords[user.email as keyof typeof passwords] || 'password'} (${user.role})`)
    })

  } catch (error) {
    console.error('❌ Error al consultar usuarios:', error)
    
    if (error instanceof Error) {
      console.error('Detalles:', error.message)
      
      // Sugerencias según el tipo de error
      if (error.message.includes('does not exist')) {
        console.log('\n💡 Parece que la base de datos no está configurada correctamente.')
        console.log('   Verifica que hayas ejecutado las migraciones: npx prisma migrate dev')
      } else if (error.message.includes('connect')) {
        console.log('\n💡 Problema de conexión a la base de datos.')
        console.log('   Verifica tu DATABASE_URL en el archivo .env')
      }
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la verificación
checkUsers()