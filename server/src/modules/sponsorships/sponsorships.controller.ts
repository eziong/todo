import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { CreateSponsorshipDto } from './dto/create-sponsorship.dto';
import { UpdateSponsorshipDto } from './dto/update-sponsorship.dto';
import { SponsorshipFiltersDto } from './dto/sponsorship-filters.dto';
import { SponsorshipsService } from './sponsorships.service';

@Controller('sponsorships')
export class SponsorshipsController {
  constructor(private readonly sponsorshipsService: SponsorshipsService) {}

  @Get('summary')
  getGlobalSummary(
    @CurrentUser() user: AuthUser,
    @Query('year') year?: string,
  ) {
    const summaryYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.sponsorshipsService.getGlobalSummary(user.id, summaryYear);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() filters: SponsorshipFiltersDto,
  ) {
    return this.sponsorshipsService.findAll(
      user.id,
      filters.status,
      filters.contentId,
      filters.search,
    );
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSponsorshipDto) {
    return this.sponsorshipsService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSponsorshipDto,
  ) {
    return this.sponsorshipsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.sponsorshipsService.remove(user.id, id);
  }
}
