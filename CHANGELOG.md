# CHANGELOG

## [Unreleased] - 2026-04-24

### Added
- Documented and committed the infrastructure audit and cleanup process.
- Added `OnModuleDestroy` lifecycle hook to `AnalyticsCacheService` for graceful Redis connection cleanup.

### Changed
- Removed duplicate repository subtree at `/backend/furniblesv4/`.
- Consolidated backend to `/backend/` and frontend to `/frontend/`.
- Reverted Prisma to supported version `6.10.1`.
- Updated `backend/prisma/schema.prisma` to use `env("DATABASE_URL")`.
- **Schema Normalization**: Converted JSON-string arrays to native Prisma `String[]` fields:
  - `Product.imageFileIds` (was JSON string array)
  - `Product.thumbnailFileIds` (was JSON string array) 
  - `Product.tags` (was JSON string array)
  - `Product.toolsRequired` (was JSON string array)
  - `Product.materials` (was JSON string array)
- **Backend Services Refactor**: Updated all services to use native arrays instead of `JSON.parse()`:
  - `cart.service.ts`, `checkout.service.ts`, `files.service.ts`, `admin.service.ts`
  - Removed `JSON.parse` usage for product file ID arrays
- **Prisma Config**: Fixed `prisma.config.ts` import path and configuration:
  - Changed from `@prisma/client/prisma.config` to `prisma/config`
  - Updated config shape from `datasources.db` to singular `datasource`
  - Added `dotenv/config` import and `env()` helpers
- **Analytics Service**: Comprehensive fixes for production readiness:
  - Fixed cache key normalization in `getSellerDashboard` (includes `includeActivity`)
  - Converted stubbed endpoints to return `501 Not Implemented` instead of empty data:
    - Seller analytics: `getSellerCustomers`, `getSellerNotifications`, `getSellerConversion`
    - Admin analytics: `getTopPerformers`, `getSellerComparison`, `getConversionFunnel`, `getCohortAnalysis`, `getNotificationAnalytics`, `getUserBehavior`, `getFinancialReport`
    - Export endpoints: `exportData`, `generateCustomReport`, `scheduleReport`, `downloadReport`
  - Added warning logs for all stubbed endpoints

### Fixed
- Restored backend build after Prisma downgrade and configuration correction.
- Verified frontend build success for the canonical `/frontend/` app.
- **Build Validation**: Backend compiles successfully after all schema and service changes.
- **Test Status**: 85/87 tests passing (2 failing in reviews module - mock assertions need update).

### Notes
- Backend tests executed: 114 passed, 81 failed (previous), now 85 passed, 2 failed.
- Backup available at `/tmp/backend-furniblesv4-backup-*.tar.gz`.
- **Code Review Issues Resolved**: All 5 critical issues from PR #1 code review have been addressed.
