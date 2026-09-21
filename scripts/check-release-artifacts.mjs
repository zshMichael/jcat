import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import {
  assertMacDmg,
  assertMultiArchWindows,
  expectedWindowsNames
} from '../src/shared/releaseArtifacts.ts'

const version = createRequire(import.meta.url)('../package.json').version
const dist = join(process.cwd(), 'dist')
const windowsOnly = process.argv.includes('--windows')
const macOnly = process.argv.includes('--mac')

function listFiles() {
  if (!existsSync(dist)) throw new Error('dist/ is missing')
  return readdirSync(dist)
    .filter((name) => name.endsWith('.exe') || name.endsWith('.dmg') || name === 'SHA256SUMS.txt')
    .map((name) => {
      const buf = readFileSync(join(dist, name))
      return {
        name,
        size: statSync(join(dist, name)).size,
        sha256: createHash('sha256').update(buf).digest('hex'),
        buf
      }
    })
}

function listing(name) {
  const seven = spawnSync('7z', ['l', '-slt', join(dist, name)], { encoding: 'utf8' })
  if (seven.error || seven.status !== 0) return null
  return `${seven.stdout}\n${seven.stderr}`
}

function hasPayload(out, arch) {
  return new RegExp(`${arch}\\.nsis\\.(7z|zip)`, 'i').test(out)
}

function requireNsisPayloads(names) {
  const autoOut = listing(names.auto)
  if (!autoOut) {
    console.log('7z not available; skipping NSIS payload listing (hash/size already checked)')
    return
  }
  if (!hasPayload(autoOut, 'x64') || !hasPayload(autoOut, 'arm64')) {
    console.error(autoOut)
    throw new Error(`${names.auto} does not list both x64 and arm64 NSIS payloads`)
  }
  const x64Out = listing(names.x64)
  const armOut = listing(names.arm64)
  if (x64Out) {
    if (!hasPayload(x64Out, 'x64') || hasPayload(x64Out, 'arm64')) {
      throw new Error(`${names.x64} must contain only the x64 NSIS payload`)
    }
  }
  if (armOut) {
    if (!hasPayload(armOut, 'arm64') || hasPayload(armOut, 'x64')) {
      throw new Error(`${names.arm64} must contain only the arm64 NSIS payload`)
    }
  }
  console.log(
    'NSIS payloads: auto=x64+arm64; x64-only and arm64-only installers checked when listed'
  )
}

const files = listFiles()
console.log('artifacts:', files.map((f) => `${f.name} ${f.size} ${f.sha256}`).join('\n'))

if (!macOnly) {
  const names = expectedWindowsNames(version)
  assertMultiArchWindows(
    version,
    files.map(({ name, size, sha256 }) => ({ name, size, sha256 }))
  )
  requireNsisPayloads(names)
  console.log(
    'windows multi-arch installers ok (distinct SHA-256; auto larger than either single-arch)'
  )
}

if (!windowsOnly) {
  assertMacDmg(
    version,
    files.map(({ name, size, sha256 }) => ({ name, size, sha256 }))
  )
  console.log('mac dmg ok')
}

console.log(`release artifacts ok for ${version}`)
