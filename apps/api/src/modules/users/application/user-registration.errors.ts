export class UserEmailConflictError extends Error {
  constructor() {
    super('Unable to register this account with the supplied profile.');
    this.name = 'UserEmailConflictError';
  }
}
