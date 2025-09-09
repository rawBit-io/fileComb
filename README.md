# File Combiner

A single‑file web app that combines multiple local files into one text block — handy for sharing code with AI chats. Everything runs in your browser; files are **never uploaded**.

## Use

1. Open `index.html` (double‑click or serve via `python3 -m http.server`).
2. Click **Select Folder / Files**.
3. (Optional) Set **Max KB** and/or **Search** (`text`, `.ext`, or `*.ext`).
4. Check the files you want.
5. Click **Combine**, then **Copy** or **Save**.

## Notes

- Supported text/code types:
  .txt, .js, .jsx, .ts, .tsx, .css, .scss, .html, .htm, .md,
  .json, .yml, .yaml, .xml, .svg, .py

- Common dev folders (`node_modules`, `.git`, `dist`, etc.) are ignored.
- Clipboard API prefers HTTPS or `localhost`. A fallback is included.

## License

MIT © 2025
