/** Persistence outcome; deciding what it means for registration belongs to the service. */
export class EmailAlreadyExistsError extends Error {
  constructor() {
    super('A user with this email already exists.');
    this.name = 'EmailAlreadyExistsError';
  }
}
