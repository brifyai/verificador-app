// Script simple para probar la detección de Tunzilla
const https = require('https');
const http = require('http');

function detectStreamType(url) {
  const u = url.toLowerCase();
  if (u.includes('.m3u8') || u.includes('/hls/')) return 'HLS';
  if (u.includes('.mpd')) return 'DASH';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YOUTUBE';
  if (u.includes('twitch.tv')) return 'TWITCH';
  if (u.includes('facebook.com')) return 'FACEBOOK';
  if (u.includes('shoutcast') || u.includes(':8080')) return 'SHOUTCAST';
  if (u.includes('icecast') || u.includes(':8000')) return 'ICECAST';
  if (u.includes('zeno.fm')) return 'ZENO';
  if (u.includes('tunzilla.com')) return 'TUNZILLA';
  if (u.startsWith('http://') || u.startsWith('https://')) return 'DIRECT';
  return 'OTHER';
}

async function testTunzillaDetection() {
  const url = 'https://cast.tunzilla.com/http://sonic.portalfoxmix.club:8106/stream';
  
  console.log('🧪 Probando detección de Tunzilla...');
  console.log('URL:', url);
  
  const streamType = detectStreamType(url);
  console.log('Stream Type detectado:', streamType);
  
  if (streamType === 'TUNZILLA') {
    console.log('✅ ¡ÉXITO! La URL de Radio Choapa se detecta correctamente como TUNZILLA');
    
    // Probar verificación simple
    console.log('\n🔍 Probando verificación simple...');
    
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        method: 'HEAD',
        timeout: 10000,
        headers: {
          'User-Agent': 'OndaVerificada-StreamVerifier/1.0'
        }
      };
      
      const req = client.request(url, options, (res) => {
        console.log('HEAD Response Status:', res.statusCode);
        console.log('HEAD Content-Type:', res.headers['content-type']);
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
          console.log('✅ HEAD request exitoso - el stream está ONLINE');
        } else {
          console.log('❌ HEAD request falló - probando RANGE...');
          testRangeRequest();
        }
        
        resolve();
      });
      
      req.on('error', (err) => {
        console.log('❌ HEAD request error:', err.message);
        console.log('🔧 Probando con RANGE request...');
        testRangeRequest();
        resolve();
      });
      
      req.on('timeout', () => {
        console.log('⏰ HEAD request timeout - probando RANGE...');
        req.destroy();
        testRangeRequest();
        resolve();
      });
      
      req.end();
    });
    
  } else {
    console.log('❌ FAIL: La URL no se detecta como TUNZILLA');
  }
}

function testRangeRequest() {
  const url = 'https://cast.tunzilla.com/http://sonic.portalfoxmix.club:8106/stream';
  
  console.log('\n🔍 Probando RANGE request...');
  
  const urlObj = new URL(url);
  const client = urlObj.protocol === 'https:' ? https : http;
  
  const options = {
    method: 'GET',
    timeout: 15000,
    headers: {
      'User-Agent': 'OndaVerificada-StreamVerifier/1.0',
      'Range': 'bytes=0-0',
      'Accept': 'audio/*, */*'
    }
  };
  
  const req = client.request(url, options, (res) => {
    console.log('RANGE Response Status:', res.statusCode);
    console.log('RANGE Content-Type:', res.headers['content-type']);
    
    if (res.statusCode === 206 || res.statusCode === 200 || res.statusCode === 302) {
      console.log('✅ RANGE request exitoso - el stream está ONLINE');
    } else {
      console.log('❌ RANGE request también falló');
    }
  });
  
  req.on('error', (err) => {
    console.log('❌ RANGE request error:', err.message);
  });
  
  req.on('timeout', () => {
    console.log('⏰ RANGE request timeout');
    req.destroy();
  });
  
  req.end();
}

// Ejecutar prueba
testTunzillaDetection().catch(console.error);