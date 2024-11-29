const RPC = require('@hyperswarm/rpc')
const DHT = require('hyperdht')
const fs = require('fs')
const Bus = require('./bus')

const main = async () => {
    const bus = new Bus();
    await bus.setup()

    // start distributed hash table, it is used for rpc service discovery
    const dht = new DHT()
    await dht.ready()

    // setup rpc server
    const rpc = new RPC()
    const rpcServer = rpc.createServer()
    await rpcServer.listen()
    const pubKey = rpcServer.publicKey;
    
    // Reading certs/keys
    fs.writeFileSync("keys/rpcserver.pub", pubKey.toString('hex'))
    process.env.COINGECKO_API_KEY = fs.readFileSync("keys/coingecko.key").toString('utf8');
    
    console.log('rpc server started listening on public key:', pubKey.toString('hex'), pubKey);
    console.log("API Key from CoinGecko Crypo Tracker:", process.env.COINGECKO_API_KEY)

    // bind handlers to rpc server
    rpcServer.respond('getLatestPrices', bus.getLatestPrices.bind(bus))

    // Cron Job
    bus.exchangeSchedule()
}

main().catch(console.error)

