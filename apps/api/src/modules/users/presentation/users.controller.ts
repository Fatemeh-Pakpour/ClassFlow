import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../application/users.service.js';
import {
  type RegisterUserBody,
  RegisterUserBodySchema,
} from './register-user-body.schema.js';
import { type Request } from 'express';
import { UserEmailConflictError } from '../application/user-registration.errors.js';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async createUser(
    @Body({ schema: RegisterUserBodySchema }) body: RegisterUserBody,
    @Req() request: Request,
  ) {
    const subject = request.auth?.payload.sub;

    if (typeof subject !== 'string' || subject.length === 0) {
      throw new UnauthorizedException('Missing authenticated subject');
    }

    try {
      const user = await this.service.createUser({
        name: body.name,
        email: body.email,
        auth0Subject: subject,
      });
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (error instanceof UserEmailConflictError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
