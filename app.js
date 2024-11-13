// DOM Elements
const folderInput = document.getElementById("folderInput");
const selectFolderBtn = document.getElementById("selectFolderBtn");
const stats = document.getElementById("stats");
const combineBtn = document.getElementById("combineBtn");
const saveSelectionBtn = document.getElementById("saveSelectionBtn");
const loadSelectionBtn = document.getElementById("loadSelectionBtn");
const selectAllBtn = document.getElementById("selectAllBtn");
const deselectAllBtn = document.getElementById("deselectAllBtn");
const fileList = document.getElementById("fileList");
const previewSection = document.getElementById("previewSection");
const output = document.getElementById("output");
const copyBtn = document.getElementById("copyBtn");
const saveBtn = document.getElementById("saveBtn");
const maxSizeInput = document.getElementById("maxSizeInput");
const applyFilterBtn = document.getElementById("applyFilterBtn");
const excludedFilesSection = document.getElementById("excludedFilesSection");
const excludedFilesList = document.getElementById("excludedFilesList");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

// State Variables
let files = [];
let fileMap = new Map();
let fileStructure = {};
let maxFileSize = Infinity; // in bytes
let excludedFiles = new Set();
let selectedFiles = new Set();
let searchTerm = "";

// Excluded Folders
const excludedFolders = new Set([
  "node_modules",
  ".git",
  ".svn",
  ".hg",
  ".idea",
  ".vscode",
  "dist",
  "build",
  "coverage",
  "out",
  "target",
  "vendor",
  "bin",
  "obj",
  "tmp",
  "temp",
  "cache",
  "__pycache__",
  ".next",
  ".nuxt",
]);

// Allowed File Extensions
const allowedExtensions = new Set([
  "txt",
  "js",
  "jsx",
  "ts",
  "tsx",
  "css",
  "scss",
  "html",
  "htm",
  "md",
  "json",
  "yml",
  "yaml",
  "xml",
  "svg",
  "pdf",
  "py",
  "ipynb", // Added ipynb here
]);

// Utility Functions
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024,
    sizes = ["Bytes", "KB", "MB", "GB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function updateStats() {
  const totalFiles = files.length - excludedFiles.size;

  let selectedFilesCount = 0;
  let totalSelectedSize = 0;

  selectedFiles.forEach((filePath) => {
    if (!excludedFiles.has(filePath)) {
      selectedFilesCount++;
      const file = fileMap.get(filePath);
      if (file) {
        totalSelectedSize += file.size;
      }
    }
  });

  stats.textContent = `Selected ${selectedFilesCount} of ${totalFiles} files (${formatFileSize(
    totalSelectedSize
  )})`;

  const hasSelection = selectedFilesCount > 0;
  combineBtn.disabled = !hasSelection;
  saveSelectionBtn.disabled = !hasSelection;
  selectAllBtn.disabled = totalFiles === 0;
  deselectAllBtn.disabled = totalFiles === 0;
}

function isExcludedFolder(folderName) {
  const lowerName = folderName.toLowerCase();
  return (
    excludedFolders.has(lowerName) ||
    lowerName.startsWith(".") ||
    lowerName.endsWith("_modules") ||
    lowerName.endsWith("_build")
  );
}

function isFileInExcludedFolder(file) {
  const pathParts = file.webkitRelativePath.split("/").filter(Boolean);
  for (const part of pathParts.slice(0, -1)) {
    if (isExcludedFolder(part)) {
      return true;
    }
  }
  return false;
}

function createFileStructure() {
  fileStructure = {};
  files.forEach((file) => {
    const pathParts = file.webkitRelativePath.split("/").filter(Boolean);
    let currentLevel = fileStructure;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];

      // Exclude specified folders
      if (isExcludedFolder(part)) {
        return;
      }

      if (i === pathParts.length - 1) {
        // It's a file

        // Apply search filter
        if (
          searchTerm &&
          !file.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          excludedFiles.add(file.webkitRelativePath);
          return;
        }

        currentLevel[part] = {
          type: "file",
          file: file,
        };
      } else {
        // It's a folder
        if (!currentLevel[part]) {
          currentLevel[part] = {
            type: "folder",
            children: {},
          };
        }
        currentLevel = currentLevel[part].children;
      }
    }
  });
}

