import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const testRoots = ['src', 'tests'];

async function collectTests(directory) {
  let entries;
  try {
    entries = await readdir(resolve(projectRoot, directory), {
      withFileTypes: true,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const files = [];
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const relativePath = [directory, entry.name].join('/');
    if (entry.isDirectory()) {
      files.push(...(await collectTests(relativePath)));
    } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      files.push(relativePath.split('/').join(sep));
    }
  }
  return files;
}

const testFiles = (await Promise.all(testRoots.map(collectTests)))
  .flat()
  .sort((left, right) => left.localeCompare(right));

if (testFiles.length === 0) {
  console.error('No *.test.ts files found under src/ or tests/.');
  process.exitCode = 1;
} else {
  const tsxCli = resolve(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const testEnvironment = pathToFileURL(resolve(projectRoot, 'scripts', 'test-env.mjs')).href;
  const result = spawnSync(
    process.execPath,
    [tsxCli, '--import', testEnvironment, '--test', ...testFiles],
    { cwd: projectRoot, stdio: 'inherit' }
  );

  if (result.error) {
    console.error('Unable to start the local tsx test runner:', result.error.message);
    process.exitCode = 1;
  } else {
    process.exitCode = result.status ?? 1;
  }
}
