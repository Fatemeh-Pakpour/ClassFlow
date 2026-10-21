import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/user.repository.js';

@Injectable()
export class UsersService {
    constructor(
        private readonly repository: UsersRepository,
    ) { }

    async findByAuth0Subject(auth0Subject: string) {
        return this.repository.findByAuth0Subject(auth0Subject);
    }
}