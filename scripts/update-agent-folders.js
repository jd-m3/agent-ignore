#!/usr/bin/env node
// Updates agent-folders.txt with latest data from GitHub

import fs from "fs";
import { FOLDERS_FILE, AGENTS_TS_URL } from "../lib/constants.js";
import { fetchAgentsTs, parseSkillsDirs } from "../lib/helpers.js";

async function main() {
  console.log(`Fetching agent folders from: ${AGENTS_TS_URL}`);

  // Fetch the latest agents.ts file
  const agentsTsContent = await fetchAgentsTs();

  if (!agentsTsContent) {
    console.error("Error: Could not fetch data from GitHub");
    console.error("Check your internet connection or the URL in lib/constants.js");
    process.exit(1);
  }

  // Parse the folder names
  const folders = parseSkillsDirs(agentsTsContent);

  if (folders.length === 0) {
    console.error("Error: No agent folders found in the fetched data");
    process.exit(1);
  }

  console.log(`Found ${folders.length} agent folder(s):`);
  folders.forEach((f) => console.log(`  - ${f}`));

  // Write to agent-folders.txt
  const content = folders.join("\n") + "\n";
  fs.writeFileSync(FOLDERS_FILE, content, "utf-8");

  console.log(`\nSuccessfully updated ${FOLDERS_FILE}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
