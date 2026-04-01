import { Module } from '@nestjs/common';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { DescriptionTemplatesController } from './description-templates.controller';
import { DescriptionTemplatesService } from './description-templates.service';

@Module({
  controllers: [LinksController, DescriptionTemplatesController],
  providers: [LinksService, DescriptionTemplatesService],
})
export class LinksModule {}
