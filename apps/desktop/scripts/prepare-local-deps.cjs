'use strict';

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

(function main() {
  const repoRoot = path.resolve(__dirname, '../../../');
  const desktopDir = path.resolve(__dirname, '..');
  const packsDir = path.join(desktopDir, '.packs');
  ensureDir(packsDir);

  // Local workspace packages to include in the desktop app without symlinks
  const packages = [
    { name: '@wsolut/websolut-core', dir: path.join(repoRoot, 'packages/core') },
    { name: 'websolut-backend', dir: path.join(repoRoot, 'apps/backend') },
  ];

  const tarballs = [];

  for (const pkg of packages) {
    if (!fs.existsSync(pkg.dir)) {
      console.warn(`[prepare-local-deps] Skipping missing package dir: ${pkg.dir}`);
      continue;
    }

    // Build the package if it has a build script
    try {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(pkg.dir, 'package.json'), 'utf8'));
      if (pkgJson.scripts && pkgJson.scripts.build) {
        console.log(`[prepare-local-deps] Building ${pkg.name}...`);
        run('npm run build', { cwd: pkg.dir });
      }
    } catch (e) {
      console.warn(`[prepare-local-deps] Could not read package.json in ${pkg.dir}: ${e.message}`);
    }

  console.log(`[prepare-local-deps] Packing ${pkg.name}...`);
  // Disable lifecycle scripts (husky etc.) to keep JSON output clean
  const out = run('npm pack --json', { cwd: pkg.dir, env: { ...process.env, HUSKY: '0', npm_config_ignore_scripts: 'true' } });
  // Some tools may write non-JSON to stdout; attempt to parse from last '[' character
  const jsonStart = out.indexOf('[');
  const jsonStr = jsonStart >= 0 ? out.slice(jsonStart) : out;
  const data = JSON.parse(jsonStr)[0];
    const filename = data && (data.filename || data.name);
    if (!filename) {
      throw new Error(`npm pack did not return a filename for ${pkg.name}`);
    }
    const srcTgz = path.join(pkg.dir, filename);
    const destTgz = path.join(packsDir, filename);
    fs.copyFileSync(srcTgz, destTgz);
    fs.unlinkSync(srcTgz);
    tarballs.push(destTgz);
  }

  if (!tarballs.length) {
    console.log('[prepare-local-deps] No tarballs to install.');
    return;
  }

  // Install tarballs into desktop app to replace workspace symlinks
  const installCmd = `npm i --no-save ${tarballs.map((t) => JSON.stringify(path.relative(desktopDir, t))).join(' ')}`;
  console.log(`[prepare-local-deps] Installing tarballs into desktop: ${installCmd}`);
  run(installCmd, { cwd: desktopDir });

  console.log('[prepare-local-deps] Done.');
})();