function renderFileStructure(structure, container) {
  for (const key in structure) {
    const item = structure[key];
    if (item.type === "folder") {
      const folderItem = document.createElement("div");
      folderItem.classList.add("folder-item");

      const folderHeader = document.createElement("div");
      folderHeader.classList.add("folder-header");

      const expander = document.createElement("span");
      expander.textContent = "▾";
      expander.classList.add("expander");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.addEventListener("change", function () {
        const checkboxes = folderItem.querySelectorAll(
          'input[type="checkbox"][data-path]'
        );
        checkboxes.forEach((cb) => {
          if (!cb.disabled) {
            cb.checked = checkbox.checked;
            const filePath = cb.dataset.path;
            if (checkbox.checked) {
              selectedFiles.add(filePath);
            } else {
              selectedFiles.delete(filePath);
            }
          }
        });
        updateStats();
      });

      const label = document.createElement("span");
      label.textContent = key;

      folderHeader.appendChild(expander);
      folderHeader.appendChild(checkbox);
      folderHeader.appendChild(label);

      folderHeader.addEventListener("click", function (e) {
        if (e.target.tagName !== "INPUT") {
          const content = folderItem.querySelector(".folder-content");
          const isCollapsed = content.classList.toggle("collapsed");
          expander.textContent = isCollapsed ? "▸" : "▾";
        }
      });

      const folderContent = document.createElement("div");
      folderContent.classList.add("folder-content");

      renderFileStructure(item.children, folderContent);

      // Only render folder if it has children
      if (Object.keys(item.children).length > 0) {
        folderItem.appendChild(folderHeader);
        folderItem.appendChild(folderContent);
        container.appendChild(folderItem);
      }
    } else if (item.type === "file") {
      const fileItem = document.createElement("div");
      fileItem.classList.add("file-item");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.path = item.file.webkitRelativePath;

      // Ensure item.file.size and maxFileSize are numbers
      const fileSize = Number(item.file.size);
      const maxSize = Number(maxFileSize);

      // Disable checkbox if file size exceeds maxFileSize
      if (fileSize > maxSize) {
        checkbox.disabled = true;
        excludedFiles.add(item.file.webkitRelativePath);
      }

      // Set checked status based on selectedFiles
      if (
        selectedFiles.has(item.file.webkitRelativePath) &&
        !checkbox.disabled
      ) {
        checkbox.checked = true;
      }

      // Update selectedFiles when checkbox changes
      checkbox.addEventListener("change", function () {
        const filePath = checkbox.dataset.path;
        if (checkbox.checked) {
          selectedFiles.add(filePath);
        } else {
          selectedFiles.delete(filePath);
        }
        updateStats();
      });

      const label = document.createElement("span");
      label.classList.add("file-name");
      label.textContent = `${item.file.name} (${formatFileSize(fileSize)})`;

      // Add class or style to indicate file is over size limit
      if (fileSize > maxSize) {
        label.classList.add("over-size-limit");
      }

      fileItem.appendChild(checkbox);
      fileItem.appendChild(label);
      container.appendChild(fileItem);
    }
  }
}

function renderExcludedFiles() {
  if (excludedFiles.size > 0) {
    excludedFilesSection.classList.remove("hidden");
    excludedFilesList.innerHTML = "";
    for (const path of excludedFiles) {
      const file = fileMap.get(path);
      if (file) {
        const listItem = document.createElement("li");
        listItem.textContent = `${file.name} (${formatFileSize(file.size)})`;
        excludedFilesList.appendChild(listItem);
      }
    }
  } else {
    excludedFilesSection.classList.add("hidden");
    excludedFilesList.innerHTML = "";
  }
}

