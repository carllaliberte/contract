import fs from 'node:fs'
import path from 'node:path'
import solc from 'solc'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const sourcePath = path.resolve(rootDir, '..', 'meta.sol')
const outputPath = path.resolve(rootDir, 'src', 'contracts', 'META.json')

const source = fs.readFileSync(sourcePath, 'utf8')
const input = {
  language: 'Solidity',
  sources: { 'meta.sol': { content: source } },
  settings: { outputSelection: { '*': { '*': ['abi'] } } },
}

const output = JSON.parse(solc.compile(JSON.stringify(input)))
if (output.errors) {
  const fatal = output.errors.filter((error) => error.severity === 'error')
  if (fatal.length > 0) {
    console.error(fatal)
    process.exit(1)
  }
}

const abi = output.contracts['meta.sol'].META.abi
fs.writeFileSync(
  outputPath,
  JSON.stringify({ contractName: 'META', abi, sourceFile: 'meta.sol' }, null, 2),
)
console.log(`Wrote ABI with ${abi.filter((item) => item.type === 'function').length} functions to ${outputPath}`)
