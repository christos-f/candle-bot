import * as cheerio from "cheerio"
import { NewDeal } from "./models.js"
import { db } from "./database.js"
import sendNotifications from "./mail.js"

const newDeals: NewDeal[] = []

const requestConfig = {
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }
}


const getBannerDeal = async (url: string) => {
    const response = await fetch(url, requestConfig)
    const html = await response.text()
    const $ = cheerio.load(html)
    const bannerDeal = $("div.banner-module").find("img").attr("alt")?.trim()
    if (!bannerDeal || !bannerDeal.toLowerCase().includes("sale")) return null
    return bannerDeal
}

const getDealsHtml = async (url: string) => {
    let retries = 3
    while (retries > 0) {
        const response = await fetch(url, requestConfig)
        const html = await response.text()
        const $ = cheerio.load(html)
        const divs = $("div.ds-top-offers-tile-copy").toArray()
        if (divs.length === 0) {
            console.log(`Couldnt find any deals.. trying again - ${retries} left`)
            retries -= 1
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
        else {
            return divs
        }
    }
    throw new Error("No Deals Found")
}

const buildDeal = (dealHtml: cheerio.Element): NewDeal => {
    const parser = cheerio.load(dealHtml)
    return {
        product_type: parser("div.ds-top-offers-category").text().trim(),
        deal: parser("div.ds-top-offers-price").text().trim(),
        details: parser("div.ds-top-offers-details").text().trim(),
    }
}

const getdealsFromPage = (dealsHtml: cheerio.Element[]) => {
    return dealsHtml.map(e => buildDeal(e))
}

const getAllDeals = async (): Promise<void> => {
    console.log("Checking for new deals...")
    const deals = []
    const url = process.env.BASE_URL
    if(!url) throw new Error("No URL was provided")
    const scrapedDeals = await getDealsHtml(url)
    const bannerDeal = await getBannerDeal(url)
    console.log(`Successfully scraped ${bannerDeal ? scrapedDeals.length + 1 : scrapeDeals.length} deals`)
    deals.push(...getdealsFromPage(scrapedDeals))
    if (bannerDeal) {
        deals.push({
            product_type: "General Sale",
            deal: bannerDeal,
            details: ""
        })
    }
    for (const deal of deals) {
        await insertdeal(deal)
    }
    await evalutateDeals(deals)
    console.log("Completed scanning deals!")
}

const insertdeal = async (deal: NewDeal) => {
    // check if this deal exists in the database
    const existingDeal = await db.selectFrom("deal")
        .selectAll()
        .where("deal", "=", deal.deal)
        .executeTakeFirst()
    // if this deal is not in our databse, insert it
    if (!existingDeal) {
        const insert = await db.insertInto("deal")
            .values({
                product_type: deal.product_type,
                deal: deal.deal,
                details: deal.details
            })
            .returning("id")
            .execute()

        await db.insertInto("deal_history")
            .values({
                deal_id: insert[0].id,
            }).execute()
        newDeals.push(deal)
        console.log(`A new deal has been added! -> ${deal.deal}`)
    }
}

const evalutateDeals = async (deals: NewDeal[]) => {
    const existingDeals = await db.selectFrom("deal")
        .select("deal")
        .where("deal.is_active", "=", true)
        .execute()

    if (!existingDeals || existingDeals.length < 1) return
    for (const existingDeal of existingDeals) {
        const match = deals.find((deal) => deal.deal === existingDeal.deal)
        if (!match) {
            const insert = await db.updateTable("deal").set({ is_active: false })
                .where("deal", "=", existingDeal.deal)
                .where("is_active", "=", true)
                .returning("id").execute()

            await db.updateTable("deal_history")
                .set({ end_date: new Date() })
                .where("deal_id", "=", insert[0].id)
                .execute()

            console.log(`Deal -> ${existingDeal.deal} has been disabled`)
        }
    }
}

const sendDealNotifications = async () => {

    let message = `-------------------------------\nNew Sales have arrived!\n-------------------------------\n`

    if (newDeals.length > 0) {
        for (const deal of newDeals) {
            if (deal.details)
                message += `${deal.product_type}\n- ${deal.deal}\n- ${deal.details}\n-------------------------------\n`
            else
                message += `${deal.product_type}\n- ${deal.deal}\n-------------------------------\n`
        }
        await sendNotifications(message)
    }

}

export const scrapeDeals = async () => {
    await getAllDeals()
    console.log(`There are ${newDeals.length} new deals`)
    await sendDealNotifications()
}
