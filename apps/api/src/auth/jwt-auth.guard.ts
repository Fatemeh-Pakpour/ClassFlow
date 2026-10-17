import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request, RequestHandler, Response } from 'express';
import { auth, UnauthorizedError } from 'express-oauth2-jwt-bearer';
import type { Env } from '../config/env.schema.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

/**
 * Global guard: every route requires a valid Auth0 access token unless marked @Public().
 * Verification (signature via JWKS, issuer, audience, expiry) is delegated to
 * express-oauth2-jwt-bearer; on success the decoded token is on req.auth.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly checkJwt: RequestHandler;

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService<Env, true>,
  ) {
    this.checkJwt = auth({
      issuerBaseURL: config.get('AUTH0_ISSUER_BASE_URL', { infer: true }),
      audience: config.get('AUTH0_AUDIENCE', { infer: true }),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    try {
      await new Promise<void>((resolve, reject) =>
        this.checkJwt(req, res, (err?: unknown) => (err ? reject(err) : resolve())),
      );
    } catch (err) {
      // Map the SDK's 400/401/403 errors to Nest responses, keeping the
      // WWW-Authenticate header RFC 6750 clients rely on.
      if (err instanceof UnauthorizedError) {
        res.set(err.headers);
        throw new HttpException(err.message, err.status);
      }
      throw err;
    }
    return true;
  }
}
