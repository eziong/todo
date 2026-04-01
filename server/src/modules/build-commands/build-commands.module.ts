import { Module } from '@nestjs/common';
import { BuildCommandsController } from './build-commands.controller';
import { BuildCommandsService } from './build-commands.service';

@Module({
  controllers: [BuildCommandsController],
  providers: [BuildCommandsService],
})
export class BuildCommandsModule {}
