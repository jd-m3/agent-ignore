import { describe, it, expect } from "vitest";
import {
  parseSkillsDirs,
  getExistingAgentEntries,
  removeAgentSection,
} from "./helpers.js";
import { MARKER } from "./constants.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("parseSkillsDirs", () => {
  it("should parse skillsDir values from TypeScript content", () => {
    const content = `
      export const agents = {
        claude: { skillsDir: '.claude/skills' },
        cursor: { skillsDir: '.cursor/skills' }
      }
    `;
    const result = parseSkillsDirs(content);
    expect(result).toEqual([".claude/", ".cursor/"]);
  });

  it("should handle single word skills directory", () => {
    const content = `skillsDir: 'skills'`;
    const result = parseSkillsDirs(content);
    expect(result).toEqual(["skills/"]);
  });

  it("should handle .github/skills specially", () => {
    const content = `skillsDir: '.github/skills'`;
    const result = parseSkillsDirs(content);
    expect(result).toEqual([".github/skills/"]);
  });

  it("should return unique directories", () => {
    const content = `
      skillsDir: '.claude/skills'
      skillsDir: '.claude/other'
      skillsDir: '.cursor/skills'
    `;
    const result = parseSkillsDirs(content);
    expect(result).toEqual([".claude/", ".cursor/"]);
  });

  it("should return empty array for no matches", () => {
    const content = "no skills directory here";
    const result = parseSkillsDirs(content);
    expect(result).toEqual([]);
  });
});

describe("getExistingAgentEntries", () => {
  it("should return false when file doesn't exist", () => {
    const result = getExistingAgentEntries("/nonexistent/path/.gitignore");
    expect(result).toEqual({ hasSection: false, entries: [] });
  });

  it("should return false when marker is not present", () => {
    const testFile = path.join(__dirname, "..", "package.json");
    const result = getExistingAgentEntries(testFile);
    expect(result).toEqual({ hasSection: false, entries: [] });
  });

  it("should extract entries from AI Agents section", () => {
    const content = `
node_modules/
${MARKER}
.claude/
.cursor/
.github/skills/
`;
    // Create a temporary test file
    const tempFile = path.join(__dirname, ".test-gitignore");
    fs.writeFileSync(tempFile, content);

    const result = getExistingAgentEntries(tempFile);
    expect(result.hasSection).toBe(true);
    expect(result.entries).toEqual([".claude/", ".cursor/", ".github/skills/"]);

    // Cleanup
    fs.unlinkSync(tempFile);
  });

  it("should ignore comments and empty lines", () => {
    const content = `
${MARKER}
.claude/
# This is a comment

.cursor/
`;
    const tempFile = path.join(__dirname, ".test-gitignore2");
    fs.writeFileSync(tempFile, content);

    const result = getExistingAgentEntries(tempFile);
    expect(result.entries).toEqual([".claude/", ".cursor/"]);

    // Cleanup
    fs.unlinkSync(tempFile);
  });
});

describe("removeAgentSection", () => {
  it("should return empty string for nonexistent file", () => {
    const result = removeAgentSection("/nonexistent/path/.gitignore");
    expect(result).toBe("");
  });

  it("should return original content when marker is not present", () => {
    const content = "node_modules/\ndist/\n";
    const tempFile = path.join(__dirname, ".test-gitignore3");
    fs.writeFileSync(tempFile, content);

    const result = removeAgentSection(tempFile);
    expect(result).toBe(content);

    // Cleanup
    fs.unlinkSync(tempFile);
  });

  it("should remove AI Agents section", () => {
    const content = `node_modules/
dist/
${MARKER}
.claude/
.cursor/
`;
    const tempFile = path.join(__dirname, ".test-gitignore4");
    fs.writeFileSync(tempFile, content);

    const result = removeAgentSection(tempFile);
    expect(result).toBe("node_modules/\ndist/");

    // Cleanup
    fs.unlinkSync(tempFile);
  });

  it("should remove section with preceding newline", () => {
    const content = `node_modules/
dist/

${MARKER}
.claude/
`;
    const tempFile = path.join(__dirname, ".test-gitignore5");
    fs.writeFileSync(tempFile, content);

    const result = removeAgentSection(tempFile);
    expect(result).toBe("node_modules/\ndist/\n");

    // Cleanup
    fs.unlinkSync(tempFile);
  });
});
