import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const sutraDir = path.join(process.cwd(), 'src/content/sutras');

function hasUncommittedChanges(filePath: string): boolean {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const result = execSync(`git status --porcelain "${relativePath}"`, { encoding: 'utf-8' }).trim();
  return result.length > 0;
}

function stampDir(dir: string) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      stampDir(fullPath);
    } else if (file.endsWith('.json')) {
      if (!hasUncommittedChanges(fullPath)) {
        console.log(`Skipped: ${file} (no changes)`);
        continue;
      }
      const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      content.updatedAt = Date.now();
      fs.writeFileSync(fullPath, JSON.stringify(content, null, 2) + '\n');
      console.log(`Stamped: ${file} → ${new Date(content.updatedAt).toISOString()}`);
    }
  }
}

stampDir(sutraDir);
console.log('Done.');
