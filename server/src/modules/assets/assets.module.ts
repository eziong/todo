import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { LocalStorageService } from './local-storage.service';

@Module({
  controllers: [AssetsController],
  providers: [AssetsService, LocalStorageService],
})
export class AssetsModule {}
