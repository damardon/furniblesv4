# 🛒 Módulo de Productos - Furnibles

## 🎯 Descripción
El módulo de productos es el core del marketplace Furnibles. Permite a los sellers crear, gestionar y vender planos digitales de muebles.

## 🚀 Funcionalidades Implementadas

### ✅ CRUD Completo
- Crear productos (sellers)
- Listar productos públicos (aprobados)
- Búsqueda y filtros avanzados
- Actualizar productos (owner/admin)
- Eliminar productos (con validaciones)

### ✅ Sistema de Estados
- **DRAFT**: Borrador, solo visible para el owner
- **PENDING**: En moderación, solo visible para admins
- **APPROVED**: Aprobado, visible públicamente
- **REJECTED**: Rechazado, con razón opcional
- **SUSPENDED**: Suspendido por infracciones

### ✅ Características Avanzadas
- Generación automática de slugs únicos
- Contador de visualizaciones
- Sistema de tags y categorización
- Validaciones exhaustivas
- Paginación optimizada
- Internacionalización completa

## 📋 Endpoints Disponibles

### Públicos (sin autenticación)
```
GET /api/products                    # Listar productos aprobados
GET /api/products/search             # Búsqueda avanzada
GET /api/products/:id                # Ver producto por ID
GET /api/products/slug/:slug         # Ver producto por slug
```

### Sellers (requiere autenticación)
```
POST /api/products                   # Crear producto
PATCH /api/products/:id              # Actualizar producto
DELETE /api/products/:id             # Eliminar producto
GET /api/products/my                 # Mis productos
POST /api/products/:id/publish       # Publicar borrador
GET /api/products/:id/stats          # Estadísticas
```

### Admins (requiere rol admin)
```
GET /api/products/pending            # Productos pendientes
POST /api/products/:id/approve       # Aprobar producto
POST /api/products/:id/reject        # Rechazar producto
```

## 🔍 Filtros y Búsqueda

### Parámetros de Filtro
- `q`: Búsqueda en título y descripción
- `category`: Filtrar por categoría
- `difficulty`: Filtrar por dificultad
- `priceMin/priceMax`: Rango de precios
- `tags`: Filtrar por tags
- `sortBy`: Ordenamiento (newest, popular, rating, price_asc, price_desc)
- `page/limit`: Paginación

### Ejemplo de Uso
```bash
GET /api/products?category=TABLES&difficulty=INTERMEDIATE&priceMin=5&priceMax=20&sortBy=popular&page=1&limit=12
```

## 🛡️ Validaciones

### Creación de Productos
- Título: 10-100 caracteres
- Descripción: 50-2000 caracteres
- Precio: $1-$100 (default $5)
- Máximo 50 productos por seller
- Máximo 10 tags por producto
- Al menos 1 imagen para publicar

### Reglas de Negocio
- Solo sellers pueden crear productos
- Solo el owner o admin pueden editar
- No se puede eliminar productos con órdenes
- Cambios críticos requieren re-moderación
- Slugs únicos autogenerados

## 🧪 Testing

### Ejecutar Tests
```bash
# Tests unitarios
npm run test:products

# Tests con coverage
npm run test:products:cov

# Tests en modo watch
npm run test:products:watch
```

### Seed de Datos
```bash
# Seed general (incluye usuarios)
npm run db:seed

# Seed solo productos
npm run db:seed:products
```

## 📊 Métricas y Analytics

### Estadísticas por Producto
- Visualizaciones
- Descargas
- Favoritos
- Rating promedio
- Número de reviews

### Próximas Implementaciones
- Analytics del seller
- Dashboard de admin
- Reportes de ventas
- Trending products

## 🔄 Estados de Workflow

```
DRAFT → [publish] → PENDING → [approve/reject] → APPROVED/REJECTED
                                    ↓
                              [edit critical] → PENDING
```

## 🌐 Internacionalización

### Idiomas Soportados
- Inglés (EN) - default
- Español (ES)

### Headers
```
Accept-Language: es
# o
?lang=es
```

## 🚧 Próximos Pasos

### Etapa 6: Gestión de Archivos (siguiente)
- Upload de PDFs y imágenes
- Validación de archivos
- Compresión y optimización
- Storage seguro

### Integración con Otros Módulos
- Sistema de órdenes (Etapa 7)
- Sistema de pagos (Etapa 8)
- Reviews y ratings (Etapa 10)
- Notificaciones (Etapa 11)

---

## 🎉 Estado Actual: ✅ COMPLETADO

El módulo de productos está **100% funcional** y listo para integrarse con los siguientes módulos del roadmap.

**Tiempo de desarrollo**: 3 semanas ⏱️
**Endpoints implementados**: 12/12 ✅
**Tests**: Unitarios e integración ✅
**Documentación**: Completa ✅