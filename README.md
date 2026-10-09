# RepoExtract ⚡

> **Deterministic Project Extractor, Code Formatter & ZIP Packer**  
> 100% Client & Server Deterministic Engine — **Zero LLM Hallucinations**, Instant Parsing, and Zero Secrets Exposed.

---

## ✨ Features

- **Zero-AI Deterministic Parser:** Extracts files from AI chat transcripts, markdown fences, diffs, Aider blocks, Claude artifacts, and tool calls (`create_file`, `write_to_file`, etc.) with zero hallucination.
- **Auto-Formatting for Every Language:** Automatically reformats TypeScript, JavaScript, Python, HTML, CSS, JSON, SQL, Go, Rust, and C/C++ on save (`Ctrl+S`).
- **High-Contrast Syntax Highlighting:** Clean, readable VS Code Dark Modern color scheme with bracket pairs, string, keyword, and comment distinctions.
- **Zero-Gap Resizable Layout:** Pixel-perfect zero-gap drag handles to resize both the primary sidebar and bottom diagnostics panel smoothly.
- **Smart Project-Named ZIP Download:** Downloads default directly to the project's actual name (e.g. `my-awesome-app.zip`) instead of generic bundles.
- **Clear & Simple Settings:** Every setting is written in plain, friendly language that anyone can understand, while preserving advanced options for senior developers.
- **Free Public Production-Grade APIs:** Free-to-use REST endpoints for text extraction, multi-language formatting, and ZIP bundling.

---

## 🚀 Free Public APIs

RepoExtract provides production-grade, CORS-enabled REST endpoints free for everyone with no authentication required:

### 1. Extract Project from Text / Transcripts
```bash
POST /api/extract
Content-Type: application/json

{
  "text": "# Project\n\n```ts filename=\"src/app.ts\"\nconsole.log('Hello world!');\n```",
  "options": {
    "stripCommonRoot": true,
    "detectTruncations": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "totalFiles": 1,
  "files": {
    "src/app.ts": {
      "path": "src/app.ts",
      "content": "console.log('Hello world!');",
      "language": "typescript",
      "sizeBytes": 27,
      "lineCount": 1
    }
  },
  "diagnostics": [],
  "stats": { ... }
}
```

---

### 2. Auto-Format Code
```bash
POST /api/format
Content-Type: application/json

{
  "code": "def hello( name ):\n  print('Hi',name)",
  "language": "python",
  "tabSize": 4
}
```

**Response:**
```json
{
  "success": true,
  "formatted": "def hello(name):\n    print('Hi', name)\n",
  "language": "python",
  "lineCount": 2
}
```

---

### 3. Generate Project ZIP File
```bash
POST /api/export-zip
Content-Type: application/json

{
  "projectName": "my-cool-project",
  "files": {
    "README.md": "# My Project",
    "src/index.js": "console.log('ready');"
  },
  "includeAuditReport": true
}
```

**Response:** Stream of binary `application/zip` downloadable as `my-cool-project.zip`.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run the dev server on port 3000
npm run dev

# Build for production
npm run build
```

---

## 🔒 Security & Secrets Hygiene

- **Zero Secret Leaks:** No hardcoded API keys, private credentials, or secrets in source code, client bundles, or configuration files.
- Firebase and database credentials use standard server environment injection without exposing client-side credentials.
- All file extraction runs locally in your browser memory or via stateless server routes.
