import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { projectLayout, projectOf } from './projectLayout'

describe('projectLayout', () => {
  it('keeps a lab folder as one project so its files compile together', () => {
    const layout = projectLayout([
      'Main11.java',
      'MovieTicketPricingSystem.java',
      '10.9lab/lab1009.java',
      '10.9lab/Main.java'
    ])
    assert.equal(layout.mode, 'single')
    assert.equal(projectOf(layout, '10.9lab/lab1009.java'), '')
  })

  it('splits a course folder into one project per child folder', () => {
    const layout = projectLayout([
      'hello/Hello.java',
      'hello/Main.java',
      'scanner-lab-6/Main11.java',
      'scanner-lab-6/10.9lab/lab1009.java',
      'frq-class/Pet.java'
    ])
    assert.equal(layout.mode, 'workspace')
    assert.deepEqual(layout.projects, ['frq-class', 'hello', 'scanner-lab-6'])
    assert.equal(projectOf(layout, 'hello/Main.java'), 'hello')
    assert.equal(projectOf(layout, 'scanner-lab-6/10.9lab/lab1009.java'), 'scanner-lab-6')
    assert.equal(projectOf(layout, 'notes.java'), '')
  })

  it('does not split a Maven project or a single source tree', () => {
    assert.equal(
      projectLayout(['src/main/java/App.java', 'src/main/java/Util.java'], true).mode,
      'single'
    )
    assert.equal(projectLayout(['src/main/java/App.java']).mode, 'single')
    assert.equal(projectLayout(['Hello.java', 'Main.java']).mode, 'single')
  })
})
