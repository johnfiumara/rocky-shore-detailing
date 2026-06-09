# Security Implementation

## CSRF Protection

### How It Works
- All admin server actions are protected via **SameSite=Lax cookies**
- Next.js automatically validates action origin on every invocation
- The `"use server"` directive prevents cross-origin calls
- No additional CSRF tokens are needed (Next.js 13+ handles this)

### High-Risk Operations Protected
- ✅ `deleteTestimonial()` - Removes testimonials from database
- ✅ `updateBookingStatus()` - Changes booking status (critical state change)
- ✅ `deleteExpense()` - Removes expense records
- ✅ All other admin mutations (create, update operations)

### Implementation Details
- **Cookie Policy**: `SameSite=Lax` (configured in `next.config.ts`)
  - Lax SameSite allows cookies on top-level navigation but blocks them on cross-site requests
  - This prevents attackers from making state-changing requests on behalf of users
- **Origin Validation**: Next.js validates that Server Actions are called from the same origin
- **Authentication Check**: All mutations require `requireRole()` which verifies admin/editor status

### What's NOT Protected by This
- Public/unauthenticated endpoints still need explicit CSRF protection
- External API calls should validate origin headers
- Webhooks should use signature verification (HMAC)

## Logging

### Structure
All logs use a centralized `logger` utility (`src/lib/logger.ts`) with environment-aware behavior:

- **Server-side**: Always logs errors with full context and timestamp
- **Client-side (development)**: Logs to console for debugging
- **Client-side (production)**: Suppresses all logs to prevent leaking sensitive info

### Usage Example
```typescript
import { logger } from "@/lib/logger";

// Error logging (context, message, optional error)
logger.error("context-name", "What failed", error);

// Warning logging
logger.warn("context-name", "Something to note");

// Info logging (server-side only)
logger.info("context-name", "Informational message");
```

### Locations Using Logger
- `src/components/media-picker.tsx` - File upload errors
- `src/app/api/booking/route.ts` - Booking submission errors
- `src/app/(admin)/admin/bookings/[id]/booking-actions.tsx` - UI state save errors
- `src/app/(admin)/admin/actions.ts` - Server action errors

## Next Steps

- Monitor server logs for CSRF attempts (should be zero)
- Audit webhook implementations to ensure signature verification
- Periodically review admin action logs for suspicious patterns
