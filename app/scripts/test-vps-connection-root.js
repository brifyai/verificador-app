#!/usr/bin/env node

/**
 * Script de prueba para verificar conexión SSH al VPS con credenciales ROOT
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuración de conexión SSH con credenciales ROOT
const SSH_CONFIG = {
  host: '213.199.39.147',
  username: 'root', // NOTA: Linux usa "root" en minúsculas, no "Root"
  password: 'Aintelligence2025'
};

async function testSSHConnection() {
  console.log('🔌 PROBANDO CONEXIÓN SSH AL VPS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`🖥️  Host: ${SSH_CONFIG.host}`);
  console.log(`👤 Usuario: ${SSH_CONFIG.username}`);
  console.log(`🔑 Contraseña: ${'*'.repeat(SSH_CONFIG.password.length)}\n`);

  // Método 1: Usar sshpass directamente
  console.log('1️⃣  Intentando conexión con sshpass...');
  const sshCmd = `sshpass -p '${SSH_CONFIG.password}' ssh -o StrictHostKeyChecking=no ${SSH_CONFIG.username}@${SSH_CONFIG.host} "echo 'Conexión exitosa'"`;
  
  try {
    const { stdout, stderr } = await execAsync(sshCmd, { timeout: 30000 });
    
    if (stderr && !stderr.includes('Warning: Permanently added')) {
      console.log('⚠️  STDERR:', stderr);
    }
    
    if (stdout && stdout.includes('Conexión exitosa')) {
      console.log('✅ CONEXIÓN SSH ESTABLECIDA CORRECTAMENTE');
      console.log('📤 Respuesta del servidor:', stdout.trim());
      return true;
    } else {
      console.log('❌ Conexión fallida o respuesta inesperada');
      console.log('📤 Respuesta:', stdout);
      return false;
    }
  } catch (error) {
    console.log('❌ Error en conexión SSH:', error.message);
    
    // Intentar método alternativo con sshpass -e
    console.log('\n2️⃣  Intentando método alternativo...');
    try {
      const altCmd = `SSHPASS='${SSH_CONFIG.password}' sshpass -e ssh -o StrictHostKeyChecking=no ${SSH_CONFIG.username}@${SSH_CONFIG.host} "whoami && hostname"`;
      const { stdout: altStdout } = await execAsync(altCmd, { timeout: 30000 });
      
      if (altStdout.includes('root') || altStdout.includes('213.199.39.147')) {
        console.log('✅ CONEXIÓN ALTERNATIVA EXITOSA');
        console.log('📤 Respuesta:', altStdout.trim());
        return true;
      }
    } catch (altError) {
      console.log('❌ Método alternativo también falló:', altError.message);
    }
    
    return false;
  }
}

async function runBasicDiagnostics() {
  console.log('\n🔍 EJECUTANDO DIAGNÓSTICOS BÁSICOS\n');
  
  // Comando simple para verificar conectividad
  const basicCmd = `sshpass -p '${SSH_CONFIG.password}' ssh -o StrictHostKeyChecking=no ${SSH_CONFIG.username}@${SSH_CONFIG.host} "pwd && ls -la"`;
  
  try {
    const { stdout, stderr } = await execAsync(basicCmd, { timeout: 30000 });
    
    if (stderr && !stderr.includes('Warning: Permanently added')) {
      console.log('⚠️  STDERR:', stderr);
    }
    
    console.log('📁 Directorio actual y contenido:');
    console.log(stdout);
    
    return true;
  } catch (error) {
    console.log('❌ Error en diagnósticos básicos:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 INICIANDO PRUEBA DE CONEXIÓN VPS\n');
  
  const connected = await testSSHConnection();
  
  if (connected) {
    console.log('\n✅ La conexión SSH está funcionando correctamente');
    
    // Ejecutar diagnósticos básicos
    await runBasicDiagnostics();
    
    console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ Credenciales ROOT válidas');
    console.log('✅ Conexión SSH establecida');
    console.log('✅ Puedes proceder con el diagnóstico completo');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
  } else {
    console.log('\n❌ NO SE PUDO ESTABLECER CONEXIÓN SSH');
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🔧 POSIBLES SOLUCIONES:');
    console.log('1. Verifica que la contraseña "Aintelligence2025" sea correcta');
    console.log('2. Verifica que el usuario sea "root" (minúsculas)');
    console.log('3. Verifica que el VPS esté encendido y accesible');
    console.log('4. Verifica que el puerto 22 (SSH) esté abierto en el firewall');
    console.log('5. Intenta conectarte manualmente desde la terminal:');
    console.log('   ssh root@213.199.39.147');
    console.log('═══════════════════════════════════════════════════════════════\n');
  }
}

// Ejecutar prueba
main().catch(error => {
  console.error('❌ Error inesperado:', error);
  process.exit(1);
});