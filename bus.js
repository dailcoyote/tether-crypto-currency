const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
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
    async scanCryptoExchange() {
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

        return Promise.all(batch)
    }
    async getLatestPrices(reqRaw) {
        // reqRaw is Buffer, we need to parse it
        const reqPairs = JSON.parse(reqRaw.toString('utf-8')).pairs || [];       // bitcoin, tether, etc
        const batchPromises = reqPairs.map((id) => {
            return this.#hbee.get(id, {
                keyEncoding: 'json',
                valueEncoding: 'json'
            })
        })
        // Parallel exec
        const resp = (await Promise.all(batchPromises)).map((rec) => {
            return { ...rec.value }
        });
        return Buffer.from(JSON.stringify(resp), 'utf-8')
    }
}

module.exports = Bus