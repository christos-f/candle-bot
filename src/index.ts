import { scrapeCandles } from "./candles.js"
import { scrapeDeals } from "./deals.js"

const main = async () => {
    console.log("Starting scan...")
    await scrapeCandles()
    await scrapeDeals()
}

main().then(() => console.log("Completed Scan"))