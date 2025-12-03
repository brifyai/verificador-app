// Script para eliminar grabaciones específicas del VPS
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function deleteVPSRecordings() {
  try {
    console.log('🗑️ Eliminando grabaciones específicas del VPS...');
    
    // Archivos a eliminar (rutas completas en el VPS)
    const filesToDelete = [
      '/home/radioapp/radio-recorder/recordings/2025-12-02/00/radio_mijm9xci_rj949ks_20251202_004618_b8100d7d-90bb-4475-865c-3bdbe590ceba.mp3',
      '/home/radioapp/radio-recorder/recordings/2025-12-01/20/radio_mijm9xsi_6nx1sqf_20251201_201205_62f9e282-1998-403d-9057-7f12796fe807.mp3',
      '/home/radioapp/radio-recorder/recordings/2025-12-01/20/radio_mijm9xsi_6nx1sqf_20251201_200216_62f9e282-1998-403d-9057-7f12796fe807.mp3'
    ];
    
    let totalDeleted = 0;
    
    for (const filePath of filesToDelete) {
      console.log(`🔍 Verificando archivo: ${filePath}`);
      
      try {
        // Verificar si el archivo existe
        const { stdout: checkOutput, stderr: checkError } = await execPromise(`ssh root@213.199.39.147 "ls -la '${filePath}'"`);
        
        if (checkOutput) {
          console.log(`📋 Archivo encontrado: ${filePath}`);
          
          // Eliminar el archivo
          const { stdout: deleteOutput, stderr: deleteError } = await execPromise(`ssh root@213.199.39.147 "rm -f '${filePath}'"`);
          
          if (deleteError) {
            console.error(`❌ Error eliminando archivo ${filePath}:`, deleteError);
          } else {
            console.log(`✅ Archivo eliminado exitosamente: ${filePath}`);
            totalDeleted++;
          }
        } else {
          console.log(`⚠️ Archivo no encontrado: ${filePath}`);
        }
      } catch (error) {
        if (error.message.includes('No such file')) {
          console.log(`⚠️ Archivo no existe: ${filePath}`);
        } else {
          console.error(`❌ Error verificando archivo ${filePath}:`, error.message);
        }
      }
    }
    
    // También verificar y eliminar carpetas vacías
    console.log('\n🧹 Limpiando carpetas vacías...');
    
    const foldersToCheck = [
      '/home/radioapp/radio-recorder/recordings/2025-12-02/00',
      '/home/radioapp/radio-recorder/recordings/2025-12-01/20',
      '/home/radioapp/radio-recorder/recordings/2025-12-02',
      '/home/radioapp/radio-recorder/recordings/2025-12-01'
    ];
    
    for (const folderPath of foldersToCheck) {
      try {
        // Verificar si la carpeta está vacía
        const { stdout: folderOutput } = await execPromise(`ssh root@213.199.39.147 "ls -A '${folderPath}' | wc -l"`);
        
        if (parseInt(folderOutput.trim()) === 0) {
          console.log(`📁 Carpeta vacía detectada: ${folderPath}`);
          
          // Eliminar carpeta vacía
          const { stdout: deleteFolderOutput, stderr: deleteFolderError } = await execPromise(`ssh root@213.199.39.147 "rmdir '${folderPath}'"`);
          
          if (deleteFolderError) {
            console.error(`❌ Error eliminando carpeta ${folderPath}:`, deleteFolderError);
          } else {
            console.log(`✅ Carpeta vacía eliminada: ${folderPath}`);
          }
        } else {
          console.log(`ℹ️ Carpeta contiene archivos, no se elimina: ${folderPath}`);
        }
      } catch (error) {
        if (error.message.includes('No such file')) {
          console.log(`ℹ️ Carpeta no existe: ${folderPath}`);
        } else {
          console.error(`❌ Error verificando carpeta ${folderPath}:`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 Proceso completado. Total de archivos eliminados: ${totalDeleted}`);
    
    // Reiniciar el servicio de grabaciones del VPS para que detecte los cambios
    console.log('\n🔄 Reiniciando servicio de grabaciones del VPS...');
    try {
      const { stdout: restartOutput, stderr: restartError } = await execPromise('ssh root@213.199.39.147 "systemctl restart radio-recorder"');
      
      if (restartError) {
        console.error('❌ Error reiniciando servicio:', restartError);
      } else {
        console.log('✅ Servicio reiniciado exitosamente');
      }
    } catch (restartError) {
      console.error('❌ Error reiniciando servicio:', restartError.message);
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

deleteVPSRecordings();