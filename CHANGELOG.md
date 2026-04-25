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

### Fixed
- Restored backend build after Prisma downgrade and configuration correction.
- Converted stubbed analytics endpoints to explicit `501 Not Implemented` responses instead of empty success payloads.
- Added graceful Redis shutdown in `AnalyticsCacheService`.
- Completed admin analytics fee breakdown aggregation and pending payout reporting.
- Verified backend stage tests: 87 passed, 0 failed for the audited modules.
- Verified frontend production build success.

### Notes
- Backend tests executed: 87 passed for stages 1-9 with the current audit changes.
- Frontend build validated successfully after cleanup.
- Backup available at `/tmp/backend-furniblesv4-backup-*.tar.gz`.
