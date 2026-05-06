import * as fs from 'fs';
import * as path from 'path';

const sutraDir = path.join(process.cwd(), 'src/content/sutras');

function stampDir(dir: string) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      stampDir(fullPath);
    } else if (file.endsWith('.json')) {
      const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      content.updatedAt = Math.floor(fs.statSync(fullPath).mtimeMs);
      fs.writeFileSync(fullPath, JSON.stringify(content, null, 2) + '\n');
      console.log(`Stamped: ${file} → ${new Date(content.updatedAt).toISOString()}`);
    }
  }
}

stampDir(sutraDir);
console.log('Done.');
