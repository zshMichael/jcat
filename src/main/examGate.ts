let examLocked = false

export function setExamLocked(on: boolean): void {
  examLocked = on
}

export function isExamLocked(): boolean {
  return examLocked
}