function handleFileSelection(selectedFilesInput) {
  files = [];
  fileMap.clear();
  selectedFiles.clear(); // Clear selectedFiles when new files are loaded
  excludedFiles.clear(); // Clear excludedFiles when new files are loaded

  Array.from(selectedFilesInput).forEach((file) => {
    const ext = file.name.split(".").pop().toLowerCase();

    if (allowedExtensions.has(ext) && !isFileInExcludedFolder(file)) {
      files.push(file);
      fileMap.set(file.webkitRelativePath, file);
    }
  });

  if (files.length === 0) {
    stats.textContent = "No valid files selected";
    fileList.innerHTML = "No files to display";
    excludedFilesSection.classList.add("hidden");
    // Disable buttons when no files are loaded
    loadSelectionBtn.disabled = true;
    selectAllBtn.disabled = true;
    deselectAllBtn.disabled = true;
    combineBtn.disabled = true;
    saveSelectionBtn.disabled = true;
    return;
  }

  // Enable Load Selection button when files are loaded
  loadSelectionBtn.disabled = false;

  applyFiltersAndRender(); // Apply filters and render the file list
}

function applyFiltersAndRender() {
  excludedFiles.clear();
  createFileStructure();

  // Clear and re-render the file list
  fileList.innerHTML = "";
  renderFileStructure(fileStructure, fileList);

  renderExcludedFiles();
  updateStats();
}

async function combineFiles() {
  const selectedPaths = Array.from(selectedFiles).filter(
    (path) => !excludedFiles.has(path)
  );

  if (selectedPaths.length === 0) {
    alert("Please select at least one file to combine.");
    return;
  }

  const selectedFilesArray = selectedPaths.map((path) => fileMap.get(path));

  let totalSize = 0;
  selectedFilesArray.forEach((file) => {
    totalSize += file.size;
  });

  selectedFilesArray.sort((a, b) =>
    a.webkitRelativePath.localeCompare(b.webkitRelativePath)
  );

  let combinedContent = `Combined Files Summary
========================
Total Files: ${selectedFilesArray.length}
Total Size: ${formatFileSize(totalSize)}
========================\n\n`;

  for (const file of selectedFilesArray) {
    try {
      const content = await readFileAsText(file);
      combinedContent += `\n\n==== ${file.name} ====
Relative Path: ${file.webkitRelativePath}
====\n\n`;
      combinedContent += content;
    } catch (error) {
      console.error("Error reading file:", file.name, error);
    }
  }

  output.textContent = combinedContent;
  previewSection.classList.remove("hidden");

  // Enable the copy and save buttons when there is content
  if (combinedContent.trim().length > 0) {
    copyBtn.disabled = false;
    saveBtn.disabled = false;
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const ext = file.name.split(".").pop().toLowerCase();
      if (ext === "ipynb") {
        // Handle .ipynb files
        try {
          const notebook = JSON.parse(e.target.result);
          let extractedText = extractNotebookContent(notebook);
          resolve(extractedText);
        } catch (error) {
          console.error("Error parsing .ipynb file:", error);
          reject(error);
        }
      } else {
        resolve(e.target.result);
      }
    };
    reader.onerror = function (e) {
      reject(e);
    };
    reader.readAsText(file);
  });
}

function extractNotebookContent(notebook) {
  let content = "";
  notebook.cells.forEach((cell, index) => {
    if (cell.cell_type === "code") {
      const cellSource = cell.source.join("");
      content += `# Code Cell ${index + 1}\n${cellSource}\n\n`;
    } else if (cell.cell_type === "markdown") {
      const cellSource = cell.source.join("");
      content += `# Markdown Cell ${index + 1}\n${cellSource}\n\n`;
    }
  });
  return content;
}

