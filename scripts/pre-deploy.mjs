import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();

const checks = [
  { label: 'Running lint', command: 'npm run lint' },
  { label: 'Running type-check', command: 'npm run type-check' },
  { label: 'Running unit/integration coverage', command: 'npm run test:coverage' },
  {
    label: 'Running security rules tests',
    command:
      'npx firebase emulators:exec --project demo-jariyah-soft --only firestore,auth,storage "npm run test:rules"',
  },
];

function printHeader(step, total, message) {
  console.log(`\n[${step}/${total}] ${message}`);
}

function runCommand(command) {
  execSync(command, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });
}

function walkFiles(dir, collected = []) {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'lib') {
      continue;
    }

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, collected);
    } else if (statSync(fullPath).isFile()) {
      collected.push(fullPath);
    }
  }

  return collected;
}

function findPatternMatches(baseDir, matcher) {
  return walkFiles(join(rootDir, baseDir)).filter((filePath) =>
    matcher(readFileSync(filePath, 'utf8'), filePath),
  );
}

function assertNoMatches(files, description) {
  if (files.length === 0) {
    return;
  }

  console.error(description);
  for (const file of files) {
    console.error(`- ${file.replace(`${rootDir}\\`, '')}`);
  }
  process.exit(1);
}

for (const [index, check] of checks.entries()) {
  printHeader(index + 1, 7, check.label);
  runCommand(check.command);
}

printHeader(5, 7, 'Checking for console.log in src/');
assertNoMatches(
  findPatternMatches('src', (content) => content.includes('console.log(')),
  'Found console.log in src/. Remove debug logging before deploy.',
);

printHeader(6, 7, 'Checking for obvious hardcoded secrets');
const secretPattern =
  /(AIza[0-9A-Za-z_-]{20,}|sk_(live|test)_[0-9A-Za-z]+|-----BEGIN (RSA|EC|OPENSSH|DSA) PRIVATE KEY-----)/;
assertNoMatches(
  ['src', 'functions/src', 'scripts', '.github'].flatMap((baseDir) =>
    findPatternMatches(
      baseDir,
      (content, filePath) => !filePath.endsWith('.md') && secretPattern.test(content),
    ),
  ),
  'Found an obvious hardcoded secret pattern. Review before deploy.',
);

printHeader(7, 7, 'Building app and functions');
runCommand('npm run build');
runCommand('npm --prefix functions ci');
runCommand('npm --prefix functions run build');

console.log('\n[DONE] Pre-deploy checklist passed');
console.log(
  [
    'Summary:',
    '- lint: passed',
    '- type-check: passed',
    '- unit/integration tests: passed',
    '- security rules tests: passed',
    '- console.log scan: clean',
    '- hardcoded secret scan: clean',
    '- app build: passed',
    '- functions build: passed',
  ].join('\n'),
);
