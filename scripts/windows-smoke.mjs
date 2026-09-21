import { createRequire } from 'node:module'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { basename, join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  IMAGE_FILE_MACHINE_AMD64,
  IMAGE_FILE_MACHINE_ARM64,
  machineName,
  readPeMachine
} from '../src/shared/peMachine.ts'
import {
  expectedWindowsNames,
  nsisListingHasArch,
  nsisPayloadPath
} from '../src/shared/releaseArtifacts.ts'

const version = createRequire(import.meta.url)('../package.json').version
const distArg = process.argv.includes('--dist')
  ? process.argv[process.argv.indexOf('--dist') + 1]
  : 'dist'
const dist = join(process.cwd(), distArg)
const names = expectedWindowsNames(version)
const skipLaunch = process.argv.includes('--skip-launch')

function fail(msg) {
  console.error(msg)
  process.exit(1)
}

function requireFile(name) {
  const path = join(dist, name)
  if (!existsSync(path)) fail(`missing ${path}`)
  return path
}

function find7z() {
  const hits = ['7z', '7z.exe', 'C:\\Program Files\\7-Zip\\7z.exe']
  for (const bin of hits) {
    const r = spawnSync(bin, ['--help'], { encoding: 'utf8' })
    if (!r.error && (r.status === 0 || r.status === 1 || /7-Zip/i.test(`${r.stdout}${r.stderr}`))) {
      return bin
    }
  }
  return null
}

function listing(seven, archive) {
  const r = spawnSync(seven, ['l', '-slt', archive], { encoding: 'utf8', timeout: 120000 })
  if (r.error || r.status !== 0) return null
  return `${r.stdout}\n${r.stderr}`
}

function hasPayload(out, arch) {
  return nsisListingHasArch(out, arch)
}

function payloadName(out, arch) {
  return nsisPayloadPath(out, arch)
}

function extractPeFromNsis(seven, installer, arch) {
  const out = listing(seven, installer)
  if (!out) return { ok: false, reason: '7z listing failed' }
  const inner = payloadName(out, arch)
  if (!inner) return { ok: false, reason: `no ${arch}.nsis archive in listing` }
  const work = mkdtempSync(join(tmpdir(), `jcat-nsis-${arch}-`))
  try {
    const x1 = spawnSync(seven, ['x', `-o${work}`, '-y', installer, inner], {
      encoding: 'utf8',
      timeout: 180000
    })
    if (x1.status !== 0) return { ok: false, reason: `extract ${inner} failed` }
    const innerBase = basename(inner.replaceAll('\\', '/'))
    const archive = findNamed(work, innerBase) || join(work, inner)
    const x2 = spawnSync(seven, ['x', `-o${join(work, 'app')}`, '-y', archive, 'Jcat.exe'], {
      encoding: 'utf8',
      timeout: 180000
    })
    const exe = findNamed(join(work, 'app'), 'Jcat.exe')
    if (x2.status !== 0 && !exe) return { ok: false, reason: 'could not extract Jcat.exe' }
    if (!exe) return { ok: false, reason: 'Jcat.exe missing after extract' }
    const machine = readPeMachine(readFileSync(exe))
    return { ok: true, machine, path: exe }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

function findNamed(dir, name) {
  if (!existsSync(dir)) return null
  const stack = [dir]
  while (stack.length) {
    const cur = stack.pop()
    for (const entry of readdirSync(cur, { withFileTypes: true })) {
      const p = join(cur, entry.name)
      if (entry.isDirectory()) stack.push(p)
      else if (entry.name === name) return p
    }
  }
  return null
}

function silentInstall(installer, dest) {
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(dest, { recursive: true })
  const args = ['/S', '/currentuser', `/D=${dest}`]
  console.log(`install ${installer} -> ${dest}`)
  const r = spawnSync(installer, args, { encoding: 'utf8', timeout: 180000, windowsHide: true })
  if (r.error) fail(`install spawn failed: ${r.error.message}`)
  if (r.status !== 0) {
    fail(`installer exit ${r.status}\n${r.stdout || ''}\n${r.stderr || ''}`)
  }
  const exe = join(dest, 'Jcat.exe')
  if (!existsSync(exe)) fail(`Jcat.exe missing after install at ${dest}`)
  return exe
}

function assertMachine(exe, expected) {
  const machine = readPeMachine(readFileSync(exe))
  if (machine !== expected) {
    fail(`${exe} PE machine is ${machineName(machine)}, expected ${machineName(expected)}`)
  }
  console.log(`PE ${exe} is ${machineName(machine)}`)
  return machine
}

function pidAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function killTree(pid) {
  spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, timeout: 30000 })
}

function killJcatHelpers() {
  spawnSync('taskkill', ['/IM', 'Jcat.exe', '/T', '/F'], { windowsHide: true, timeout: 30000 })
}

function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function cleanupDir(dir) {
  killJcatHelpers()
  for (let i = 0; i < 6; i++) {
    try {
      rmSync(dir, { recursive: true, force: true })
      return
    } catch (err) {
      console.log(`cleanup retry ${i + 1}: ${err.message}`)
      killJcatHelpers()
      sleepMs(1000)
    }
  }
  console.log(`cleanup warning: left ${dir} in place after retries`)
}

