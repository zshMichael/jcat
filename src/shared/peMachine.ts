/** PE Machine values from IMAGE_FILE_HEADER. */
export const IMAGE_FILE_MACHINE_AMD64 = 0x8664
export const IMAGE_FILE_MACHINE_ARM64 = 0xaa64

export function machineName(machine: number): string {
  if (machine === IMAGE_FILE_MACHINE_AMD64) return 'x64'
  if (machine === IMAGE_FILE_MACHINE_ARM64) return 'arm64'
  return `0x${machine.toString(16)}`
}

/** Read IMAGE_FILE_HEADER.Machine from an MZ/PE buffer. */
export function readPeMachine(buf: Buffer): number {
  if (buf.length < 64 || buf.toString('ascii', 0, 2) !== 'MZ') {
    throw new Error('not an MZ executable')
  }
  const peOff = buf.readUInt32LE(0x3c)
  if (peOff < 0 || peOff + 6 > buf.length) throw new Error('PE offset out of range')
  if (buf.toString('ascii', peOff, peOff + 4) !== 'PE\0\0') throw new Error('not a PE executable')
  return buf.readUInt16LE(peOff + 4)
}
