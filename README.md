# FS-EventBridge-JS [![Build Status](https://travis-ci.org/TechnologyAdvice/fs-eventbridge-js.svg?branch=master)](https://travis-ci.org/TechnologyAdvice/fs-eventbridge-js) [![Code Climate](https://codeclimate.com/github/TechnologyAdvice/fs-eventbridge-js/badges/gpa.svg)](https://codeclimate.com/github/TechnologyAdvice/fs-eventbridge-js)

[![Greenkeeper badge](https://badges.greenkeeper.io/TechnologyAdvice/fs-eventbridge-js.svg)](https://greenkeeper.io/)
An ultra-lightweight Node.js client for the [FS-EventBridge](https://github.com/TechnologyAdvice/fs_eventbridge) filesystem change notification forwarder.

## Installation

```
npm install --save fs-eventbridge-js
```

## Usage

```javascript
const FSEventBridgeClient = require('fs-eventbridge-js')

const bridge = new FSEventBridgeClient({host: '192.168.1.12'})
bridge.start().then(() => {
  // process.cwd() is currently being monitored for changes.
  // These filesystem events will be replicated in the target
  // environment, regardless of whether it uses fsevents, inotify, or
  // something else.
})
```

### API

#### `new FSEventBridgeClient(opts)`
Creates a new client. You'll need one of these per server you want to connect to, per top-level folder to be watched.

Options:

- **host** _(Default: localhost)_: The hostname or IP address with which to connect
- **port** _(Default: 65056)_: The port with which to connect
- **watch** _(Default: `process.cwd()`)_: The directory to be watched for changes
- **recursive** _(Default: true)_: If true, all subdirectories and their files will also be watched
- **persistent** _(Default: false)_: If true, prevents the Node.js process from ending while the client is monitoring for file changes.
- **ignoreMs** _(Default: 250)_: The number of milliseconds during which any further change notifications for a given file are ignored. This helps reduce load for rapidly-changing files, as well as prevents an infinite loop of reporting changes that were due to the last reported change.
- **ignoreHidden** _(Default: true)_: Ignores file changes within hidden files and folders if true

#### `client.start()`
Connects to the FS-EventBridge server and starts monitoring the filesystem for changes. Returns a Promise that resolves whenever a connection has been established, rejecting on connection failure. A resolved promise is returned if this is called during an active connection.

#### `client.stop()`
Stops watching for filesystem events and disconnects from the server. Has no effect if called when there is no active connection.

#### `client.connected`
A getter that provides `true` if there is an active connection.

### Events

#### `error_connection` Error
Emitted whenever the connection to the FS-EventBridge server has an unexpected issue. The server has been stopped when this event is fired, and `start()` can be called on the same instance if desired.

#### `error_command` Error
Emitted whenever the FS-EventBridge server communicates an error. These have no long-term impact on the client, but may signify that a file change event did not propagate to the remote operating system.

#### `error_file` Error
Emitted when the client cannot `stat` a changed file. These have no long-term impact on the client, but may signify that a file change event did not propagate to the remote operating system.

#### `response` string
Emitted when the server sends any response. This is useful for debug logging.

## License
FS-EventBridge-JS is distributed under the ISC license. See `LICENSE` file for details.

## Credits
FS-EventBridge-JS was created by Tom Shawver at [TechnologyAdvice](http://technologyadvice.com).
