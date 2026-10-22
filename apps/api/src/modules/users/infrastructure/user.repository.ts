import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '../../../infrastructure/database/database.token.js';
import { type UserInsert, users, type Database } from '@classflow/db';
import { EmailAlreadyExistsError } from './user-persistence.errors.js';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}
  async findByAuth0Subject(auth0Subject: string) {
    return this.db.query.users.findFirst({
      where: (users, { eq }) => eq(users.auth0Subject, auth0Subject),
    });
  }

  async create(user: UserInsert) {
    try {
      const [created] = await this.db
        .insert(users)
        .values(user)
        .onConflictDoNothing({ target: users.auth0Subject })
        .returning();
      return created;
    } catch (error) {
      // Drizzle can wrap the driver's PostgreSQL error as its cause.
      const cause = error instanceof Error ? error.cause : undefined;
      const databaseError = cause ?? error;
      if (
        typeof databaseError === 'object' &&
        databaseError !== null &&
        'code' in databaseError &&
        databaseError.code === '23505' &&
        'constraint' in databaseError &&
        databaseError.constraint === 'users_email_unique'
      ) {
        throw new EmailAlreadyExistsError();
      }
      throw error;
    }
  }
}
