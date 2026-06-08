const fs = require('node:fs');
const path = require('node:path');

const projectRoot = process.cwd();
const sourceDir = path.join(projectRoot, 'prisma', 'services');
const targetDir = path.join(projectRoot, 'dist', 'prisma', 'services');

fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });

console.log(`Copied Prisma service assets to ${targetDir}`);
