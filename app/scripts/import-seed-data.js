import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PocketBase from 'pocketbase';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POCKETBASE_URL = 'https://pocket.brifyai.com';
const POCKETBASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJwYmNfMzE0MjYzNTgyMyIsImV4cCI6MTc2NDE4NzgyMiwiaWQiOiJ2c2Zyd2Jnb2QzMjJoN3QiLCJyZWZyZXNoYWJsZSI6dHJ1ZSwidHlwZSI6ImF1dGgifQ.sF7q2oCIizka6DyaTcGwCYfDL3JkRv0zwj_x5Lwbe0w';

async function importSeedData() {
  const pb = new PocketBase(POCKETBASE_URL);
  
  // Autenticar con API Key
  pb.authStore.save(POCKETBASE_API_KEY, null);
  
  console.log('🚀 Iniciando importación de datos de prueba...\n');
  
  try {
    // Importar radios
    const radiosPath = path.join(__dirname, '../data/seed-radios.json');
    if (fs.existsSync(radiosPath)) {
      const radiosData = JSON.parse(fs.readFileSync(radiosPath, 'utf8'));
      console.log(`📻 Importando ${radiosData.length} radios...`);
      
      for (const radio of radiosData) {
        try {
          await pb.collection('radios').create(radio);
          console.log(`   ✅ ${radio.name}`);
        } catch (error) {
          console.log(`   ❌ ${radio.name} - ${error.message}`);
        }
      }
    }
    
    // Importar frases
    const phrasesPath = path.join(__dirname, '../data/seed-phrases.json');
    if (fs.existsSync(phrasesPath)) {
      const phrasesData = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));
      console.log(`\n🎯 Importando ${phrasesData.length} frases...`);
      
      for (const phrase of phrasesData) {
        try {
          await pb.collection('phrases').create(phrase);
          console.log(`   ✅ ${phrase.phrase} (${phrase.brand})`);
        } catch (error) {
          console.log(`   ❌ ${phrase.phrase} - ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ Importación completada!');
    
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
  }
}

importSeedData();