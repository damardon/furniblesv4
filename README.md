# 🏠 Furnibles - Marketplace de Planos de Muebles

Marketplace C2C para la compra y venta de planos digitales de muebles con enfoque en carpintería DIY.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeScript + Prisma
- **Base de Datos**: PostgreSQL + Redis
- **Pagos**: Stripe
- **Autenticación**: JWT + NextAuth.js
- **Real-time**: Socket.IO
- **Testing**: Jest + Cypress

## 📁 Estructura del Proyecto

```
furnibles/
├── frontend/          # Next.js application
├── backend/           # NestJS API
├── tests/            # Testing files
├── docs/             # Documentation
├── scripts/          # Utility scripts
└── docker-compose.yml # Development environment
```

## 🛠 Setup Inicial

### Prerrequisitos

- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd furnibles
   ```

2. **Instalar dependencias**
   ```bash
   npm run install:all
   ```

3. **Configurar variables de entorno**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.local.example frontend/.env.local
   ```

4. **Configurar base de datos**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Iniciar desarrollo**
   ```bash
   npm run dev
   ```

## 📋 Comandos Disponibles

### Desarrollo
- `npm run dev` - Inicia frontend y backend
- `npm run dev:frontend` - Solo frontend
- `npm run dev:backend` - Solo backend

### Base de Datos
- `npm run db:generate` - Genera cliente Prisma
- `npm run db:push` - Aplica cambios al schema
- `npm run db:migrate` - Crea nueva migración
- `npm run db:seed` - Pobla la base de datos
- `npm run db:studio` - Abre Prisma Studio
- `npm run db:reset` - Resetea la base de datos

### Testing
- `npm run test` - Ejecuta todos los tests
- `npm run test:backend` - Tests del backend
- `npm run test:frontend` - Tests del frontend
- `npm run test:e2e` - Tests end-to-end

### Build y Deploy
- `npm run build` - Build para producción
- `npm run lint` - Linting del código
- `npm run format` - Formatear código
- `npm run type-check` - Verificación de tipos

## 🏗 Arquitectura

### Frontend (Next.js 14)
- **App Router** para navegación
- **TypeScript** para type safety
- **Tailwind CSS + shadcn/ui** para estilos
- **React Hook Form + Zod** para formularios
- **NextAuth.js** para autenticación
- **Stripe** para pagos

### Backend (NestJS)
- **Modular architecture** con feature modules
- **Prisma ORM** para base de datos
- **JWT authentication** con Passport
- **Socket.IO** para real-time features
- **Class Validator** para validaciones
- **Stripe webhooks** para pagos

### Base de Datos
- **PostgreSQL** como base principal
- **Redis** para cache y sesiones
- **Prisma** para migrations y queries

## 🔐 Variables de Entorno

### Backend (.env)
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/furnibles"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key"
STRIPE_SECRET_KEY="sk_test_..."
EMAIL_API_KEY="SG.abc123..."
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🧪 Testing

- **Unit Tests**: Jest para lógica de negocio
- **Integration Tests**: Supertest para APIs
- **E2E Tests**: Cypress para flujos completos
- **Coverage**: >80% requerido

## 📚 Documentación

- [Plan Maestro](docs/PLAN_MAESTRO.md)
- [Especificaciones Técnicas](docs/TECHNICAL_SPECS.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-feature`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva feature'`)
4. Push a la rama (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte técnico, abrir un issue en GitHub o contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ para la comunidad DIY de carpintería**