#!/usr/bin/env node
// NOTE: Runs the npm scripts named in argv concurrently, streaming each task's
//       output prefixed with its name, and exits non-zero if any task fails.
//       Used by each package's `check` so the independent format/lint/build/test
//       steps overlap instead of running end to end.
import { spawn } from 'node:child_process'

const tasks = process.argv.slice(2)
if (tasks.length === 0) {
  console.error('run-parallel: no tasks given')
  process.exit(2)
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function runTask(task) {
  return new Promise((resolve) => {
    const child = spawn(npm, ['run', task], { stdio: ['ignore', 'pipe', 'pipe'] })
    const relay = (stream, sink) => {
      let carry = ''
      stream.setEncoding('utf8')
      stream.on('data', (chunk) => {
        const lines = (carry + chunk).split('\n')
        carry = lines.pop() ?? ''
        for (const line of lines) sink.write(`[${task}] ${line}\n`)
      })
      stream.on('end', () => {
        if (carry !== '') sink.write(`[${task}] ${carry}\n`)
      })
    }
    relay(child.stdout, process.stdout)
    relay(child.stderr, process.stderr)
    child.on('close', (code) => resolve({ task, code: code ?? 1 }))
  })
}

const results = await Promise.all(tasks.map(runTask))
const failed = results.filter((result) => result.code !== 0)
for (const result of failed) console.error(`[run-parallel] ${result.task} failed with exit ${result.code}`)
process.exit(failed.length === 0 ? 0 : 1)
