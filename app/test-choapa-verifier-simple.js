#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Test the Choapa stream URL using the same logic as our successful test
const streamUrl = 'https://cast.tunzilla.com/http://sonic.portalfoxmix.club:8106/stream';

console.log('🔍 Testing Radio Choapa stream with simple verification...');
console.log('URL:', streamUrl);
console.log('');

async function verifyChoapaStream() {
  try {
    // Test 1: Try HEAD request first
    console.log('1. Testing with HEAD request...');
    const url = new URL(streamUrl);
    
    let headResult;
    try {
      const headOptions = {
        method: 'HEAD',
        timeout: 5000, // Shorter timeout for HEAD
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
        }
      };
      
      headResult = await new Promise((resolve, reject) => {
        const req = https.request(url, headOptions, (res) => {
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('HEAD request timeout'));
        });
        
        req.end();
      });
      
      console.log('HEAD Response:', headResult.statusCode, headResult.statusMessage);
    } catch (error) {
      console.log('HEAD request failed:', error.message);
      headResult = { statusCode: 0, headers: {} };
    }
    
    // If HEAD fails or times out, try RANGE request
    if (headResult.statusCode !== 200) {
      console.log('\n2. HEAD failed, trying RANGE request...');
      
      const rangeOptions = {
        method: 'GET',
        timeout: 10000,
        headers: {
          'Range': 'bytes=0-1024',
          'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
        }
      };
      
      const rangeResult = await new Promise((resolve, reject) => {
        const req = https.request(url, rangeOptions, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              dataLength: data.length
            });
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('RANGE request timeout'));
        });
        
        req.end();
      });
      
      console.log('RANGE Response:', rangeResult.statusCode);
      console.log('Content-Type:', rangeResult.headers['content-type']);
      
      if (rangeResult.statusCode === 206 || rangeResult.statusCode === 200) {
        const contentType = rangeResult.headers['content-type'] || '';
        if (contentType.includes('audio') || contentType.includes('mpeg')) {
          console.log('\n✅ STREAM IS ONLINE!');
          console.log('Platform: TUNZILLA (proxy service)');
          console.log('Content-Type:', contentType);
          return true;
        }
      }
    } else {
      // HEAD request succeeded
      const contentType = headResult.headers['content-type'] || '';
      if (contentType.includes('audio') || contentType.includes('mpeg')) {
        console.log('\n✅ STREAM IS ONLINE!');
        console.log('Platform: TUNZILLA (proxy service)');
        console.log('Content-Type:', contentType);
        return true;
      }
    }
    
    console.log('\n❌ Stream appears to be offline');
    return false;
    
  } catch (error) {
    console.log('\n❌ Verification failed:', error.message);
    return false;
  }
}

// Run the verification
verifyChoapaStream().then(isOnline => {
  console.log('\n🎯 Final Result:', isOnline ? 'ONLINE' : 'OFFLINE');
}).catch(error => {
  console.error('💥 Error:', error);
});