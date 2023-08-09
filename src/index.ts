import fetch from "node-fetch";
import * as cheerio from "cheerio"
import { db } from "./database.js";
import { CandleTable, NewCandle } from "./models.js";

const newCandles: Array<NewCandle> = []
const newPrices: Array<NewCandle> = []


const getArrayofScrapedCandles = async (url: string) => {
    const requestConfig = {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
    }
    const response = await fetch(url, requestConfig)
    const html = await response.text()
    const $ = cheerio.load(html)
    return $("div.product-tile").toArray()
}

const buildCandle = (scrapedCandle: cheerio.Element): NewCandle => {
    const parser = cheerio.load(scrapedCandle)
    return {
        scent_name: parser("h3.product-name").text().trim(),
        candle_type: parser("h4.product-type").text().trim().includes("single") ? "single-wick" : "3-wick",
        price: Number(parser("span.product-sales-price").text().trim().substring(1))
    }

    // if (!currentCandleScentName || !currentCandleType || !currentCandlePrice) {
    //     throw new Error("Error extracting candle information from page")
    // }
}

const insertCandle = async (candle: NewCandle) => {

    if (candle.scent_name == undefined || candle.candle_type == undefined || candle.price == undefined) {
        throw new Error("No scent name was provided")
    }

    // check if this candle exists in the database
    const existingCandle = await db.selectFrom("candle")
        .selectAll()
        .where("scent_name", "=", candle.scent_name)
        .executeTakeFirst()

    // if this scent is not in our databse, insert it
    if (!existingCandle) {
        await db.insertInto("candle")
            .values({
                scent_name: candle.scent_name,
                candle_type: candle.candle_type,
                price: candle.price
            }).execute()
        newCandles.push(candle)
        return
    }

    if (existingCandle?.price > candle.price) {
        await db.updateTable("candle")
            .set({ price: candle.price, last_updated: new Date() })
            .where("scent_name", "=", candle.scent_name)
            .execute()
        console.log(`The price for ${candle.scent_name} has been updated to ${candle.price}`)
        newPrices.push(candle)
    }
}

const scrapeCandles = async () => {
    let startPoint = 0

    while (true) {
        const baseUrl = "https://www.bathandbodyworks.com/c/all-candles/3-wick-candles"
        const url = `${baseUrl}?start=${startPoint}&sz=48`
        const scrapedCandles = await getArrayofScrapedCandles(url)
        if (scrapedCandles.length < 1) {
            break
        }
        scrapedCandles.forEach(async (scrapedCandle) => {
            const candle = buildCandle(scrapedCandle)
            await insertCandle(candle)
        });
        startPoint += 48
    }

    if (newPrices.length == 0 && newCandles.length == 0) {
        console.log(`There are no new updates`)
    }

    if (newCandles.length > 0) {
        console.log(`Update: new candles have arrived: ${newCandles}`)
    }

    if (newPrices.length > 0) {
        console.log(`Update: new candles have arrived: ${newPrices}`)
    }

}


// const fetchNewCandles = async (): Promise<void> => {
//     let startPoint = 0
//     while (true) {


//         // If no products are on the page, ran out of candles
//         if (rawCandles.length < 1) {
//             break
//         }

//         rawCandles.forEach(async (e) => {

// const existingCandle = await db.selectFrom("candle")
//     .selectAll()
//     .where("scent_name", "=", currentCandleScentName)
//     .executeTakeFirst()

// // if this scent is not in our databse, insert it
// if (!existingCandle) {
//     await db.insertInto("candle")
//         .values({
//             scent_name: currentCandleScentName,
//             candle_type: currentCandleType,
//             price: currentCandlePrice,
//         }).execute()
// }

// if (existingCandle?.price != currentCandlePrice) {
//     await db.updateTable("candle")
//         .set({ price: currentCandlePrice, last_updated: new Date() })
//         .where("scent_name", "=", currentCandleScentName)
//         .execute()
//     console.log(`The price for ${currentCandleScentName} has been updated to ${currentCandlePrice}`)
// }

//         })
//         startPoint += 48
//     }
// }

const main = async () => {
    let startPoint = 0
}

// entry poin to program here
scrapeCandles()
    .catch(e => {
        console.log(`An error has occured: ${e}`)
    })