#!/usr/bin/env node
import { execFile } from "node:child_process"
import { createHash, randomBytes } from "node:crypto"
import { readFile } from "node:fs/promises"
import { createServer } from "node:http"
import { resolve } from "node:path"
import { parseArgs } from "node:util"

const USAGE = "usage: serve.mjs <page.html> [--timeout 2h] [--no-open]"
const MAX_BODY_BYTES = 64 * 1024
const UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000 }

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    timeout: { type: "string", default: "2h" },
    "no-open": { type: "boolean", default: false },
  },
})

const timeoutMatch = /^(\d+)([smh])$/.exec(values.timeout)
if (positionals.length !== 1 || timeoutMatch == null) {
  console.error(USAGE)
  process.exit(64)
}

const file = resolve(positionals[0])
await readFile(file).catch(() => {
  console.error(`Cannot read ${file}`)
  process.exit(66)
})

const token = randomBytes(32).toString("hex")
const pagePath = `/${token}/`
const submitPath = `/${token}/submit`

const readBody = async (req) => {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) return null
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

const handleSubmit = async (req, res) => {
  if (Number(req.headers["content-length"] ?? 0) > MAX_BODY_BYTES) {
    res.writeHead(413).end("Too large")
    return
  }

  const body = await readBody(req)
  if (body == null) {
    res.writeHead(413, { connection: "close" }).end("Too large")
    return
  }

  const parsed = (() => {
    try {
      return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body))
    } catch {
      return null
    }
  })()
  if (typeof parsed?.text !== "string" || parsed.text.trim() === "") {
    res.writeHead(400).end("Expected JSON with a non-empty text field")
    return
  }

  clearTimeout(timer)
  process.stdout.write(`=== ANSWERS BEGIN ===\n${parsed.text.trim()}\n=== ANSWERS END ===\n`)
  res.writeHead(200, { "content-type": "text/plain", connection: "close" }).end("OK", () => {
    server.close()
    server.closeAllConnections()
  })
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://127.0.0.1")

  if (req.method === "GET" && pathname === `/${token}`) {
    res.writeHead(302, { location: pagePath }).end()
    return
  }

  if (req.method === "GET" && pathname === pagePath) {
    const html = await readFile(file).catch(() => null)
    if (html == null) {
      res.writeHead(500).end(`Cannot read ${file}`)
      return
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }).end(html)
    return
  }

  if (req.method === "POST" && pathname === submitPath) {
    await handleSubmit(req, res)
    return
  }

  res.writeHead(404).end()
})

const listen = (port) => new Promise((done, fail) => {
  server.once("error", fail)
  server.listen(port, "127.0.0.1", () => {
    server.off("error", fail)
    done()
  })
})

const timer = setTimeout(() => {
  console.error(`No answers within ${values.timeout}; stopped serving ${file}`)
  process.exit(2)
}, Number(timeoutMatch[1]) * UNIT_MS[timeoutMatch[2]])

const stablePort = 40000 + (createHash("sha256").update(file).digest().readUInt16BE(0) % 10000)
await listen(stablePort).catch(() => listen(0))

const url = `http://127.0.0.1:${server.address().port}${pagePath}`

console.log(`Waiting for answers at ${url}`)
if (!values["no-open"]) {
  execFile("open", [url], (error) => {
    if (error != null) console.error(`Could not open a browser; visit ${url}`)
  })
}
