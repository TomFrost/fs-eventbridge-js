/*
 * Copyright (c) 2017 Tom Shawver
 */

/* global should, describe, it, afterEach */

'use strict'

const FSEventBridgeClient = require('src/index')
const net = require('net')
const fs = require('fs')
const path = require('path')

let inst
let server

describe('FSEventBridgeClient', () => {
  afterEach(() => {
    if (inst) inst.stop()
    if (server) server.close()
  })
  it('instantiates without error', () => {
    new FSEventBridgeClient()
  })
  it('connects to a server', (done) => {
    server = net.createServer(() => done())
    server.listen(65056)
    inst = new FSEventBridgeClient()
    inst.start()
  })
  it('watches for file changes and sends change commands', (done) => {
    const nowMs = Date.now()
    const file = path.join(process.cwd(), 'package.json')
    server = net.createServer(conn => {
      conn.on('data', data => {
        data.toString().should.equal(`CHANGE ${file}\n`)
        done()
      })
    })
    server.listen(65056)
    inst = new FSEventBridgeClient()
    inst.start().then(() => {
      inst.connected.should.equal(true)
      fs.utimes(file, nowMs, nowMs, err => {
        if (err) done(err)
      })
    }).catch(done)
  })
})
