import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];

const check = (cond, msg) => {
  if (!cond) errors.push(msg);
};

// 1. Validate app.json store metadata & required assets
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
check(Boolean(appJson?.ios?.bundleIdentifier), 'Missing expo.ios.bundleIdentifier');
check(Boolean(appJson?.android?.package), 'Missing expo.android.package');
check(
  Boolean(appJson?.ios?.infoPlist?.NSHealthShareUsageDescription),
  'Missing NSHealthShareUsageDescription in app.json',
);
check(existsSync(join(root, appJson?.icon || '')), 'Missing app icon file');
check(existsSync(join(root, 'web/public/privacy.html')), 'Missing web/public/privacy.html');
check(existsSync(join(root, 'web/public/app-ads.txt')), 'Missing web/public/app-ads.txt');

// 2. Catch Apple Review Guideline 2.1 "coming soon" placeholders in app/
function scanDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) scanDir(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      const content = readFileSync(full, 'utf8');
      if (/coming soon/i.test(content)) {
        errors.push(`Found "coming soon" copy in ${full.replace(`${root}/`, '')}`);
      }
    }
  }
}
scanDir(join(root, 'app'));

if (errors.length > 0) {
  console.error('Preflight checks failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}

// 3. Run typecheck, unit tests, and landing page production build
for (const cmd of ['npm run typecheck', 'npm test', 'npm --prefix web run build']) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root });
}

console.log('\n✓ Store preflight passed.');
