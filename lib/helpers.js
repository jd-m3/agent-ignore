import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import {
  MARKER,
  FOLDERS_FILE,
  AGENTS_TS_URL,
  SKIP_DIRS,
} from "./constants.js";

/**
 * Find git root or use current directory
 */
function getGitRoot() {
  try {
    const root = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return root;
  } catch {
    return process.cwd();
  }
}

/**
 * Fetch agents.ts from GitHub
 */
async function fetchAgentsTs() {
  try {
    const response = await fetch(AGENTS_TS_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.log(`Could not fetch from GitHub: ${error.message}`);
    return null;
  }
}

/**
 * Parse skillsDir values from agents.ts content
 */
function parseSkillsDirs(content) {
  const regex = /skillsDir:\s*['"]([^'"]+)['"]/g;
  const dirs = new Set();
  let match;

  while ((match = regex.exec(content)) !== null) {
    const skillsDir = match[1];
    // Extract parent directory (e.g., ".claude/skills" -> ".claude/")
    // Handle special cases like "skills" (moltbot) and ".github/skills"
    if (skillsDir === "skills") {
      dirs.add("skills/");
    } else if (skillsDir.includes("/")) {
      const parent = skillsDir.split("/")[0] + "/";
      // Special case for .github/skills - keep the full path
      if (parent === ".github/") {
        dirs.add(".github/skills/");
      } else {
        dirs.add(parent);
      }
    } else {
      dirs.add(skillsDir + "/");
    }
  }

  return Array.from(dirs).sort();
}

/**
 * Read folders from static file
 */
function readStaticFolders() {
  if (!fs.existsSync(FOLDERS_FILE)) {
    console.error(`Error: ${FOLDERS_FILE} not found`);
    return [];
  }
  return fs
    .readFileSync(FOLDERS_FILE, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

/**
 * Recursively find which agent folders exist anywhere in the repository
 */
function filterExistingFolders(folders, root) {
  const folderNames = new Set(folders.map((f) => f.replace(/\/$/, "")));
  const found = new Set();

  function scan(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // Skip directories we can't read
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const name = entry.name;

      // Check if this is an agent folder we're looking for
      if (folderNames.has(name)) {
        found.add(name + "/");
      }

      // Special case: check for .github/skills/
      if (name === ".github") {
        const skillsPath = path.join(dir, name, "skills");
        if (fs.existsSync(skillsPath)) {
          found.add(".github/skills/");
        }
      }

      // Recurse into subdirectories (skip common large dirs)
      if (!SKIP_DIRS.has(name) && !name.startsWith(".")) {
        scan(path.join(dir, name));
      }
    }
  }

  scan(root);
  return Array.from(found).sort();
}

/**
 * Get existing entries from .gitignore AI Agents section
 */
function getExistingAgentEntries(gitignorePath) {
  if (!fs.existsSync(gitignorePath)) {
    return { hasSection: false, entries: [] };
  }

  const content = fs.readFileSync(gitignorePath, "utf-8");
  if (!content.includes(MARKER)) {
    return { hasSection: false, entries: [] };
  }

  // Extract existing entries from the AI Agents section
  const markerIndex = content.indexOf(MARKER);
  const sectionContent = content.slice(markerIndex + MARKER.length);
  const entries = sectionContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  return { hasSection: true, entries };
}

/**
 * Remove AI Agents section from .gitignore
 */
function removeAgentSection(gitignorePath) {
  if (!fs.existsSync(gitignorePath)) {
    return "";
  }

  const content = fs.readFileSync(gitignorePath, "utf-8");
  if (!content.includes(MARKER)) {
    return content;
  }

  const markerIndex = content.indexOf(MARKER);
  // Find the start (including preceding newline if any)
  let start = markerIndex;
  if (start > 0 && content[start - 1] === "\n") {
    start--;
  }

  return content.slice(0, start);
}

export {
  getGitRoot,
  fetchAgentsTs,
  parseSkillsDirs,
  readStaticFolders,
  filterExistingFolders,
  getExistingAgentEntries,
  removeAgentSection,
};
