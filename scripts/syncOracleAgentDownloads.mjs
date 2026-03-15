import fs from 'fs/promises';
import path from 'path';

const repoRoot = process.cwd();
const releaseDir = path.join(repoRoot, 'oracle-desktop-agent', 'release');
const downloadsDir = path.join(repoRoot, 'public', 'downloads');

async function findNewestFile(pattern) {
  const entries = await fs.readdir(releaseDir, { withFileTypes: true });
  const matches = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!pattern.test(entry.name)) continue;

    const fullPath = path.join(releaseDir, entry.name);
    const stat = await fs.stat(fullPath);
    matches.push({ fullPath, mtimeMs: stat.mtimeMs, name: entry.name });
  }

  matches.sort((left, right) => right.mtimeMs - left.mtimeMs);
  return matches[0] ?? null;
}

async function copyIfPresent(source, destinationName) {
  if (!source) {
    console.log(`Skipping ${destinationName}: no matching release artifact found.`);
    return;
  }

  const destinationPath = path.join(downloadsDir, destinationName);
  await fs.mkdir(downloadsDir, { recursive: true });
  await fs.copyFile(source.fullPath, destinationPath);
  console.log(`Copied ${source.name} -> public/downloads/${destinationName}`);
}

async function main() {
  const windowsInstaller = await findNewestFile(/-win-(x64|arm64)\.exe$/i);
  const macDmg = await findNewestFile(/-mac.*\.dmg$/i);

  await copyIfPresent(windowsInstaller, 'OracleAgent-Windows.exe');
  await copyIfPresent(macDmg, 'OracleAgent-Mac.dmg');
}

main().catch((error) => {
  console.error('Failed to sync Oracle agent downloads:', error);
  process.exitCode = 1;
});
