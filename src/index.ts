import { db } from "./database.js";
// import { Candle, CandleUpdate, NewCandle } from "./models.js";

const FindCandles = async () => {
    return await db
        .selectFrom("candle")
        .selectAll("candle")
        .execute()
}

const main = async () => {
    const result = await FindCandles()
    console.log(result)

    result.forEach(e => {
        console.log(new Date(e.created_at).toLocaleString())
    })

}

main()
    .catch(e => {
        console.log(`An error has occured: ${e}`)
    })
