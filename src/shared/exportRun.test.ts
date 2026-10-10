import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { exportRunText } from './exportRun'

describe('exportRunText', () => {
  it('keeps every run line instead of the last few', () => {
    const lines = Array.from({ length: 24 }, (_, i) => `line ${i + 1} ${'x'.repeat(40)}`)
    const text = exportRunText(lines.join('\n'))
    assert.equal(text.split('\n').length, 24)
    assert.equal(text.startsWith('line 1 '), true)
    assert.equal(text.endsWith('x'), true)
    assert.equal(text.length > 360, true)
  })

  it('drops the idle ready banner and keeps the process-end line', () => {
    const text = exportRunText(
      'Jcat 已就绪。打开一个 Java 文件夹即可编译运行。\nhello\n\n进程结束，退出码 0\n'
    )
    assert.equal(text.includes('已就绪'), false)
    assert.equal(text, 'hello\n\n进程结束，退出码 0')
  })

  it('drops English and Korean ready banners', () => {
    assert.equal(exportRunText('Jcat is ready. Open a Java folder to compile and run.\nok'), 'ok')
    assert.equal(exportRunText('Jcat 준비됨. Java 폴더를 열어 컴파일하고 실행하세요.\nok'), 'ok')
  })
})
