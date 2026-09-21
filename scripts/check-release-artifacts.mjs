import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const version = createRequire(import.meta.url)('../package.json').version
const files = readdirSync('dist')
const need = [
  `jcat-${version}.dmg`,
  `jcat-${version}-x64-setup.exe`,
  `jcat-${version}-arm64-setup.exe`,
  `jcat-${version}-setup.exe`
]
const missing = need.filter((name) => !files.includes(name))
if (missing.length) {
  console.error(`missing release artifacts for ${version}:`, missing)
  console.error('found:', files)
  process.exit(1)
}
console.log('release artifacts ok:', need.join(', '))
