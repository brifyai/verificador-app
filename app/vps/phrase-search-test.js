/**
 * Script de prueba para el sistema de búsqueda de frases en transcripciones
 * Ejecutar desde el VPS para probar la funcionalidad
 */

const fs = require('fs');
const path = require('path');

class PhraseSearchTester {
  constructor(recordingsDir = './recordings') {
    this.recordingsDir = recordingsDir;
  }

  /**
   * Ejecutar pruebas completas
   */
  async runTests() {
    console.log('🧪 Iniciando pruebas del sistema de búsqueda de frases\n');

    try {
      // 1. Verificar estructura de directorios
      await this.testDirectoryStructure();

      // 2. Verificar transcripciones
      await this.testTranscriptions();

      // 3. Simular búsqueda de frases
      await this.testPhraseSearch();

      // 4. Generar reporte
      await this.generateReport();

      console.log('\n✅ Todas las pruebas completadas exitosamente');
    } catch (error) {
      console.error('\n❌ Error en las pruebas:', error);
    }
  }

  /**
   * Test 1: Verificar estructura de directorios
   */
  async testDirectoryStructure() {
    console.log('📁 Test 1: Verificando estructura de directorios...');

    if (!fs.existsSync(this.recordingsDir)) {
      throw new Error(`Directorio de grabaciones no existe: ${this.recordingsDir}`);
    }

    const folders = this.findRecordingFolders();
    console.log(`   ✓ Encontradas ${folders.length} carpetas de grabaciones`);

    if (folders.length === 0) {
      console.log('   ⚠️ No hay carpetas de grabaciones para analizar');
    } else {
      console.log(`   ✓ Carpeta más reciente: ${folders[0].name}`);
    }
  }

  /**
   * Test 2: Verificar transcripciones
   */
  async testTranscriptions() {
    console.log('\n📝 Test 2: Verificando transcripciones...');

    const folders = this.findRecordingFolders();
    let totalTranscriptions = 0;
    let totalWords = 0;

    for (const folder of folders) {
      const transcriptionPath = path.join(folder.path, 'transcription.txt');
      
      if (fs.existsSync(transcriptionPath)) {
        totalTranscriptions++;
        const text = fs.readFileSync(transcriptionPath, 'utf8');
        const wordCount = text.split(/\s+/).length;
        totalWords += wordCount;
      }
    }

    console.log(`   ✓ Transcripciones encontradas: ${totalTranscriptions}/${folders.length}`);
    console.log(`   ✓ Total de palabras: ${totalWords.toLocaleString()}`);

    if (totalTranscriptions === 0) {
      console.log('   ⚠️ No hay transcripciones disponibles');
      console.log('   💡 Ejecuta transcription-manager.js para generar transcripciones');
    }
  }

  /**
   * Test 3: Simular búsqueda de frases
   */
  async testPhraseSearch() {
    console.log('\n🔍 Test 3: Simulando búsqueda de frases...');

    // Frases de prueba comunes en publicidad chilena
    const testPhrases = [
      'coca cola',
      'banco estado',
      'movistar',
      'entel',
      'falabella',
      'ripley',
      'lider',
      'jumbo',
      'copec',
      'shell'
    ];

    const folders = this.findRecordingFolders();
    const results = [];

    for (const folder of folders) {
      const transcriptionPath = path.join(folder.path, 'transcription.txt');
      
      if (!fs.existsSync(transcriptionPath)) continue;

      const text = fs.readFileSync(transcriptionPath, 'utf8');
      const normalizedText = text.toLowerCase();

      for (const phrase of testPhrases) {
        const matches = this.findAllOccurrences(normalizedText, phrase);
        
        if (matches.length > 0) {
          results.push({
            folder: folder.name,
            phrase: phrase,
            matches: matches.length,
            positions: matches
          });
        }
      }
    }

    console.log(`   ✓ Búsqueda completada en ${folders.length} grabaciones`);
    console.log(`   ✓ Coincidencias encontradas: ${results.length}`);

    if (results.length > 0) {
      console.log('\n   📊 Resultados de búsqueda:');
      results.slice(0, 5).forEach(result => {
        console.log(`      • "${result.phrase}" en ${result.folder}: ${result.matches} vez/veces`);
      });
      
      if (results.length > 5) {
        console.log(`      ... y ${results.length - 5} más`);
      }
    } else {
      console.log('   ℹ️ No se encontraron coincidencias con las frases de prueba');
    }

    return results;
  }

  /**
   * Test 4: Generar reporte
   */
  async generateReport() {
    console.log('\n📄 Test 4: Generando reporte...');

    const folders = this.findRecordingFolders();
    const report = {
      timestamp: new Date().toISOString(),
      recordingsDir: this.recordingsDir,
      summary: {
        totalFolders: folders.length,
        foldersWithTranscriptions: 0,
        totalWords: 0,
        averageWordsPerTranscription: 0
      },
      folders: []
    };

    for (const folder of folders) {
      const transcriptionPath = path.join(folder.path, 'transcription.txt');
      const metadataPath = path.join(folder.path, 'transcription.json');
      
      const folderInfo = {
        name: folder.name,
        created: folder.created,
        hasTranscription: fs.existsSync(transcriptionPath),
        hasMetadata: fs.existsSync(metadataPath),
        wordCount: 0
      };

      if (folderInfo.hasTranscription) {
        report.summary.foldersWithTranscriptions++;
        const text = fs.readFileSync(transcriptionPath, 'utf8');
        folderInfo.wordCount = text.split(/\s+/).length;
        report.summary.totalWords += folderInfo.wordCount;
      }

      if (folderInfo.hasMetadata) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        folderInfo.metadata = metadata;
      }

      report.folders.push(folderInfo);
    }

    if (report.summary.foldersWithTranscriptions > 0) {
      report.summary.averageWordsPerTranscription = Math.round(
        report.summary.totalWords / report.summary.foldersWithTranscriptions
      );
    }

    // Guardar reporte
    const reportPath = path.join(this.recordingsDir, 'phrase-search-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`   ✓ Reporte generado: ${reportPath}`);
    console.log(`   ✓ Carpetas analizadas: ${report.summary.totalFolders}`);
    console.log(`   ✓ Con transcripciones: ${report.summary.foldersWithTranscriptions}`);
    console.log(`   ✓ Promedio de palabras: ${report.summary.averageWordsPerTranscription}`);
  }

  /**
   * Encuentra todas las ocurrencias de una frase en un texto
   */
  findAllOccurrences(text, phrase) {
    const positions = [];
    let position = 0;

    while ((position = text.indexOf(phrase, position)) !== -1) {
      positions.push(position);
      position += phrase.length;
    }

    return positions;
  }

  /**
   * Encuentra carpetas de grabaciones
   */
  findRecordingFolders() {
    const folders = [];

    if (!fs.existsSync(this.recordingsDir)) {
      return folders;
    }

    const items = fs.readdirSync(this.recordingsDir);

    for (const item of items) {
      const itemPath = path.join(this.recordingsDir, item);
      
      try {
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          folders.push({
            name: item,
            path: itemPath,
            created: stat.birthtime
          });
        }
      } catch (error) {
        console.error(`Error leyendo ${itemPath}:`, error.message);
      }
    }

    return folders.sort((a, b) => b.created - a.created);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const recordingsDir = process.argv[2] || './recordings';
  const tester = new PhraseSearchTester(recordingsDir);
  
  console.log('🎙️ Sistema de Búsqueda de Frases - Pruebas');
  console.log(`📁 Directorio: ${recordingsDir}\n`);
  
  tester.runTests().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

module.exports = PhraseSearchTester;
