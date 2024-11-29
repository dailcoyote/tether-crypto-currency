const RPC = require('@hyperswarm/rpc')
const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
const fs = require('fs')

const main = async () => {
    // hyperbee db
    const hcore = new Hypercore('./db/rpc-client')
    const hbee = new Hyperbee(hcore, { keyEncoding: 'utf-8', valueEncoding: 'binary' })
    await hbee.ready()

    // public key of rpc server, used instead of address, the address is discovered via dht
    const rpc = new RPC()
    const serverPubKey = fs.readFileSync("keys/rpcserver.pub").toString('utf8');
    const client = rpc.connect(Buffer.from(serverPubKey, "hex"))

    // Remote :[GETLatestPrices] Procedure Call
    const respRaw = await client.request(
        'getLatestPrices',
        Buffer.from(JSON.stringify({ pairs: ['tether', 'bitcoin'] })),
        'utf-8')
    console.log(":[GETLatestPrices]->List", JSON.parse(respRaw.toString('utf-8')))

    // closing connection
    await rpc.destroy()
}

main().catch(console.error)