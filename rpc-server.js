const RPC = require('@hyperswarm/rpc')
const DHT = require('hyperdht')
const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
const crypto = require('crypto')
const fs = require('fs');

const main = async () => {
    // hyperbee db
    const hcore = new Hypercore('./db/rpc-server')
    const hbee = new Hyperbee(hcore, { keyEncoding: 'utf-8', valueEncoding: 'binary' })
    await hbee.ready()

    // start distributed hash table, it is used for rpc service discovery
    const dht = new DHT()
    await dht.ready()

    // setup rpc server
    const rpc = new RPC()
    const rpcServer = rpc.createServer()
    await rpcServer.listen()
    const pubKey = rpcServer.publicKey;
    console.log('rpc server started listening on public key:', pubKey.toString('hex'), pubKey)
    // rpc server started listening on public key: 763cdd329d29dc35326865c4fa9bd33a45fdc2d8d2564b11978ca0d022a44a19

    fs.writeFileSync("keys/rpcserver.pub", pubKey.toString('hex'))


    rpcServer.respond('echo', (req) => {
        console.log(req.toString('utf-8'))
    })

    // bind handlers to rpc server
    rpcServer.respond('ping', async (reqRaw) => {
        console.log(reqRaw)
        // reqRaw is Buffer, we need to parse it
        const req = JSON.parse(reqRaw.toString('utf-8'))

        const resp = { nonce: req.nonce + 1 }

        // we also need to return buffer response
        const respRaw = Buffer.from(JSON.stringify(resp), 'utf-8')
        return respRaw
    })

}

main().catch(console.error)

