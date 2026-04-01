import { Module } from '@nestjs/common';
import { SponsorshipsController } from './sponsorships.controller';
import { SponsorshipsService } from './sponsorships.service';

@Module({
  controllers: [SponsorshipsController],
  providers: [SponsorshipsService],
})
export class SponsorshipsModule {}
