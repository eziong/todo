---
name: rbac-patterns
description: "Role-Based Access Control guard patterns: dual-layer RBAC (System + Trip), TripRoleGuard, RequireTripRole decorator, permission matrix, frontend UI permission pattern. Use when implementing access control."
user-invocable: false
---

## Dual-Layer RBAC Guard Pattern

### Two Permission Layers

| Layer | Guard | Checks | Purpose |
|-------|-------|--------|---------|
| System | `JwtAuthGuard` → `AdminGuard` | `users.is_admin` | Admin vs regular user |
| Trip | `JwtAuthGuard` → `TripRoleGuard` | `trip_members.role` | owner / editor / viewer |

### Single Source of Truth
- `trip_members` table is the **only** source for trip permissions
- `trips.user_id` is for creator tracking only — never use for access control
- Trip creator is auto-registered as `owner` in `trip_members` on creation

### Guard Combination Recipes

```typescript
// 1. Auth only (logged-in user, no trip context)
@UseGuards(JwtAuthGuard)

// 2. Admin only
@UseGuards(JwtAuthGuard, AdminGuard)

// 3. Trip member (read)
@UseGuards(TripRoleGuard)        // or class-level with JwtAuthGuard
@RequireTripRole('viewer')

// 4. Trip member (write)
@UseGuards(TripRoleGuard)
@RequireTripRole('editor')

// 5. Trip owner only
@UseGuards(TripRoleGuard)
@RequireTripRole('owner')
```

### Controller Patterns

**All endpoints need trip access** → class-level guard:
```typescript
@UseGuards(JwtAuthGuard, TripRoleGuard)
@Controller('trips/:tripId/schedules')
export class SchedulesController {
  @Get()
  @RequireTripRole('viewer')
  findAll() {}

  @Post()
  @RequireTripRole('editor')
  create() {}
}
```

**Mixed endpoints** (some with tripId, some without) → per-method guard:
```typescript
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  @Get()               // No TripRoleGuard — user's own trip list
  findAll() {}

  @Get(':tripId')
  @UseGuards(TripRoleGuard)
  @RequireTripRole('viewer')
  findOne() {}
}
```

### Role Hierarchy
`owner` (3) > `editor` (2) > `viewer` (1)

`@RequireTripRole('viewer')` allows viewer, editor, AND owner.

### tripId Extraction
TripRoleGuard extracts tripId from: `req.params.tripId || req.body.tripId`
- If no tripId found → guard passes (skips check)
- Use URL params for standard CRUD; body for create-type endpoints

### Key Files
- Guard: `server/src/common/guards/trip-role.guard.ts`
- Decorators: `server/src/common/decorators/trip-role.decorator.ts`
- Service: `server/src/common/services/trip-access.service.ts`
- Module: `server/src/common/services/trip-access.module.ts` (@Global)

### Adding a New Trip-Scoped Resource
1. Controller: `@UseGuards(JwtAuthGuard, TripRoleGuard)` at class level
2. Add `@RequireTripRole('viewer'|'editor'|'owner')` per method
3. Service: NO access checks needed — Guard handles it
4. Ensure route has `:tripId` param or body contains `tripId`


## Frontend UI Permission Pattern

서버 가드와 함께 프론트엔드에서 역할 기반 UI 분기를 처리하는 패턴.

### Permission Matrix

| Permission | owner | editor | viewer |
|-----------|-------|--------|--------|
| editTrip | O | X | X |
| editSchedule | O | O | X |
| editReservation | O | O | X |
| editChecklist | O | O | X |
| editJournal | O | O | X |
| inviteMembers | O | O | X |
| manageMembers | O | X | X |
| deleteTrip | O | X | X |

### UI에서의 적용 패턴

```tsx
// Container: role 체크 → boolean props
const canEditContent = canEdit(myRole);   // owner | editor
const canManageTrip = canManage(myRole);  // owner only

// Presenter: boolean으로 UI 분기
<FloatingActionButton visible={canEditContent} onPress={onAdd} />
<HeaderMenuSheet options={canManageTrip ? allOptions : viewerOptions} />
```

### 핵심 원칙
- **서버 검증 의존**: UI는 버튼 표시/숨기기만, 실제 권한은 서버가 검증
- **Presenter에 role 전달 금지**: Container에서 boolean으로 변환 후 전달
- `hasPermission(role, 'editTrip')` 유틸 함수로 체크 — 하드코딩 `role === 'owner'` 금지
