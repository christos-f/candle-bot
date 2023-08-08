// import { db } from "./database.js";
// import { Candle, CandleUpdate, NewCandle } from "./models.js";

// const FindCandles = async () => {
//     return await db
//         .selectFrom("candle")
//         .selectAll("candle")
//         .execute()
// }

// const main = async () => {
//     const result = await FindCandles()
//     console.log(result)

//     result.forEach(e => {
//         console.log(new Date(e.created_at).toLocaleString())
//     })

// }

// main()
//     .catch(e => {
//         console.log(`An error has occured: ${e}`)
//     })

import fetch from "node-fetch";
import * as cheerio from "cheerio"
import { CandleTable } from "./models.js";


const fetchNewCandles = async (url: string): Promise<void> => {
    const response = await fetch(url)
    const html = await response.text()
    const $ = cheerio.load(html)
    const products = $("div.product-tile").toArray()
    products.forEach(e => {
        const product = cheerio.load(e)
        const currentCandle = {
            scent_name: product("h3.product-name").text().trim(),
            candle_type: product("h4.product-type").text().trim().includes("single") ? "single-wick" : "3-wick",
            price: Number(product("span.product-sales-price").text().trim().substring(1))

        }
        console.log(currentCandle)
    })
}

const main = async () => {

    // const response = await fetch("https://www.bathandbodyworks.com/c/all-candles/single-wick-candles")
    // const html = await response.text()
    // const $ = cheerio.load(html)
    // const products = $("div.product-tile").toArray()
    // // console.log($("h3.product-name").text())
    // products.forEach(e => {
    //     console.log("=============================================")
    //     const product = cheerio.load(e)
    //     console.log(product("h3.product-name").text().trim())
    //     console.log(product("h4.product-type").text().trim())
    //     console.log(product("span.product-sales-price").text().trim())
    // })
}

fetchNewCandles("https://www.bathandbodyworks.com/c/all-candles/3-wick-candles")
    .catch(e => {
        console.log(`An error has occured: ${e}`)
    })