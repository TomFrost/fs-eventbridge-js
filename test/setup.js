/*
 * Copyright (c) 2016 TechnologyAdvice, LLC
 */

'use strict'

// Unit/Integration tests
const path = require('path')
const chai = require('chai')
const mod = require('module')
global.should = chai.should()

// importing files with ../../../../../.. makes my brain hurt
process.env.NODE_PATH = path.join(__dirname, '..') + path.delimiter + (process.env.NODE_PATH || '')
mod._initPaths()
