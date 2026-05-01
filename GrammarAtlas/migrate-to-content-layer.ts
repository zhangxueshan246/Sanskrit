import * as fs from 'fs';
import * as path from 'path';

// Import the current sutras data
import { sutras } from './src/data/sutras.ts';

const contentDir = './src/content/sutras';

// Create directory structure by source
const sources = {
  panini: 'panini',
  katantra: 'katantra',
  jkv: 'jkv',
  dssk: 'dssk',
  other: 'other'
};

async function migrate() {
  try {
    // Create base directory
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    // Create subdirectories for each source
    for (const dir of Object.values(sources)) {
      const sourcePath = path.join(contentDir, dir);
      if (!fs.existsSync(sourcePath)) {
        fs.mkdirSync(sourcePath, { recursive: true });
      }
    }

    // Write each sutra as a JSON file
    let count = 0;
    for (const [id, sutra] of Object.entries(sutras)) {
      const sourceDir = sources[sutra.source] || 'other';
      const filePath = path.join(contentDir, sourceDir, `${id}.json`);

      // Create clean object without the id field (will be inferred from filename)
      const sutvaData = {
        id: sutra.id,
        text: sutra.text,
        ...(sutra.translation && { translation: sutra.translation }),
        ...(sutra.vrtti && { vrtti: sutra.vrtti }),
        ...(sutra.notes && { notes: sutra.notes }),
        source: sutra.source,
        ...(sutra.adhikaras && sutra.adhikaras.length > 0 && { adhikaras: sutra.adhikaras }),
        references: sutra.references,
        ...(sutra.parallel && sutra.parallel.length > 0 && { parallel: sutra.parallel }),
        ...(sutra.sequence && sutra.sequence.length > 0 && { sequence: sutra.sequence }),
        ...(sutra.updatedAt && { updatedAt: sutra.updatedAt })
      };

      fs.writeFileSync(filePath, JSON.stringify(sutvaData, null, 2));
      count++;
      console.log(`✓ Created ${id}.json`);
    }

    console.log(`\n✅ Migration complete! Created ${count} sutra files.`);
    console.log(`📁 Files organized by source in ${contentDir}/`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
