/** Local workbench routes exercised over a real HTTP connection and real files. */
import { createServer, request, type Server } from 'node:http'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { handleAipmRequest } from '../src/aipm-products.ts'
import { SiminFiles } from '../src/simin-files.ts'
import { SiminProposals } from '../src/simin-proposals.ts'

let root: string
let origin: string
let server: Server
let files: SiminFiles
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'zhang-workbench-http-'))
  files = new SiminFiles(root)
  const proposals = new SiminProposals(files)
  server = createServer((req, res) => {
    void handleAipmRequest(req, res, { files, proposals }).catch(() => { res.writeHead(500); res.end() })
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('No test port')
  origin = `http://127.0.0.1:${address.port}`
})
afterEach(async () => {
  if (server?.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  if (root) await rm(root, { recursive: true, force: true })
})

it('creates projects and saves a confirmed document, while refusing a stale version', async () => {
  const post = (path: string, data: object) => fetch(origin + path, {
    method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(data),
  })
  expect((await post('/aipm/projects', { name: '产品' })).status).toBe(201)
  expect((await post('/aipm/mutate', { op: 'save', project: '产品', file: '信息.md', markdown: '# 已确认', version: null })).status).toBe(200)
  expect((await files.read('产品', '信息.md')).markdown).toBe('# 已确认')
  expect((await post('/aipm/mutate', { op: 'save', project: '产品', file: '信息.md', markdown: '覆盖', version: null })).status).toBe(409)
  expect((await files.read('产品', '信息.md')).markdown).toBe('# 已确认')
})

it('refuses cross-origin writes and traversal without creating files', async () => {
  const response = await fetch(origin + '/aipm/projects', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://untrusted.example' },
    body: JSON.stringify({ name: '不应创建' }),
  })
  expect(response.status).toBe(403)
  const rebound = await new Promise<number>((resolve, reject) => {
    const req = request(origin + '/aipm/projects', { headers: { host: 'attacker.example' } }, (res) => {
      resolve(res.statusCode ?? 0)
      res.resume()
    })
    req.once('error', reject)
    req.end()
  })
  expect(rebound).toBe(403)
  expect(await files.projects()).toEqual([])
  const traversal = await fetch(origin + '/aipm/projects', {
    method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify({ name: '../escape' }),
  })
  expect(traversal.status).toBe(400)
  expect(await files.projects()).toEqual([])
})