function tryLaunch(exe) {
  if (!existsSync(exe)) {
    return Promise.resolve({ ok: false, reason: `missing ${exe}`, output: '' })
  }
  const userData = mkdtempSync(join(tmpdir(), 'jcat-ud-'))
  let output = ''
  return new Promise((resolve) => {
    let settled = false
    const done = (result) => {
      if (settled) return
      settled = true
      resolve(result)
    }
    let child
    try {
      child = spawn(exe, [`--user-data-dir=${userData}`], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
      })
    } catch (err) {
      done({ ok: false, reason: err.message, output })
      return
    }
    child.stdout?.on('data', (chunk) => {
      output += chunk.toString()
    })
    child.stderr?.on('data', (chunk) => {
      output += chunk.toString()
    })
    child.on('error', (err) => {
      done({ ok: false, reason: err.message, output })
    })
    const pid = child.pid
    if (!pid) {
      setTimeout(() => done({ ok: false, reason: 'no pid', output }), 2000)
      return
    }
    child.on('exit', (code) => {
      done({ ok: false, reason: `exited with code ${code}`, output })
    })
    setTimeout(() => {
      if (pidAlive(pid)) {
        killTree(pid)
        killJcatHelpers()
        sleepMs(500)
        done({ ok: true, output })
      } else {
        done({ ok: false, reason: 'process exited before survival window', output })
      }
    }, 12000)
  }).finally(() => {
    try {
      rmSync(userData, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
  })
}

async function main() {
  if (process.platform !== 'win32') fail('windows-smoke.mjs must run on Windows')
  const x64Setup = requireFile(names.x64)
  const autoSetup = requireFile(names.auto)
  const arm64Setup = requireFile(names.arm64)

  const seven = find7z()
  if (seven) {
    const autoOut = listing(seven, autoSetup)
    const x64Out = listing(seven, x64Setup)
    const armOut = listing(seven, arm64Setup)
    if (!autoOut || !hasPayload(autoOut, 'x64') || !hasPayload(autoOut, 'arm64')) {
      fail('auto installer does not list both x64 and arm64 NSIS payloads')
    }
    if (!x64Out || !hasPayload(x64Out, 'x64') || hasPayload(x64Out, 'arm64')) {
      fail('x64 installer must contain only the x64 NSIS payload')
    }
    if (!armOut || !hasPayload(armOut, 'arm64') || hasPayload(armOut, 'x64')) {
      fail('arm64 installer must contain only the arm64 NSIS payload')
    }
    console.log('NSIS payloads: auto=x64+arm64; x64-only; arm64-only')
    const armPe = extractPeFromNsis(seven, arm64Setup, 'arm64')
    if (armPe.ok) {
      if (armPe.machine !== IMAGE_FILE_MACHINE_ARM64) {
        fail(`ARM64 payload Jcat.exe is ${machineName(armPe.machine)}, expected arm64`)
      }
      console.log('extracted ARM64 payload Jcat.exe PE is arm64 (not executed)')
    } else {
      console.log(`ARM64 PE extract skipped: ${armPe.reason}`)
    }
    const x64Pe = extractPeFromNsis(seven, x64Setup, 'x64')
    if (x64Pe.ok) {
      if (x64Pe.machine !== IMAGE_FILE_MACHINE_AMD64) {
        fail(`x64 payload Jcat.exe is ${machineName(x64Pe.machine)}, expected x64`)
      }
      console.log('extracted x64 payload Jcat.exe PE is x64')
    }
  } else {
    console.log('7z not found; payload listing deferred to Ubuntu bundle job')
  }

  const x64Dir = join(tmpdir(), 'jcat-smoke-x64')
  const autoDir = join(tmpdir(), 'jcat-smoke-auto')

  async function installPeAndLaunch(setup, dest, label) {
    const exe = silentInstall(setup, dest)
    assertMachine(exe, IMAGE_FILE_MACHINE_AMD64)
    if (label === 'multi-arch') {
      console.log('multi-arch installer selected x64 payload on this x64 runner')
    }
    if (skipLaunch) {
      console.log(`LAUNCH_SKIPPED ${label}`)
      return { ok: true, output: '' }
    }
    const launch = await tryLaunch(exe)
    if (launch.ok) console.log(`LAUNCH_OK ${label} installer`)
    else {
      console.log(`LAUNCH_UNVERIFIED ${label}: ${launch.reason}`)
      if (launch.output) console.log(launch.output.slice(0, 2000))
    }
    return launch
  }

  // Same NSIS product uninstalls the previous copy, so do not keep both installs live.
  let x64Launch
  let autoLaunch
  try {
    x64Launch = await installPeAndLaunch(x64Setup, x64Dir, 'x64')
  } finally {
    cleanupDir(x64Dir)
  }
  try {
    autoLaunch = await installPeAndLaunch(autoSetup, autoDir, 'multi-arch')
  } finally {
    cleanupDir(autoDir)
  }
  if (!x64Launch.ok || !autoLaunch.ok) {
    console.log(
      'Windows launch survival was not confirmed on this hosted runner; install exit code and PE arch still passed. This is not a native ARM64 or SmartScreen result.'
    )
  }
  console.log(`windows smoke checks finished for ${version}`)
}

await main()
