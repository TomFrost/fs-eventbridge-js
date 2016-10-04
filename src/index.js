/*
 * Copyright (c) 2016 TechnologyAdvice, LLC
 */

'use strict'

const fs = require('fs')
const net = require('net')
const path = require('path')
const EventEmitter = require('events').EventEmitter

const DEFAULT_PORT = 65056
const errRegex = /^ERR\s(.+)$/

class FSEventBridgeClient extends EventEmitter {

  /**
   * Constructs a new FSEventBridgeClient
   * @param {Object} opts An option mapping
   * @param {string} [opts.host="localhost"] The hostname or IP address to which to connect
   * @param {number} [opts.port=65056] The port to which to connect
   * @param {string} [opts.watch=process.cwd()] The directory to be watched for changes
   * @param {boolean} [opts.recursive=true] If true, all subdirectories and their files will also be watched
   * @param {boolean} [opts.persistent=false] If true, If true, prevents the Node.js process from ending while
   * the client is monitoring for file changes.
   */
  constructor(opts) {
    super()
    const defaults = {
      host: 'localhost',
      port: DEFAULT_PORT,
      watch: process.cwd(),
      recursive: true,
      persistent: false
    }
    this._conn = {end: () => {}}
    this._opts = Object.assign({}, defaults, opts || {})
    this._connected = false
  }

  get connected() {
    return this._connected
  }

  /**
   * Connects to the FS-EventBridge server and starts listening for and forwarding filesystem events.
   * @returns {Promise} Resolves upon successful connection
   */
  start() {
    if (this._connected) return Promise.resolve()
    return this._connect().then(() => {
      this._connected = true
      const watchOpts = {
        persistent: this._opts.persistent,
        recursive: this._opts.recursive
      }
      fs.watch(this._opts.watch, watchOpts, (type, file) => {
        this.emit('changed', file)
        fs.stat(file, (err, stat) => {
          if (err) return this.emit('file_error', err)
          const abs = path.join(process.cwd(), file)
          const mtimeSecs = Math.floor(stat.mtime.getTime() / 1000000)
          this._conn.write(`CHANGE ${abs} ${mtimeSecs}\n`)
        })
      })
    })
  }

  /**
   * Ends the connection to the FS-EventBridge server and stops listening for filesystem events.
   */
  stop() {
    if (this._connected) {
      this._conn.end()
      fs.unwatchFile(this._opts.watch)
      this._connected = false
    }
  }

  _handleLine(line) {
    this.emit('response', line)
    const errMatch = line.match(errRegex)
    if (errMatch) this.emit('command_error', new Error(errMatch[1]))
  }

  _connect() {
    let strBuf = ''
    return new Promise((resolve, reject) => {
      this._conn = net.connect(this._opts.port, this._opts.host, err => {
        if (err) reject(err)
        else resolve()
      })
      this._conn.once('end', () => this.stop())
      this._conn.once('error', (e) => {
        this.stop()
        this.emit('connection_error', e)
      })
      this._conn.on('data', (buf) => {
        strBuf += buf.toString()
        const lines = strBuf.split('\n')
        strBuf = lines.pop()
        lines.forEach(line => this._handleLine(line))
      })
    })
  }
}

module.exports = FSEventBridgeClient
