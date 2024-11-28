const RPC = require('@hyperswarm/rpc')
const DHT = require('hyperdht')
const Hypercore = require('hypercore')
const Hyperbee = require('hyperbee')
const crypto = require('crypto')
const fs = require('fs')

const main = async () => {
    // hyperbee db
    const hcore = new Hypercore('./db/rpc-client')
    const hbee = new Hyperbee(hcore, { keyEncoding: 'utf-8', valueEncoding: 'binary' })
    await hbee.ready()


    // public key of rpc server, used instead of address, the address is discovered via dht
    const rpc = new RPC()
    const serverPubKey = fs.readFileSync("keys/rpcserver.pub").toString('utf8');
    console.log(serverPubKey)

    const client = rpc.connect(Buffer.from(serverPubKey, "hex"))
    await client.request('echo', Buffer.from('hello world'))

    // payload for request
    const payloadRaw = Buffer.from(JSON.stringify({ nonce: 126 }), 'utf-8')

    // sending request and handling response
    const respRaw = await client.request('ping', payloadRaw)
    const resp = JSON.parse(respRaw.toString('utf-8'))
    console.log(resp) // { nonce: 127 }

    // closing connection
    await rpc.destroy()
    // await dht.destroy()
}

main().catch(console.error)