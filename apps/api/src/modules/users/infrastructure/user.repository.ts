import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "../../../infrastructure/database/database.token.js";
import { type Database } from "@classflow/db";

@Injectable()
export class UsersRepository {
    constructor(
        @Inject(DATABASE) private readonly db: Database,
    ) { }
    async findByAuth0Subject(auth0Subject: string) {
        return this.db.query.users.findFirst({
            where: (users, { eq }) =>
                eq(users.auth0Subject, auth0Subject)
        })
    }

}