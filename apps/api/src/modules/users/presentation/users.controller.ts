import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../application/users.service.js';
import {
  type RegisterUserBody,
  RegisterUserBodySchema,
} from './register-user-body.schema.js';
import {
  VerifiedEmailGuard,
  type VerifiedEmailRequest,
} from '../../identity/verified-email.guard.js';
import { UserEmailConflictError } from '../application/user-registration.errors.js';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(VerifiedEmailGuard)
  async createUser(
    @Body({ schema: RegisterUserBodySchema }) body: RegisterUserBody,
    @Req() request: VerifiedEmailRequest,
  ) {
    const identity = request.verifiedEmailIdentity;
    if (!identity) {
      throw new UnauthorizedException('Missing authenticated identity');
    }

    try {
      const user = await this.service.createUser({
        name: body.name,
        email: identity.email,
        emailVerified: identity.emailVerified,
        auth0Subject: identity.auth0Subject,
      });
      if (user) {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      }
    } catch (error) {
      if (error instanceof UserEmailConflictError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
