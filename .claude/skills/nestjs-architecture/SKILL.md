---
name: nestjs-architecture
description: NestJS (@nestjs/core) backend architecture for projects using NestJS with Prisma ORM. Use when creating NestJS modules, controllers, services, DTOs with class-validator, guards, interceptors, or implementing database mapping layers in a NestJS application.
user-invocable: false
---

# NestJS Architecture Patterns

> **원칙** (Module→Controller→Service→DTO, 3-layer DB mapping, 금지사항)은
> `server-conventions.md` 규칙 참조. 이 스킬은 코드 템플릿에 집중.

## Module Structure

Every feature follows: Module → Controller → Service → DTOs

```
src/modules/items/
├── items.module.ts          # Module declaration
├── items.controller.ts      # HTTP endpoints
├── items.service.ts         # Business logic
├── dto/
│   ├── create-item.dto.ts   # Input validation
│   ├── update-item.dto.ts
│   └── item-response.dto.ts # Output shape
└── entities/                # Optional: TypeORM/Prisma models
```

## Module Registration

```tsx
// items.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],  // Only if other modules need it
})
export class ItemsModule {}
```

## Controller Pattern

```tsx
@Controller('trips/:tripId/items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @ApiOperation({ summary: 'List items for a trip' })
  async findAll(
    @Param('tripId') tripId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.itemsService.verifyAccess(tripId, user.id);
    return this.itemsService.findAll(tripId);
  }

  @Post()
  @ApiOperation({ summary: 'Create item' })
  async create(
    @Param('tripId') tripId: string,
    @Body() dto: CreateItemDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.itemsService.verifyEditAccess(tripId, user.id);
    return this.itemsService.create(tripId, user.id, dto);
  }

  @Patch(':id')
  async update(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.itemsService.verifyEditAccess(tripId, user.id);
    return this.itemsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.itemsService.verifyEditAccess(tripId, user.id);
    return this.itemsService.remove(id);
  }
}
```

## DTO Validation

```tsx
// dto/create-item.dto.ts
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ description: 'Item title' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  @IsEnum(['low', 'medium', 'high'])
  priority: string;
}
```

## Service Layer with DB Mapping

Three-layer mapping: DB (snake_case) → Domain (camelCase) → Response (DTO)

```tsx
@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  // DB → Domain mapper
  private mapDbItem(row: any): Item {
    return {
      id: row.id,
      tripId: row.trip_id,
      userId: row.user_id,
      title: row.title,
      createdAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString(),
    };
  }

  // Domain → Response mapper
  private mapToResponse(item: Item): ItemResponseDto {
    return {
      ...item,
      // Add computed/formatted fields for API consumers
    };
  }

  async findAll(tripId: string): Promise<ItemResponseDto[]> {
    const rows = await this.prisma.item.findMany({
      where: { trip_id: tripId },
      orderBy: { sort_order: 'asc' },
    });
    return rows.map((r) => this.mapToResponse(this.mapDbItem(r)));
  }

  async create(tripId: string, userId: string, dto: CreateItemDto) {
    const row = await this.prisma.item.create({
      data: {
        trip_id: tripId,
        user_id: userId,
        title: dto.title,
        description: dto.description,
      },
    });
    return this.mapToResponse(this.mapDbItem(row));
  }

  // Access control
  async verifyAccess(tripId: string, userId: string): Promise<void> {
    const member = await this.prisma.tripMember.findFirst({
      where: { trip_id: tripId, user_id: userId },
    });
    if (!member) throw new ForbiddenException('Not a trip member');
  }

  async verifyEditAccess(tripId: string, userId: string): Promise<void> {
    const member = await this.prisma.tripMember.findFirst({
      where: { trip_id: tripId, user_id: userId },
    });
    if (!member) throw new ForbiddenException('Not a trip member');
    if (member.role === 'viewer') {
      throw new ForbiddenException('Viewers cannot edit');
    }
  }
}
```

## Global Infrastructure

```tsx
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,        // Strip unknown properties
  forbidNonWhitelisted: true,
  transform: true,
}));

app.useGlobalFilters(new HttpExceptionFilter());
app.useGlobalInterceptors(new TransformInterceptor());

// Response envelope interceptor
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

## Rules

> 원칙 및 금지사항은 `server-conventions.md` 규칙 참조.
> 위 코드 템플릿은 해당 규칙의 구현 예시.
