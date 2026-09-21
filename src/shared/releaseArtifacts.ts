import { createHash } from 'node:crypto'

export type ArtifactFile = {
  name: string
  size: number
  sha256: string
}

export function expectedWindowsNames(version: string): {
  x64: string
  arm64: string
  auto: string
} {
  return {
    x64: `jcat-${version}-x64-setup.exe`,
    arm64: `jcat-${version}-arm64-setup.exe`,
    auto: `jcat-${version}-setup.exe`
  }
}

export function sha256Buffer(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex')
}

/** Fail if the un-arched setup is a copy of either single-arch installer. */
export function assertMultiArchWindows(version: string, files: ArtifactFile[]): void {
  const names = expectedWindowsNames(version)
  const byName = new Map(files.map((f) => [f.name, f]))
  const x64 = byName.get(names.x64)
  const arm64 = byName.get(names.arm64)
  const auto = byName.get(names.auto)
  if (!x64) throw new Error(`missing ${names.x64}`)
  if (!arm64) throw new Error(`missing ${names.arm64}`)
  if (!auto) throw new Error(`missing ${names.auto}`)
  if (x64.sha256 === arm64.sha256) throw new Error('x64 and arm64 installers have the same SHA-256')
  if (auto.sha256 === x64.sha256)
    throw new Error('auto installer SHA-256 matches the x64 installer (copy is not allowed)')
  if (auto.sha256 === arm64.sha256)
    throw new Error('auto installer SHA-256 matches the arm64 installer (copy is not allowed)')
  const larger = Math.max(x64.size, arm64.size)
  if (auto.size < Math.floor(larger * 1.3)) {
    throw new Error(
      `auto installer (${auto.size}) is not clearly larger than a single-arch package (${larger}); expected a real multi-arch NSIS`
    )
  }
}

export function assertMacDmg(version: string, files: ArtifactFile[]): void {
  const name = `jcat-${version}.dmg`
  const dmg = files.find((f) => f.name === name)
  if (!dmg) throw new Error(`missing ${name}`)
  if (dmg.size < 1_000_000) throw new Error(`${name} is too small`)
}

/** True when a `7z l -slt` listing of an NSIS installer contains that arch's app payload. */
export function nsisListingHasArch(listing: string, arch: 'x64' | 'arm64'): boolean {
  if (arch === 'arm64') return /arm64\.nsis\.(7z|zip)|app-arm64\.7z/i.test(listing)
  return /x64\.nsis\.(7z|zip)|[/\\]app-64\.7z/i.test(listing)
}

export function nsisPayloadPath(listing: string, arch: 'x64' | 'arm64'): string | null {
  const re =
    arch === 'arm64'
      ? /Path = ([^\r\n]*(?:app-arm64\.7z|arm64\.nsis\.(?:7z|zip)))/i
      : /Path = ([^\r\n]*(?:[/\\]app-64\.7z|x64\.nsis\.(?:7z|zip)))/i
  const match = listing.match(re)
  return match ? match[1].trim() : null
}
