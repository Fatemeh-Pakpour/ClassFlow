import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/user.repository.js';
import {
  RegisterUserSchema,
  type RegisterUserInput,
} from './register-user.schema.js';
import { UserEmailConflictError } from './user-registration.errors.js';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async findByAuth0Subject(auth0Subject: string) {
    return this.repository.findByAuth0Subject(auth0Subject);
  }

  async findByEmail(email: string) {
    return this.repository.findByEmail(email);
  }

  // Assemble this internal input from verified identity, never directly from HTTP data.
  async createUser(input: RegisterUserInput) {
    const user = RegisterUserSchema.parse(input);
    const existingUser = await this.findByAuth0Subject(user.auth0Subject);
    if (existingUser) return existingUser;

    const existingEmail = await this.findByEmail(user.email);
    if (existingEmail) {
      const concurrent = await this.findByAuth0Subject(user.auth0Subject);
      if (concurrent) return concurrent;
      throw new UserEmailConflictError();
    }

    try {
      const created = await this.repository.create({
        auth0Subject: user.auth0Subject,
        name: user.name,
        email: user.email,
        status: 'active',
        // Time we observed Auth0's proof, not its original verification time.
        email_verified_at: new Date(),
      });
      if (created) return created;
    } catch (error) {
      if (error instanceof UserEmailConflictError) {
        const concurrent = await this.findByAuth0Subject(user.auth0Subject);
        if (concurrent) return concurrent;
      }
      throw error;
    }

    const concurrent = await this.findByAuth0Subject(user.auth0Subject);
    if (concurrent) return concurrent;
    throw new Error('Registered user could not be resolved');
  }
}
