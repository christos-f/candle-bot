import * as cheerio from "cheerio"
import { db } from "./database.js";
import { NewCandle } from "./models.js";
import sendNotifications from "./mail.js";

const newCandles: Array<NewCandle> = []
const newPrices: Array<NewCandle> = []

const getCandlesHtml = async (url: string) => {
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


const buildCandle = (candleHtml: cheerio.Element): NewCandle => {
    const parser = cheerio.load(candleHtml)
    return {
        scent_name: parser("h3.product-name").text().trim(),
        candle_type: parser("h4.product-type").text().trim().includes("single") ? "single-wick" : "3-wick",
        price: Number(parser("span.product-sales-price").text().trim().substring(1))
    }
}

const getCandlesFromPage = (candlesHtml: cheerio.Element[]) => {
    return candlesHtml.map(e => buildCandle(e))
}

const removeDuplicates = (candles: NewCandle[]) => {
    const candleMap = new Map<string, NewCandle>();
    candles.forEach(candle => {
        const existingCandle = candleMap.get(candle.scent_name);
        if (!existingCandle || candle.price < existingCandle.price) {
            candleMap.set(candle.scent_name, candle);
        }
    });
    return Array.from(candleMap.values());
};

const getAllCandles = async () => {
    console.log("Checking for new candles...")
    let startPoint = 0
    const candles = []


    while (true) {
        const baseUrl = process.env.THREE_WICK_URL
        const url = `${baseUrl}?start=${startPoint}&sz=48`
        const scrapedCandles = await getCandlesHtml(url)
        candles.push(...getCandlesFromPage(scrapedCandles))
        if (scrapedCandles.length < 1) {
            break
        }
        startPoint += 48
    }
    const cleanCandles = removeDuplicates(candles)

    console.log(`Successfully scraped ${cleanCandles.length} candles`)

    for (const candle of cleanCandles) {
        await insertCandle(candle)
    }
}

const sendCandleNotifications = async () => {

    let message = ``

    if (newCandles.length > 0) {
        message += `---------------------------\nNew Candles have arrived!\n---------------------------\n`
        for (const candle of newCandles) {
            message += `${candle.scent_name}\n${candle.candle_type}\n${candle.price}\n----------------------------\n`
        }
    }


    if (newPrices.length > 0) {
        message += `---------------------------\nNew candle prices have arrived\n---------------------------\n`
        for (const candle of newPrices) {
            message += `${candle.scent_name}\n${candle.candle_type}\n${candle.price}\n----------------------------\n`
        }
    }

    if (message)
        await sendNotifications(message)
}

const insertCandle = async (candle: NewCandle) => {
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
        console.log(`A new scent has been added! -> ${candle.scent_name}`)
        return
    }

    if (existingCandle.price != candle.price) {
        const insert = await db.updateTable("candle")
            .set({ price: candle.price, updated_at: new Date() })
            .where("scent_name", "=", candle.scent_name)
            .returning("id")
            .execute()

        await db.insertInto("candle_history")
            .values({
                candle_id: insert[0].id,
                old_price: existingCandle.price,
                new_price: candle.price
            })
            .execute()

        console.log(`Price Update:\nOld price for ${existingCandle.scent_name} is ${existingCandle.price} -> New price for ${candle.scent_name} is ${candle.price}`)

        if (existingCandle.price > candle.price) {
            newPrices.push(candle)
        }
    }
}

export const scrapeCandles = async () => {
    await getAllCandles()
    console.log("Completed scanning candles!")
    console.log(`There are ${newCandles.length} new candles`)
    console.log(`There are ${newPrices.length} new prices`)
    await sendCandleNotifications()
}
