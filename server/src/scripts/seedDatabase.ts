import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import { fileURLToPath } from 'url';
import { seedDefaultStories } from '../controllers/gameController.js';
import Story from '../models/StoryData.js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hellodetective';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB successfully.');

  console.log('Running seedDefaultStories()...');
  await seedDefaultStories();
  console.log('seedDefaultStories() completed.');

  const stories = await Story.find();
  console.log(`\nVerified database contents: ${stories.length} stories found.`);
  stories.forEach((s) => {
    console.log(`- [${s.caseNumber}] "${s.title}" (Archetype: ${s.archetype || s.groundTruth?.archetype || 'N/A'})`);
    console.log(`  Locations: ${s.locations.length} total, ${(s.locations as any[]).filter(l => l.isInitiallyUnlocked).length} initially unlocked`);
    console.log(`  Evidence: ${s.evidence.length} total, ${(s.evidence as any[]).filter(e => e.isInitiallyUnlocked).length} initially unlocked`);
    console.log(`  Suspects: ${s.suspects.length} total, ${(s.suspects as any[]).filter(su => su.isInitiallyUnlocked).length} initially unlocked`);
  });

  await mongoose.disconnect();
  console.log('\nDatabase seeding and verification complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
