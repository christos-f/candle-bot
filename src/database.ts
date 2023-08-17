import { Database } from "./models.js";
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg"
const { Pool } = pg;

const dialect = new PostgresDialect({
    pool: new Pool({
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT),
        max: 10
    })
})


export const db = new Kysely<Database>({
    dialect
})

await db.schema.createTable("candle").ifNotExists()
    .addColumn("id", "serial", (cb) => cb.primaryKey())
    .addColumn("scent_name", "varchar", (cb) => cb.notNull())
    .addColumn("candle_type", "varchar", (cb) => cb.notNull())
    .addColumn("price", "numeric", (cb) => cb.notNull())
    .addColumn("created_at", "date", (cb) => cb.notNull().defaultTo(sql`now()`))
    .addColumn("updated_at", "date")
    .execute()

await db.schema.createTable("candle_history").ifNotExists()
    .addColumn("id", "serial", (cb) => cb.primaryKey())
    .addColumn("candle_id", "integer", (cb) => cb.notNull())
    .addColumn("old_price", "numeric", (cb) => cb.notNull())
    .addColumn("new_price", "numeric", (cb) => cb.notNull())
    .addColumn("date_changed", "date", (cb) => cb.notNull().defaultTo(sql`now()`))
    .addForeignKeyConstraint("candle_id_foreign", ["candle_id"], "candle", ["id"], (cb) => cb.onDelete("cascade"))
    .execute()

await db.schema.createTable("deal").ifNotExists()
    .addColumn("id", "serial", (cb) => cb.primaryKey())
    .addColumn("product_type", "varchar", (cb) => cb.notNull())
    .addColumn("deal", "varchar", (cb) => cb.notNull())
    .addColumn("details", "varchar")
    .addColumn("is_active", "boolean", (cb) => cb.defaultTo(true))
    .addColumn("created_at", "date", (cb) => cb.notNull().defaultTo(sql`now()`))
    .execute()

await db.schema.createTable("deal_history").ifNotExists()
    .addColumn("id", "serial", (cb) => cb.primaryKey())
    .addColumn("deal_id", "integer", (cb) => cb.notNull())
    .addColumn("start_date", "date", (cb) => cb.notNull().defaultTo(sql`now()`))
    .addColumn("end_date", "date")
    .addForeignKeyConstraint("deal_id_foriegn", ["deal_id"], "deal", ["id"], (cb) => cb.onDelete("cascade"))
    .execute()