function saveSelection() {
  const selection = Array.from(selectedFiles);

  const blob = new Blob([JSON.stringify(selection, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "file_selection.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadSelection() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const selection = JSON.parse(e.target.result);
        selectedFiles.clear();

        const currentFilePaths = Array.from(fileMap.keys());

        currentFilePaths.forEach((currentPath) => {
          // Try to find a match in the selection
          const isSelected = selection.some((savedPath) => {
            return isSameFile(savedPath, currentPath);
          });

          if (isSelected) {
            selectedFiles.add(currentPath);
          }
        });

        // Re-render the file list to reflect the new selection
        applyFiltersAndRender();
      } catch (error) {
        console.error("Error loading selection:", error);
        alert("Invalid selection file format");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function isSameFile(savedPath, currentPath) {
  const savedParts = savedPath.split("/").filter(Boolean);
  const currentParts = currentPath.split("/").filter(Boolean);

  // If matching from main folder to subfolder
  if (savedParts.length > currentParts.length) {
    // Check if savedPath ends with currentPath
    const endParts = savedParts.slice(-currentParts.length);
    return endParts.join("/") === currentParts.join("/");
  }

  // If matching from subfolder to main folder
  if (currentParts.length > savedParts.length) {
    // Check if currentPath ends with savedPath
    const endParts = currentParts.slice(-savedParts.length);
    return endParts.join("/") === savedParts.join("/");
  }

  // If paths are same length, compare directly
  return savedParts.join("/") === currentParts.join("/");
}

function selectAllFiles() {
  // Select all checkboxes, including folders
  const checkboxes = fileList.querySelectorAll(
    'input[type="checkbox"]:not(:disabled)'
  );
  checkboxes.forEach((cb) => {
    cb.checked = true;
  });

  // Update selectedFiles set
  selectedFiles.clear();
  const fileCheckboxes = fileList.querySelectorAll(
    'input[type="checkbox"][data-path]:not(:disabled)'
  );
  fileCheckboxes.forEach((cb) => {
    selectedFiles.add(cb.dataset.path);
  });

  updateStats();
}

function deselectAllFiles() {
  // Deselect all checkboxes, including folders
  const checkboxes = fileList.querySelectorAll(
    'input[type="checkbox"]:not(:disabled)'
  );
  checkboxes.forEach((cb) => {
    cb.checked = false;
  });

  // Clear selectedFiles set
  selectedFiles.clear();

  updateStats();
}

function copyToClipboard() {
  const text = output.textContent;
  navigator.clipboard.writeText(text).then(
    () => {
      // Indicate success by changing the button text temporarily
      copyBtn.textContent = "Copied!";
      copyBtn.classList.add("copied");
      // Disable the button temporarily to prevent multiple clicks
      copyBtn.disabled = true;
      setTimeout(() => {
        // Restore the button after 2 seconds
        copyBtn.textContent = "Copy";
        copyBtn.disabled = false;
        copyBtn.classList.remove("copied");
      }, 2000);
    },
    (err) => {
      console.error("Could not copy text: ", err);
    }
  );
}

function saveToFile() {
  const text = output.textContent;
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "combined_files.txt"; // Set the default file name
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function applySizeFilter() {
  let sizeInKB;
  if (maxSizeInput.value.trim() === "") {
    sizeInKB = Infinity;
  } else {
    sizeInKB = parseFloat(maxSizeInput.value);
    if (isNaN(sizeInKB) || sizeInKB < 0) {
      alert("Please enter a valid non-negative number for size.");
      return;
    }
  }

  maxFileSize = sizeInKB * 1024; // Convert KB to bytes

  applyFiltersAndRender();
}

function applySearchFilter() {
  searchTerm = searchInput.value.trim();
  applyFiltersAndRender();
}

// Event Listeners
selectFolderBtn.addEventListener("click", () => folderInput.click());

folderInput.addEventListener("change", (event) => {
  handleFileSelection(event.target.files);
});

// Disable Load Selection button initially
loadSelectionBtn.disabled = true;

// Disable copy and save buttons initially
copyBtn.disabled = true;
saveBtn.disabled = true;

// Event Listeners
combineBtn.addEventListener("click", combineFiles);
saveSelectionBtn.addEventListener("click", saveSelection);
loadSelectionBtn.addEventListener("click", loadSelection);
selectAllBtn.addEventListener("click", selectAllFiles);
deselectAllBtn.addEventListener("click", deselectAllFiles);
copyBtn.addEventListener("click", copyToClipboard);
saveBtn.addEventListener("click", saveToFile);
applyFilterBtn.addEventListener("click", applySizeFilter);
searchBtn.addEventListener("click", applySearchFilter);

// Apply size filter on Enter key press
maxSizeInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    applySizeFilter();
  }
});

// Apply search filter on Enter key press
searchInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    applySearchFilter();
  }
});
