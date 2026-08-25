#!/usr/bin/env node
'use strict'
const fs = require('node:fs')
const path = require('node:path')

const raw = process.env.META_PLAY_CONFIG
if (!raw || !raw.trim()) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, 'loaded=false\n')
  process.exit(0)
}

const c = JSON.parse(raw)
const root = process.cwd()
const keystorePath = path.join(root, 'google-app/android/release.keystore')
fs.writeFileSync(keystorePath, Buffer.from(c.keystoreBase64, 'base64'))

const playJson =
  typeof c.playServiceAccountJson === 'string'
    ? c.playServiceAccountJson
    : JSON.stringify(c.playServiceAccountJson)

const envFile = process.env.GITHUB_ENV
if (envFile) {
  fs.appendFileSync(envFile, `ANDROID_KEYSTORE_PASSWORD=${c.keystorePassword}\n`)
  fs.appendFileSync(envFile, `ANDROID_KEY_ALIAS=${c.keyAlias || 'meta-upload'}\n`)
  fs.appendFileSync(envFile, `ANDROID_KEY_PASSWORD=${c.keyPassword}\n`)
  fs.appendFileSync(envFile, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=${playJson}\n`)
}

fs.appendFileSync(process.env.GITHUB_OUTPUT, 'loaded=true\n')
console.log('META_PLAY_CONFIG loaded')
