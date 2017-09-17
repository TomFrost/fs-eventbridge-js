/*
 * Copyright (c) 2017 Tom Shawver
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
   * @param {string} [opts.host="localhost"] The hostname or IP address with which to connect
   * @param {number} [opts.port=65056] The port with which to connect
   * @param {string} [opts.watch=process.cwd()] The directory to be watched for changes
   * @param {boolean} [opts.recursive=true] If true, all subdirectories and their files will also be watched
   * @param {boolean} [opts.persistent=false] If true, If true, prevents the Node.js process from ending while
   * the client is monitoring for file changes.
   * @param {number} [opts.ignoreMs=250] The number of milliseconds during which any further change notifications
   * for a given file are ignored. This helps reduce load for rapidly-changing files, as well as prevents an infinite
   * loop of reporting changes that were due to the last reported change.
   * @param {boolean} [opts.ignoreHidden=true] Ignores file changes within hidden files and folders if true
   */
  constructor(opts) {
    super()
    const defaults = {
      host: 'localhost',
      port: DEFAULT_PORT,
      watch: process.cwd(),
      recursive: true,
      persistent: false,
      ignoreMs: 250,
      ignoreHidden: true
    }
    this._conn = {end: () => {}}
    this._opts = Object.assign({}, defaults, opts || {})
    this._connected = false
    this._ignore = {}
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
        if (this._ignore[file] || FSEventBridgeClient.isHidden(file)) return undefined
        this._ignore[file] = true
        setTimeout(() => { delete this._ignore[file] }, this._opts.ignoreMs)
        this.emit('changed', file)
        const abs = path.join(process.cwd(), file)
        this._conn.write(`CHANGE ${abs}\n`)
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
      this._conn = net.connect(this._opts.port, this._opts.host, resolve)
      this._conn.once('end', () => this.stop())
      this._conn.once('error', (e) => {
        this.stop()
        this.emit('connection_error', e)
        reject(e)
      })
      this._conn.on('data', (buf) => {
        strBuf += buf.toString()
        const lines = strBuf.split('\n')
        strBuf = lines.pop()
        lines.forEach(line => this._handleLine(line))
      })
    })
  }

  static isHidden(file) {
    return file[0] === '.' || file.includes(`${path.sep}.`)
  }
}

module.exports = FSEventBridgeClient
