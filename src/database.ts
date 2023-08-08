import { Database } from "./models.js";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg"
const { Pool } = pg;


const dialect = new PostgresDialect({
    pool: new Pool({
        database: "candle",
        host: "localhost",
        user: "postgres",
        password: "christos",
        port: 5432,
        max: 10
    })
})

export const db = new Kysely<Database>({
    dialect
})

