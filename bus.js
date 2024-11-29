const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
const CronJob = require('cron').CronJob
const CryptoMarketScanner = require('./CryptoMarketScanner')

const scanner = new CryptoMarketScanner()

class Bus {
    #hcore;
    #hbee;

    async setup() {
        // hyperbee db
        this.#hcore = new Hypercore('./db/rpc-server')
        this.#hbee = new Hyperbee(this.#hcore, { keyEncoding: 'utf-8', valueEncoding: 'binary' })
        await this.#hbee.ready()
    }
    async #scanCryptoExchange() {
        const batch = (await scanner
            .coins('usd', function ({ id, current_price }) {       // Sampling
                return { id, current_price }
            }))
            .map((coin) => {    // Map & Group
                return this.#hbee.put(coin.id, { ...coin }, {
                    keyEncoding: 'json',
                    valueEncoding: 'json'
                })
            })
        console.log('Cryptocurrency data updated in storage')

        return Promise.all(batch)
    }
    async exchangeSchedule() {
        CronJob.from({
            cronTime: '*/30 * * * * *',     // Every 30 second
            onTick: async () => {
                await this.#scanCryptoExchange()
                console.log('The planned task of scanning the cryptocurrency exchange has been completed');
            },
            start: true
        });
    }
    async getLatestPrices(reqRaw) {
        // reqRaw is Buffer, we need to parse it
        const reqPairs = JSON.parse(reqRaw.toString('utf-8')).pairs || [];       // bitcoin, tether, etc
        // Scan
        await this.#scanCryptoExchange()
        // Parallel exec
        const resp = (await Promise.all(
            reqPairs.map((id) => {
                return this.#hbee.get(id, {
                    keyEncoding: 'json',
                    valueEncoding: 'json'
                })
            })
        )).map((rec) => {
            return { ...rec.value }
        });
        return Buffer.from(JSON.stringify(resp), 'utf-8')
    }
}

module.exports = Bus