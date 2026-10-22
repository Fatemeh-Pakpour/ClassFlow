import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';

export const EMAIL_CLAIM = 'https://classflow.app/email';
export const EMAIL_VERIFIED_CLAIM = 'https://classflow.app/email_verified';

const emailSchema = z.string().trim().max(254).pipe(z.email());

export interface VerifiedEmailIdentity {
  auth0Subject: string;
  email: string;
  emailVerified: true;
}

export type VerifiedEmailRequest = Request & {
  verifiedEmailIdentity?: VerifiedEmailIdentity;
};

/** Route-level policy. The global JwtAuthGuard must authenticate first. */
@Injectable()
export class VerifiedEmailGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<VerifiedEmailRequest>();
    const claims = request.auth?.payload;
    const subject = claims?.sub;
    if (typeof subject !== 'string' || subject.length === 0) {
      throw new UnauthorizedException('Missing authenticated subject');
    }

    const email = emailSchema.safeParse(claims?.[EMAIL_CLAIM]);
    if (claims?.[EMAIL_VERIFIED_CLAIM] !== true || !email.success) {
      throw new ForbiddenException(
        'A verified email is required for registration',
      );
    }

    request.verifiedEmailIdentity = {
      auth0Subject: subject,
      email: email.data,
      emailVerified: true,
    };
    return true;
  }
}
