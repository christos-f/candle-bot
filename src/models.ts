import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
    candle: CandleTable;
    candle_history: CandleHistoryTable;
    deal: DealTable;
    deal_history: DealHistoryTable;
}

export interface CandleTable {
    id: Generated<number>;
    scent_name: string;
    candle_type: "single-wick" | "3-wick";
    price: number;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}

export interface CandleHistoryTable {
    id: Generated<number>;
    candle_id: number;
    old_price: number;
    new_price: number;
    date_changed: Generated<Date>;
}

export interface DealTable {
    id: Generated<number>;
    product_type: string;
    deal: string;
    details: string | null;
    is_active: Generated<boolean>;
    created_at: Generated<Date>;
}

export interface DealHistoryTable {
    id: Generated<number>;
    deal_id: number;
    start_date: Generated<Date>;
    end_date: Date | null;
}

export type Candle = Selectable<CandleTable>
export type NewCandle = Insertable<CandleTable>
export type CandleUpdate = Updateable<CandleTable>

export type CandleHistory = Selectable<CandleHistoryTable>
export type NewCandleHistory = Insertable<CandleHistoryTable>
export type CandleHistoryUpdate = Updateable<CandleHistoryTable>

export type Deal = Selectable<DealTable>
export type NewDeal = Insertable<DealTable>
export type DealUpdate = Updateable<DealTable>

export type DealHistory = Selectable<DealHistoryTable>
export type NewDealHistory = Insertable<DealHistoryTable>
export type DealHistoryUpdate = Updateable<DealHistoryTable>