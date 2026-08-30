import { Controller, Get, Post, Query, Body, Headers, Req, UnauthorizedException, RawBodyRequest } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request } from 'express';
import { MetaLeadgenWebhookDto } from './dto/meta-webhook.dto';
import { WebhooksService } from './webhooks.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('integrations/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('meta')
  verifyMetaWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') token: string,
  ) {
    if (mode === 'subscribe' && challenge) {
      return challenge;
    }
    return 'Invalid request';
  }

  @Post('meta')
  receiveMetaWebhook(
    @Body() body: MetaLeadgenWebhookDto,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    const secret = process.env.META_APP_SECRET;
    if (secret && req.rawBody) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');
      if (signature !== digest) {
        throw new UnauthorizedException('Invalid signature');
      }
    } else if (secret) {
      throw new UnauthorizedException('Raw body missing');
    }
    return this.webhooksService.processMetaWebhook(body);
  }
}
