# CHANGELOG

## [Unreleased] - 2026-04-24

### Added
- Documented and committed the infrastructure audit and cleanup process.

### Changed
- Removed duplicate repository subtree at `/backend/furniblesv4/`.
- Consolidated backend to `/backend/` and frontend to `/frontend/`.
- Reverted Prisma to supported version `6.10.1`.
- Updated `backend/prisma/schema.prisma` to use `env("DATABASE_URL")`.
- Fixed `backend/prisma/prisma.config.ts` to use the correct Prisma 6.x config shape and dotenv loading.
- Normalized analytics cache key generation for seller dashboard requests.
- Added root `tsconfig.json` for monorepo project references and editor workspace resolution.
- **Removed `get-docker.sh`**: Obsolete generic Docker installation script; users can refer to official Docker documentation or use their preferred installation method.

### Fixed
- Restored backend build after Prisma downgrade and configuration correction.
- Converted stubbed analytics endpoints to explicit `501 Not Implemented` responses instead of empty success payloads.
- Added graceful Redis shutdown in `AnalyticsCacheService`.
- Completed admin analytics fee breakdown aggregation and pending payout reporting.
- Verified backend stage tests: 87 passed, 0 failed for the audited modules.
- Verified frontend production build success.
- **Critical**: Fixed revenue calculation in `getSellerRecentOrders` query: removed `take: 1` limitation on seller items to correctly sum all item prices (was undercounting for multi-item orders); updated product title logic to show 'Multiple Items' when applicable.
- **Critical**: Fixed Redis performance issue in `AnalyticsCacheService.invalidatePattern()`: replaced blocking `KEYS` command with incremental `SCAN` iteration using `scanStream` to prevent server stalls; switched to `UNLINK` for non-blocking memory cleanup on large key batches.

### Notes
- Backend tests executed: 87 passed for stages 1-9 with the current audit changes.
- Frontend build validated successfully after cleanup.
- Repository-level type check passed: `frontend` `tsc --noEmit` and `backend` build both succeed.
- No package-level `tsconfig.json` compile errors were found in current `backend/tsconfig.json` or `frontend/tsconfig.json`.
- Added root `tsconfig.json` for consistent monorepo editor support and workspace type-checking.
- Existing PR open for this branch: https://github.com/damardon/furniblesv4/pull/1
- Implemented admin analytics country aggregation from `order.billingData.country` and calculated top seller revenue from completed order items.
- Optimized `getMonthlyGrowth` method with 12-month limit and improved edge case handling for zero revenue periods.
- Backup available at `/tmp/backend-furniblesv4-backup-*.tar.gz`.

## Próximos Pasos - Auditoría de Producción

### 1. Evaluación de Artefactos de Build
- **Decidir sobre `backend/dist/main.js`**: ¿mantener versionado o excluir como artefacto de compilación?
- **Revisar archivos `.tsbuildinfo`**: evaluar si deben estar en `.gitignore`

### 2. Auditoría de Campos JSON/Metadata
- **Verificar consistencia**: `feeBreakdown`, `metadata`, `specifications` entre Prisma schema y DTOs
- **Validar serialización**: asegurar que los campos JSON se manejen correctamente en servicios
- **Documentar contratos**: crear documentación clara de estructuras JSON esperadas

### 3. TODOs Críticos Pendientes
- **Auth**: implementar "forgot password" en login modal
- **Payments**: integrar reembolso real con Stripe, implementar configuración de preferencias
- **Webhooks**: completar verificación PayPal, implementar `processSplitPayments`
- **Files**: agregar verificación de permisos en file service
- **Reports**: implementar generación de reportes en cron service

### 4. Validación Final
- **Tests completos**: ejecutar suite completa de tests end-to-end
- **Performance**: revisar queries N+1 y optimizaciones de base de datos
- **Security**: auditoría final de endpoints y validaciones
- **Documentation**: actualizar README y docs de API
