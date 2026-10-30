import net from 'node:net'
import { spawn } from 'node:child_process'

const children = []
let stopping = false

function portIsOpen(port) {
  return Promise.any(['127.0.0.1', '::1'].map((host) => new Promise((resolve, reject) => {
    const socket = net.connect({ host, port })
    socket.setTimeout(500)
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('timeout', () => { socket.destroy(); reject(new Error('timeout')) })
    socket.once('error', reject)
  }))).catch(() => false)
}

function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill('SIGTERM')
  setTimeout(() => process.exit(code), 300)
}

function start(script) {
  const windows = process.platform === 'win32'
  const command = windows ? (process.env.ComSpec || 'cmd.exe') : 'npm'
  const args = windows ? ['/d', '/s', '/c', `npm run ${script}`] : ['run', script]
  const child = spawn(command, args, { stdio: 'inherit' })
  children.push(child)
  child.once('error', (error) => {
    console.error(`Could not start ${script}: ${error.message}`)
    stop(1)
  })
  child.once('exit', (code) => {
    if (!stopping && code !== 0) {
      console.error(`${script} stopped with exit code ${code ?? 'unknown'}.`)
      stop(code || 1)
    }
  })
}

process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))

if (await portIsOpen(4000)) {
  console.log('API is already responding on port 4000; reusing it.')
} else {
  start('dev:server')
}
if (await portIsOpen(5173)) {
  console.log('A development server is already using port 5173; reusing it.')
} else {
  start('dev:client')
}
