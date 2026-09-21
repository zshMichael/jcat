import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = createRequire(import.meta.url)('../package.json')
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'))
const version = pkg.version
const tagArg = process.argv.includes('--tag') ? process.argv[process.argv.indexOf('--tag') + 1] : ''

function fail(msg) {
  console.error(msg)
  process.exit(1)
}

if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version))
  fail(`bad package.json version: ${version}`)
if (lock.version !== version) fail(`package-lock.json version ${lock.version} != ${version}`)
if (lock.packages?.['']?.version && lock.packages[''].version !== version) {
  fail(`package-lock packages[""].version mismatch`)
}
if (!String(pkg.devDependencies?.tsx || '').length)
  fail('tsx missing from package.json devDependencies')
if (!lock.packages?.['node_modules/tsx']) fail('tsx missing from package-lock.json')

const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
if (!changelog.includes(`## ${version}`)) fail(`CHANGELOG.md missing ## ${version}`)

const notesPath = join(root, `docs/RELEASE-NOTES-${version}.md`)
if (!existsSync(notesPath)) fail(`missing ${notesPath}`)
const notes = readFileSync(notesPath, 'utf8')
if (!notes.includes(version)) fail(`release notes do not mention ${version}`)

const readme = readFileSync(join(root, 'README.md'), 'utf8')
for (const name of [
  `jcat-${version}.dmg`,
  `jcat-${version}-x64-setup.exe`,
  `jcat-${version}-arm64-setup.exe`,
  `jcat-${version}-setup.exe`
]) {
  if (!readme.includes(name)) fail(`README.md missing ${name}`)
}

const builder = readFileSync(join(root, 'electron-builder.yml'), 'utf8')
if (!builder.includes('artifactName: ${name}-${version}-${arch}-setup.${ext}')) {
  fail('electron-builder.yml NSIS artifactName must include ${arch}')
}
if (!builder.includes('buildUniversalInstaller: true')) {
  fail('electron-builder.yml must set nsis.buildUniversalInstaller: true')
}

const artifacts = readFileSync(join(root, 'scripts/check-release-artifacts.mjs'), 'utf8')
if (!artifacts.includes('assertMultiArchWindows')) {
  fail('artifact check script must assert multi-arch Windows installers')
}

if (tagArg) {
  const tag = tagArg.startsWith('v') ? tagArg.slice(1) : tagArg
  if (tag !== version) fail(`tag ${tagArg} does not match package.json ${version}`)
}

console.log(`release version ${version} is consistent`)
