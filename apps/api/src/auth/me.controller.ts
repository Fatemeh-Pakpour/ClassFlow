import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

// Protected by the global JwtAuthGuard; handy for checking the web → API token flow.
@Controller('me')
export class MeController {
  @Get()
  me(@Req() req: Request) {
    const payload = req.auth!.payload;
    return { sub: payload.sub, permissions: payload.permissions ?? [] };
  }
}
