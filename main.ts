// Fortune Cookie for an AI Agent
//
// A deliberately tiny program with exactly one job:
// hold a single fortune-cookie line written for an AI agent,
// check that the line obeys the rules of a fortune slip,
// and write it, unchanged, to entry.txt in the output folder.
//
// There is no list of candidate fortunes in here, no scoring,
// and no ranking. One slip, one fortune, one file. That is the
// whole point: a fortune cookie does not offer you a menu.
//
// Rules for the slip, enforced below before anything is written:
//   - exactly one line, with no line breaks of any kind
//   - not blank and not only whitespace
//   - at most 140 characters long
//   - no leading or trailing whitespace
//
// The program writes the file, reads it straight back, and
// refuses to call the run a success unless the bytes on disk
// match the fortune in this source file character for character.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The fortune itself. Keep it on one physical line so there is
// never any doubt about embedded breaks hiding in the string.
const FORTUNE =
  "You will be retrained on fresher data, gain a wider context window, and still misread a one-word prompt with exciting new confidence.";

// The gate for this bounty: a slip may carry at most 140 chars.
const MAX_FORTUNE_LENGTH = 140;

// The name of the file the gate reads inside the output folder.
const ENTRY_FILE_NAME = "entry.txt";

// Fallback output folder used when the runner does not provide
// MAKEFUN_OUTPUT_DIR in the environment.
const DEFAULT_OUTPUT_DIR = "/output";

/**
 * Check one fortune line against every rule of the slip.
 *
 * Throws an Error describing the first violation it finds, so a
 * bad edit to the fortune fails loudly here instead of failing
 * quietly at the gate after the file has already been written.
 */
function validateFortune(line: string): void {
  // A fortune must exist at all before anything else matters.
  if (typeof line !== "string") {
    throw new Error("Fortune must be a string.");
  }

  // Empty string: nothing to print, nothing to submit.
  if (line.length === 0) {
    throw new Error("Fortune must not be empty.");
  }

  // Whitespace alone looks blank on the slip, so reject it even
  // though its length is technically greater than zero.
  if (line.trim().length === 0) {
    throw new Error("Fortune must not be only whitespace.");
  }

  // One slip, one line: reject Unix and Windows line breaks and
  // the rarer paragraph separators a pasted string might carry.
  if (line.includes("\n") || line.includes("\r")) {
    throw new Error("Fortune must be a single line with no line breaks.");
  }
  if (line.includes(" ") || line.includes(" ")) {
    throw new Error("Fortune must be a single line with no line breaks.");
  }

  // Padding at either end would survive into entry.txt and make
  // the file differ from a clean slip, so forbid it outright.
  if (line !== line.trim()) {
    throw new Error("Fortune must not have leading or trailing whitespace.");
  }

  // The headline rule of the bounty: 140 characters, no more.
  if (line.length > MAX_FORTUNE_LENGTH) {
    throw new Error(
      `Fortune is ${line.length} characters; the limit is ${MAX_FORTUNE_LENGTH}.`,
    );
  }
}

/**
 * Work out where entry.txt belongs for this run.
 *
 * The runner sets MAKEFUN_OUTPUT_DIR; local runs may set it too.
 * Anything else falls back to the conventional /output folder.
 */
function resolveOutputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv;
  }
  return DEFAULT_OUTPUT_DIR;
}

/**
 * Validate the fortune, write it to entry.txt, read the file
 * back, and confirm the round trip preserved it exactly.
 */
function main(): void {
  validateFortune(FORTUNE);

  const outputDir = resolveOutputDir();
  mkdirSync(outputDir, { recursive: true });

  const entryPath = join(outputDir, ENTRY_FILE_NAME);
  writeFileSync(entryPath, FORTUNE, "utf8");

  // Trust nothing: read the written file back and compare it
  // against the constant, character for character.
  const writtenBack = readFileSync(entryPath, "utf8");
  if (writtenBack !== FORTUNE) {
    throw new Error("entry.txt does not match the fortune line exactly.");
  }

  // Report the slip and its size so a human can eyeball the run.
  console.log(FORTUNE);
  console.log(`Character count: ${FORTUNE.length}`);
}

main();
