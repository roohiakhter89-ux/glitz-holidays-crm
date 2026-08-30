import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { AiGeneratorService } from './ai-generator.service';
import { SocialPublisherService } from './social-publisher.service';

@Module({
  controllers: [SocialController],
  providers: [SocialService, AiGeneratorService, SocialPublisherService],
  exports: [SocialService],
})
export class SocialModule {}
