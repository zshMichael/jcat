import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { classFileAction, publicClassInfo, topLevelTypes } from './javaOutline'

describe('topLevelTypes', () => {
  it('ignores a nested public class', () => {
    const types = topLevelTypes(`public class Lab {\n  public class Node {\n  }\n}\n`)
    assert.deepEqual(
      types.map((type) => type.name),
      ['Lab']
    )
    assert.equal(publicClassInfo(`class Lab {\n  public class Node {}\n}\n`), null)
  })

  it('sees a package-private helper beside the public type', () => {
    const types = topLevelTypes(`public class Lab {\n}\nclass Helper {\n}\n`)
    assert.deepEqual(
      types.map((type) => [type.name, type.isPublic]),
      [
        ['Lab', true],
        ['Helper', false]
      ]
    )
  })

  it('does not treat a class mentioned in a string, comment, or text block as a type', () => {
    const source = [
      'public class Real {',
      '  String s = "public class Fake {";',
      "  char brace = '{';",
      '  // public class Comment',
      '  /* public class Block */',
      '  String block = """',
      '    public class Text {',
      '  """;',
      '}',
      ''
    ].join('\n')
    assert.deepEqual(
      topLevelTypes(source).map((type) => type.name),
      ['Real']
    )
  })
})

describe('classFileAction', () => {
  it('renames a file that holds one public type', () => {
    const action = classFileAction('public class Movie {\n}\n', 'Main')
    assert.equal(action.kind, 'rename')
    if (action.kind === 'rename') assert.equal(action.name, 'Movie')
  })

  it('keeps the file when that one public type already matches', () => {
    assert.equal(classFileAction('public interface Score {\n}\n', 'Score').kind, 'keep')
  })

  it('does not follow a class once the file has several top-level types', () => {
    const action = classFileAction('public class Movie {\n}\nclass Ticket {\n}\n', 'Lab')
    assert.equal(action.kind, 'error')
    if (action.kind === 'error') {
      assert.equal(action.reason, 'mismatch')
      assert.equal(action.name, 'Movie')
    }
    assert.equal(classFileAction('public class Lab {\n}\nclass Ticket {\n}\n', 'Lab').kind, 'keep')
  })

  it('does not follow a nested class when the outer type is package-private', () => {
    assert.equal(classFileAction('class Lab {\n  public class Node {}\n}\n', 'Lab').kind, 'keep')
  })

  it('keeps the file name when two types are public', () => {
    const action = classFileAction('public class A {\n}\npublic class B {\n}\n', 'A')
    assert.equal(action.kind, 'error')
    if (action.kind === 'error') {
      assert.equal(action.reason, 'many')
      assert.equal(action.name, 'B')
    }
  })

  it('leaves a file of only package-private types alone', () => {
    assert.equal(classFileAction('class A {}\nclass B {}\n', 'Notes').kind, 'keep')
  })
})
