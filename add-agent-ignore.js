#!/usr/bin/env node
// Adds AI agent folders to .gitignore (only if they exist)

const fs = require("fs");
const path = require("path");

const { MARKER, GITIGNORE } = require("./lib/constants");
const {
  getGitRoot,
  fetchAgentsTs,
  parseSkillsDirs,
  readStaticFolders,
  filterExistingFolders,
  getExistingAgentEntries,
  removeAgentSection,
} = require("./lib/helpers");

async function main() {
  const root = getGitRoot();
  const gitignorePath = path.join(root, GITIGNORE);

  console.log(`Checking for AI agent folders in: ${root}`);

  // Try to fetch from GitHub, fallback to static file
  let allFolders;
  const agentsTsContent = await fetchAgentsTs();

  if (agentsTsContent) {
    console.log("Fetched agent list from GitHub");
    allFolders = parseSkillsDirs(agentsTsContent);
  } else {
    console.log("Using static agent list (offline fallback)");
    allFolders = readStaticFolders();
  }

  if (allFolders.length === 0) {
    console.error("Error: No agent folders found");
    process.exit(1);
  }

  // Filter to only folders that exist in the repo
  const existingFolders = filterExistingFolders(allFolders, root);

  if (existingFolders.length === 0) {
    console.log("No AI agent folders found in this repository. Nothing to add.");
    process.exit(0);
  }

  console.log(`Found ${existingFolders.length} AI agent folder(s):`);
  existingFolders.forEach((f) => console.log(`  - ${f}`));

  // Check existing .gitignore state
  const { hasSection, entries } = getExistingAgentEntries(gitignorePath);

  // Check if we need to update
  const existingSet = new Set(entries);
  const newSet = new Set(existingFolders);
  const setsEqual =
    existingSet.size === newSet.size &&
    [...existingSet].every((e) => newSet.has(e));

  if (hasSection && setsEqual) {
    console.log("AI agents section already up-to-date in .gitignore");
    process.exit(0);
  }

  // Remove old section and write new one
  const baseContent = removeAgentSection(gitignorePath);
  const section = `\n${MARKER}\n${existingFolders.join("\n")}\n`;
  fs.writeFileSync(gitignorePath, baseContent + section);

  if (hasSection) {
    console.log(`Updated AI agents section in ${gitignorePath}`);
  } else {
    console.log(`Added AI agents to ${gitignorePath}`);
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
