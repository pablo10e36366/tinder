const fs = require('fs');
const path = require('path');

const services = process.argv.slice(2);

if (services.length === 0) {
  console.error('Usage: node scripts/copy-prisma-generated.cjs <service> [...]');
  process.exit(1);
}

for (const service of services) {
  const sourceDir = path.join(
    process.cwd(),
    'apps',
    service,
    'prisma',
    'generated',
  );
  const targetDir = path.join(
    process.cwd(),
    'dist',
    'apps',
    service,
    'apps',
    service,
    'prisma',
    'generated',
  );

  if (!fs.existsSync(sourceDir)) {
    console.error(`Generated Prisma client not found for ${service}: ${sourceDir}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log(`Copied Prisma generated client for ${service} to ${targetDir}`);
}
