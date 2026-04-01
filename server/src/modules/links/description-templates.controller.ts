import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth.types';
import { CreateDescriptionTemplateDto } from './dto/create-description-template.dto';
import { UpdateDescriptionTemplateDto } from './dto/update-description-template.dto';
import { DescriptionTemplatesService } from './description-templates.service';

@Controller('description-templates')
export class DescriptionTemplatesController {
  constructor(
    private readonly descriptionTemplatesService: DescriptionTemplatesService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.descriptionTemplatesService.findAll(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateDescriptionTemplateDto,
  ) {
    return this.descriptionTemplatesService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateDescriptionTemplateDto,
  ) {
    return this.descriptionTemplatesService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.descriptionTemplatesService.remove(user.id, id);
  }
}
