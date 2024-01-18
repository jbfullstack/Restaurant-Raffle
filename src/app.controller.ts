import { Controller, Get, HttpStatus, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/turn-the-wheel')
  async turnTheWheel(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const clientIp = this.getClientIp(request);
      const wheelResponse = await this.appService.turnTheWheel(clientIp);

      response.status(wheelResponse.status).json({
        generatedNumber: wheelResponse.generatedNumber,
        message: wheelResponse.message,
      });
    } catch (error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'An error occurred while processing your request.',
      });
    }
  }

  private getClientIp(request): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    return request.connection.remoteAddress || '';
  }
}
