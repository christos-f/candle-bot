import { ColumnType, Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
    candle: CandleTable;
}

export interface CandleTable {
    id: Generated<number>;
    scent_name: string;
    candle_type: "single-wick" | "3-wick";
    price: number;
    created_at: Date;
    last_upated: Date;
}

export type Candle = Selectable<CandleTable>
export type NewCandle = Insertable<CandleTable>
export type CandleUpdate = Updateable<CandleTable>