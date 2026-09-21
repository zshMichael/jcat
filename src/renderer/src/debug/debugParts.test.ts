import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { dedentCode, splitDebugParts, startNextDebugTurn, splitDebugTurns } from './debugParts'

describe('debugTurns', () => {
  it('does not insert a divider before the first reply', () => {
    assert.equal(startNextDebugTurn(''), '')
    assert.equal(startNextDebugTurn('   '), '')
  })

  it('separates a later analyze click from the previous reply', () => {
    const next = startNextDebugTurn('first reply')
    assert.equal(splitDebugTurns(next).length, 2)
    assert.equal(splitDebugTurns(next)[0], 'first reply')
    assert.equal(splitDebugTurns(next)[1], '')
  })
})

describe('dedentCode', () => {
  it('pulls a nested snippet flush left and keeps relative indent', () => {
    const raw = '        System.out.println("a");\n            input.close();\n'
    assert.equal(dedentCode(raw), 'System.out.println("a");\n    input.close();')
  })

  it('leaves already-flush code alone', () => {
    assert.equal(dedentCode('class A {}\n'), 'class A {}')
  })

  it('dedents fenced java in a debug reply', () => {
    const parts = splitDebugParts('```java\n        System.out.println(1);\n        input.close();\n```')
    const java = parts.find((part) => part.kind === 'java')
    assert.equal(java?.kind, 'java')
    if (java?.kind === 'java') {
      assert.equal(java.code, 'System.out.println(1);\ninput.close();')
    }
  })
})
