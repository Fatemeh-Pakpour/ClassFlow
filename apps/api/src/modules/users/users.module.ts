import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module.js';
import { UsersRepository } from './infrastructure/user.repository.js';
import { UsersService } from './application/users.service.js';
import { UsersController } from './presentation/users.controller.js';
import { IdentityModule } from '../identity/identity.module.js';

@Module({
  controllers: [UsersController],
  imports: [DatabaseModule, IdentityModule],
  providers: [UsersRepository, UsersService],
})
export class UserModule {}
