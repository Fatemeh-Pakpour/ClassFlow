import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/user.repository.js';
import { type RegisterUserInput } from './register-user.schema.js';
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

  async createUser(input: RegisterUserInput) {
    const existingUser = await this.findByAuth0Subject(input.auth0Subject);
    if (existingUser) {
      return existingUser;
    }

    const existingEmail = await this.findByEmail(input.email);

    if (existingEmail) {
      throw new UserEmailConflictError();
    }

    const created = await this.repository.create({
      auth0Subject: input.auth0Subject,
      name: input.name,
      email: input.email,
      status: 'pending_verification',
    });
    if (created) return created;

    // Another request can insert the same subject after our initial lookup.
    const concurrent = await this.findByAuth0Subject(input.auth0Subject);
    if (concurrent) return concurrent;
    throw new Error('Registered user could not be resolved');
  }
}
