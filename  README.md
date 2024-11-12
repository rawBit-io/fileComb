# File Combiner

A minimalist web tool for combining multiple code files into a single document. Perfect for sharing code with AI language models like ChatGPT or Claude, or creating documentation. Features a clean, terminal-inspired interface.

## Features

- 📂 Easily select folders and see files in a tree view
- ✅ Select specific files with checkboxes
- 💾 Save/Load selections for repeated tasks
- 📏 Filter out large files automatically
- 📋 Quick copy to clipboard for AI chat paste
- 🎯 Smart path handling between folders

## Supported Files & Filtering

**File Types:**

```
.txt, .js, .jsx, .ts, .tsx, .css, .scss, .html, .htm, .md,
.json, .yml, .yaml, .xml, .svg, .pdf, .py
```

**Auto-Excludes:**

- Common dev folders (node_modules, .git, dist, etc.)
- Files larger than your set size limit
- Hidden folders

## Usage

1. Click "Select Folder" to pick your code directory
2. (Optional) Set a max file size to avoid huge files
3. Select files you want to share
4. Click "Combine Files" to merge them
5. Copy & paste into your AI chat

**Pro Tip:** Save your selection if you'll need the same files again later.

## Smart Features

- Maintains selections even when loading from different folder levels
- Shows file sizes and excluded files clearly
- Collapsible folder structure for easy navigation
- Real-time statistics of selected files
- Terminal-inspired dark theme for reduced eye strain

Perfect for developers working with AI tools or anyone needing to share multiple code files in a single document.
