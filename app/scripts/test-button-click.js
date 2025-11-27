// Script para probar el botón de grabación
const puppeteer = require('puppeteer');

async function testButtonClick() {
  console.log('🧪 Iniciando prueba de botón Escuchar...');
  
  const browser = await puppeteer.launch({
    headless: false, // Ver el navegador
    slowMo: 100, // Ralentizar las acciones para ver mejor
    devtools: true // Abrir devtools para ver logs
  });
  
  try {
    const page = await browser.newPage();
    
    // Habilitar logs de consola
    page.on('console', msg => {
      console.log('📱 Console:', msg.text());
    });
    
    // Habilitar logs de errores
    page.on('pageerror', error => {
      console.log('❌ Page error:', error.message);
    });
    
    // Navegar a la página
    console.log('🌐 Navegando a http://localhost:3000/radios...');
    await page.goto('http://localhost:3000/radios', { waitUntil: 'networkidle2' });
    
    // Esperar a que carguen las tarjetas de radio
    console.log('⏳ Esperando tarjetas de radio...');
    await page.waitForSelector('[data-radiocard]', { timeout: 30000 });
    
    // Obtener la primera tarjeta de radio activa
    const activeRadioCards = await page.$$('[data-radiocard]');
    console.log(`📻 Encontradas ${activeRadioCards.length} tarjetas de radio`);
    
    if (activeRadioCards.length === 0) {
      console.log('⚠️ No se encontraron tarjetas de radio activas');
      return;
    }
    
    // Tomar la primera tarjeta
    const firstCard = activeRadioCards[0];
    
    // Verificar si tiene el botón Escuchar
    const listenButton = await firstCard.$('button:has-text("Escuchar")');
    if (!listenButton) {
      console.log('⚠️ No se encontró el botón Escuchar en la primera tarjeta');
      
      // Mostrar todos los botones disponibles
      const buttons = await firstCard.$$('button');
      for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].textContent();
        console.log(`Botón ${i}: "${text}"`);
      }
      return;
    }
    
    console.log('🎯 Botón Escuchar encontrado, haciendo clic...');
    
    // Hacer clic en el botón
    await listenButton.click();
    
    console.log('✅ Click realizado, esperando respuesta...');
    
    // Esperar unos segundos para ver los logs
    await page.waitForTimeout(5000);
    
    console.log('🎉 Prueba completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    // Mantener el navegador abierto para ver los logs
    console.log('🔍 El navegador se mantendrá abierto. Presiona Enter para cerrar...');
    await new Promise(() => {});
    // await browser.close();
  }
}

// Ejecutar la prueba
testButtonClick().catch(console.error);