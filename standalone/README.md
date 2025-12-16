# Cline Standalone Web UI (Experimental)

The repository now includes a minimal workflow for running Cline's webview UI as a standalone web app instead of a VS Code extension. This setup is experimental and currently provides only the client shell — it does not yet connect to the full Cline backend, but it allows you to build and host the UI in a regular browser.

## Build the standalone web assets

```bash
npm run build:webview:standalone
```

This command compiles the webview for the `standalone` platform and outputs files to `webview-ui/dist-standalone`.

## Serve the web UI

After building, start the lightweight static server:

```bash
npm run serve:webview:standalone
```

By default the server listens on <http://localhost:4173> and serves the files from `webview-ui/dist-standalone`. You can override the port or directory with environment variables:

- `PORT=5000 npm run serve:webview:standalone`
- `CLINE_WEBUI_DIST=/custom/path npm run serve:webview:standalone`

The server injects a basic `window.standalonePostMessage` bridge so the UI can load without VS Code APIs. Wiring this bridge to a real backend will be the next step toward a fully functional standalone experience.
