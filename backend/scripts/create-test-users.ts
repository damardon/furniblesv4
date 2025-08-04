// scripts/create-test-users.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUsers() {
  console.log('🚀 Creando usuarios de prueba...\n')

  try {
    // Limpiar usuarios existentes de prueba y sus perfiles
    console.log('🗑️  Limpiando usuarios de prueba existentes...')
    
    // Primero eliminar perfiles de sellers (por las relaciones)
    await prisma.sellerProfile.deleteMany({
      where: {
        slug: {
          in: ['muebles-juan', 'artesanias-maria']
        }
      }
    })
    
    // Luego eliminar perfiles de buyers
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'admin@test.com',
            'juan@muebles.com',
            'maria@artesanias.com',
            'cliente@gmail.com',
            'buyer@test.com'
          ]
        }
      },
      select: { id: true }
    })
    
    if (testUsers.length > 0) {
      const testUserIds = testUsers.map(u => u.id)
      
      // Eliminar buyer profiles
      await prisma.buyerProfile.deleteMany({
        where: {
          userId: { in: testUserIds }
        }
      })
      
      // Eliminar notification preferences
      await prisma.notificationPreference.deleteMany({
        where: {
          userId: { in: testUserIds }
        }
      })
    }
    
    // Finalmente eliminar usuarios
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'admin@test.com',
            'juan@muebles.com',
            'maria@artesanias.com',
            'cliente@gmail.com',
            'buyer@test.com'
          ]
        }
      }
    })
    
    console.log('✅ Limpieza completada')

    const saltRounds = 12
    
    // 1. ADMIN - Administrador principal
    console.log('👑 Creando usuario ADMIN...')
    const adminPassword = await bcrypt.hash('admin123', saltRounds)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: adminPassword,
        firstName: 'Carlos',
        lastName: 'Administrador',
        role: 'ADMIN',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
        isActive: true,
      }
    })
    console.log(`✅ Admin creado: ${admin.email}`)

    // 2. SELLER #1 - Juan Muebles
    console.log('🏪 Creando usuario SELLER #1...')
    const seller1Password = await bcrypt.hash('seller123', saltRounds)
    const seller1 = await prisma.user.create({
      data: {
        email: 'juan@muebles.com',
        password: seller1Password,
        firstName: 'Juan Carlos',
        lastName: 'Herrera',
        role: 'SELLER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
        isActive: true,
      }
    })

    // Crear perfil de seller
    const seller1Profile = await prisma.sellerProfile.create({
      data: {
        userId: seller1.id,
        storeName: 'Muebles Juan',
        slug: 'muebles-juan',
        description: 'Especialistas en muebles de madera maciza con más de 15 años de experiencia. Creamos piezas únicas y duraderas para tu hogar.',
        website: 'https://mueblesjuan.com',
        phone: '+56-9-1234-5678',
        isVerified: true,
        rating: 4.8,
        totalSales: 156,
        totalReviews: 42,
      }
    })
    console.log(`✅ Seller #1 creado: ${seller1.email} (${seller1Profile.storeName})`)

    // 3. SELLER #2 - María Artesanías
    console.log('🏪 Creando usuario SELLER #2...')
    const seller2Password = await bcrypt.hash('maria456', saltRounds)
    const seller2 = await prisma.user.create({
      data: {
        email: 'maria@artesanias.com',
        password: seller2Password,
        firstName: 'María Elena',
        lastName: 'González',
        role: 'SELLER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
        isActive: true,
      }
    })

    const seller2Profile = await prisma.sellerProfile.create({
      data: {
        userId: seller2.id,
        storeName: 'Artesanías María',
        slug: 'artesanias-maria',
        description: 'Creaciones artesanales únicas. Especializada en decoración rústica y muebles vintage con técnicas tradicionales.',
        website: 'https://artesaniasmaria.cl',
        phone: '+56-9-8765-4321',
        isVerified: true,
        rating: 4.6,
        totalSales: 89,
        totalReviews: 23,
      }
    })
    console.log(`✅ Seller #2 creado: ${seller2.email} (${seller2Profile.storeName})`)

    // 4. BUYER #1 - Cliente frecuente
    console.log('🛒 Creando usuario BUYER #1...')
    const buyer1Password = await bcrypt.hash('buyer123', saltRounds)
    const buyer1 = await prisma.user.create({
      data: {
        email: 'cliente@gmail.com',
        password: buyer1Password,
        firstName: 'Ana',
        lastName: 'Martínez',
        role: 'BUYER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
        isActive: true,
      }
    })

    // Crear perfil de buyer
    const buyer1Profile = await prisma.buyerProfile.create({
      data: {
        userId: buyer1.id,
        phone: '+56-9-5555-1111',
        totalOrders: 5,
        totalSpent: 450.50,
        totalReviews: 8,
        preferences: {
          categories: ['LIVING_DINING', 'BEDROOM'],
          priceRange: { min: 20, max: 200 },
          favoriteStyles: ['nordic', 'modern']
        }
      }
    })
    console.log(`✅ Buyer #1 creado: ${buyer1.email}`)

    // 5. BUYER #2 - Cliente nuevo
    console.log('🛒 Creando usuario BUYER #2...')
    const buyer2Password = await bcrypt.hash('test123', saltRounds)
    const buyer2 = await prisma.user.create({
      data: {
        email: 'buyer@test.com',
        password: buyer2Password,
        firstName: 'Pedro',
        lastName: 'Silva',
        role: 'BUYER',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
        isActive: true,
      }
    })

    // Crear perfil de buyer
    const buyer2Profile = await prisma.buyerProfile.create({
      data: {
        userId: buyer2.id,
        phone: '+56-9-5555-2222',
        totalOrders: 0,
        totalSpent: 0,
        totalReviews: 0,
        preferences: {
          categories: ['OUTDOOR', 'DECORATIVE'],
          notifications: true
        }
      }
    })
    console.log(`✅ Buyer #2 creado: ${buyer2.email}`)

    // Crear preferencias de notificación para todos los usuarios
    console.log('\n🔔 Creando preferencias de notificación...')
    const users = [admin, seller1, seller2, buyer1, buyer2]
    
    for (const user of users) {
      await prisma.notificationPreference.create({
        data: {
          userId: user.id,
          emailEnabled: true,
          webPushEnabled: true,
          inAppEnabled: true,
          orderNotifications: true,
          paymentNotifications: true,
          reviewNotifications: true,
          marketingEmails: false,
          systemNotifications: true,
          reviewReceived: true,
          reviewResponses: true,
          reviewHelpfulVotes: true,
          reviewMilestones: true,
          reviewReminders: true,
          digestFrequency: 'WEEKLY',
          digestDay: 1,
          digestTime: '09:00',
          timezone: 'America/Santiago'
        }
      })
    }
    console.log('✅ Preferencias de notificación creadas')

    console.log('\n🎉 ¡Usuarios de prueba creados exitosamente!')
    console.log('\n📋 CREDENCIALES DE ACCESO:')
    console.log('='.repeat(50))
    
    console.log('\n👑 ADMINISTRADOR:')
    console.log('   📧 Email: admin@test.com')
    console.log('   🔑 Password: admin123')
    console.log('   👤 Nombre: Carlos Administrador')
    
    console.log('\n🏪 VENDEDORES:')
    console.log('   📧 Email: juan@muebles.com')
    console.log('   🔑 Password: seller123')
    console.log('   👤 Nombre: Juan Carlos Herrera')
    console.log('   🏷️  Tienda: Muebles Juan')
    console.log('   ⭐ Rating: 4.8 (42 reseñas, 156 ventas)')
    console.log()
    console.log('   📧 Email: maria@artesanias.com')
    console.log('   🔑 Password: maria456')
    console.log('   👤 Nombre: María Elena González')
    console.log('   🏷️  Tienda: Artesanías María')
    console.log('   ⭐ Rating: 4.6 (23 reseñas, 89 ventas)')
    
    console.log('\n🛒 COMPRADORES:')
    console.log('   📧 Email: cliente@gmail.com')
    console.log('   🔑 Password: buyer123')
    console.log('   👤 Nombre: Ana Martínez (Cliente frecuente)')
    console.log('   📊 Historial: 5 órdenes, $450.50 gastados, 8 reseñas')
    console.log()
    console.log('   📧 Email: buyer@test.com')
    console.log('   🔑 Password: test123')
    console.log('   👤 Nombre: Pedro Silva (Cliente nuevo)')
    console.log('   📊 Historial: Sin compras previas')

    console.log('\n💡 INSTRUCCIONES:')
    console.log('1. Ve a tu página de login')
    console.log('2. Usa cualquiera de los emails y passwords de arriba')
    console.log('3. Los vendedores tendrán acceso a su dashboard')
    console.log('4. El admin tendrá acceso al panel de administrador')
    console.log('5. Los buyers pueden navegar y comprar productos')

    console.log('\n🌐 URLs sugeridas para probar:')
    console.log('   • Login: /login')
    console.log('   • Productos: /productos')
    console.log('   • Dashboard Admin: /admin')
    console.log('   • Dashboard Seller: /seller')
    console.log('   • Tienda Juan: /vendedores/muebles-juan')
    console.log('   • Tienda María: /vendedores/artesanias-maria')

  } catch (error) {
    console.error('❌ Error creando usuarios de prueba:', error)
    
    // Información de debug
    if (error instanceof Error) {
      console.error('Detalles del error:', error.message)
      if (error.message.includes('Unique constraint')) {
        console.log('\n💡 Parece que algunos usuarios ya existen.')
        console.log('   Intenta ejecutar el script de nuevo para limpiar y recrear.')
      }
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el script
createTestUsers()