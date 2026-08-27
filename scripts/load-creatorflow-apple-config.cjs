#!/usr/bin/env node
'use strict'
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const raw = process.env.CREATORFLOW_APPLE_CONFIG
if (!raw || !raw.trim()) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, 'loaded=false\n')
  process.exit(0)
}

const c = JSON.parse(raw)
const envFile = process.env.GITHUB_ENV
if (!envFile) {
  throw new Error('GITHUB_ENV is required')
}

const appendEnv = (name, value) => {
  if (value === undefined || value === null || value === '') return
  fs.appendFileSync(envFile, `${name}<<EOF\n${value}\nEOF\n`)
}

appendEnv('APPLE_TEAM_ID', c.teamId)
appendEnv('APP_STORE_CONNECT_API_KEY_ID', c.apiKeyId)
appendEnv('APP_STORE_CONNECT_API_ISSUER_ID', c.apiIssuerId)
appendEnv('APP_STORE_CONNECT_API_KEY_BASE64', c.apiKeyBase64)
appendEnv('APPLE_CERTIFICATE_BASE64', c.certificateBase64)
appendEnv('APPLE_CERTIFICATE_PASSWORD', c.certificatePassword)
appendEnv('APPLE_PROVISION_PROFILE_BASE64', c.provisionProfileBase64)

if (c.apiKeyBase64 && c.apiKeyId) {
  const keyDir = path.join(os.homedir(), '.private_keys')
  fs.mkdirSync(keyDir, { recursive: true })
  const keyPath = path.join(keyDir, `AuthKey_${c.apiKeyId}.p8`)
  fs.writeFileSync(keyPath, Buffer.from(c.apiKeyBase64, 'base64'))
  appendEnv('APP_STORE_CONNECT_API_KEY_PATH', keyPath)
}

fs.appendFileSync(process.env.GITHUB_OUTPUT, 'loaded=true\n')
console.log('CREATORFLOW_APPLE_CONFIG loaded (values not logged)')
