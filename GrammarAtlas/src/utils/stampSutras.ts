import * as fs from 'fs';
import * as path from 'path';

const sutraDir = path.join(process.cwd(), 'src/content/sutras');

function stampDir(dir: string) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      stampDir(fullPath);
    } else if (file.endsWith('.json')) {
      const stats = fs.statSync(fullPath);
      const mtime = stats.mtime.getTime();

      const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

      // 如果文件的mtime比updatedAt新，说明文件被修改了
      if (!content.updatedAt || mtime > content.updatedAt) {
        content.updatedAt = mtime;
        fs.writeFileSync(fullPath, JSON.stringify(content, null, 2) + '\n');
        // 恢复原来的mtime和atime
        fs.utimesSync(fullPath, stats.atime, stats.mtime);
        console.log(`Stamped: ${file} → ${new Date(mtime).toISOString()}`);
      } else {
        console.log(`Skipped: ${file} (no changes since last stamp)`);
      }
    }
  }
}

stampDir(sutraDir);
console.log('Done.');
