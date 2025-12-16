#!/usr/bin/env node
const http = require("node:http")
const fs = require("node:fs/promises")
const path = require("node:path")

const PORT = process.env.PORT ? Number(process.env.PORT) : 4173
const DIST_DIR = process.env.CLINE_WEBUI_DIST
	? path.resolve(process.env.CLINE_WEBUI_DIST)
	: path.resolve(__dirname, "..", "webview-ui", "dist-standalone")

const MIME_TYPES = {
	".html": "text/html; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".ico": "image/x-icon",
}

const BOOTSTRAP_SNIPPET = `\n<script>\n// Basic bridge so the standalone web build can run without VS Code.\nif (!window.standalonePostMessage) {\n  window.standalonePostMessage = (message) => {\n    console.info('[standalonePostMessage]', message);\n  };\n}\n</script>\n`

async function sendFile(res, filePath) {
	const ext = path.extname(filePath).toLowerCase()
	res.statusCode = 200
	res.setHeader("Content-Type", MIME_TYPES[ext] || "application/octet-stream")

	if (ext === ".html") {
		const html = await fs.readFile(filePath, "utf8")
		res.end(html.replace(/<\/body>/i, `${BOOTSTRAP_SNIPPET}</body>`))
		return
	}

	const data = await fs.readFile(filePath)
	res.end(data)
}

async function handleRequest(req, res) {
	try {
		const url = new URL(req.url || "/", "http://localhost")
		let relativePath = url.pathname

		if (relativePath.endsWith("/")) {
			relativePath += "index.html"
		}

		const safePath = path.normalize(relativePath).replace(/^\.+/, "")
		const filePath = path.join(DIST_DIR, safePath)

		try {
			const stat = await fs.stat(filePath)
			if (stat.isFile()) {
				await sendFile(res, filePath)
				return
			}
		} catch (err) {
			if (err && err.code !== "ENOENT") {
				throw err
			}
		}

		await sendFile(res, path.join(DIST_DIR, "index.html"))
	} catch (error) {
		console.error("[standalone-web-server]", error)
		res.statusCode = 500
		res.end("Internal server error")
	}
}

async function main() {
	try {
		const stat = await fs.stat(DIST_DIR)
		if (!stat.isDirectory()) {
			throw new Error(`${DIST_DIR} is not a directory`)
		}
	} catch (error) {
		console.error(`[standalone-web-server] Cannot read dist directory: ${DIST_DIR}`)
		console.error(error)
		process.exit(1)
	}

	const server = http.createServer((req, res) => {
		handleRequest(req, res)
	})

	server.listen(PORT, () => {
		console.log(`Cline standalone web UI available at http://localhost:${PORT}`)
		console.log(`Serving static files from: ${DIST_DIR}`)
	})
}

main()
