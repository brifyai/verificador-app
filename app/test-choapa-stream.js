#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Test the Choapa stream URL
const streamUrl = 'https://cast.tunzilla.com/http://sonic.portalfoxmix.club:8106/stream';

console.log('🔍 Testing Radio Choapa stream...');
console.log('URL:', streamUrl);

// First try with HEAD request
console.log('\n1. Testing with HEAD request...');
const url = new URL(streamUrl);

const options = {
  method: 'HEAD',
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
  }
};

const req = https.request(url, options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Status Message:', res.statusMessage);
  console.log('Headers:', res.headers);
  
  // Check if it's a redirect
  if (res.statusCode >= 300 && res.statusCode < 400) {
    console.log('\n🔗 Redirect detected, following to:', res.headers.location);
    followRedirect(res.headers.location);
  } else if (res.statusCode === 200) {
    console.log('✅ Stream is ONLINE (HEAD request successful)');
    testWithRangeRequest();
  } else if (res.statusCode === 400) {
    console.log('⚠️  Got 400, trying RANGE request...');
    testWithRangeRequest();
  } else {
    console.log('❌ Unexpected status code');
    testWithRangeRequest();
  }
});

req.on('error', (err) => {
  console.log('❌ HEAD request failed:', err.message);
  console.log('\n2. Testing with RANGE request...');
  testWithRangeRequest();
});

req.on('timeout', () => {
  console.log('⏰ HEAD request timeout');
  req.destroy();
  testWithRangeRequest();
});

req.end();

function followRedirect(location) {
  console.log('\n🔀 Following redirect to:', location);
  
  const redirectUrl = new URL(location);
  const redirectOptions = {
    method: 'HEAD',
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
    }
  };
  
  const redirectReq = https.request(redirectUrl, redirectOptions, (res) => {
    console.log('Redirect Response Status:', res.statusCode);
    console.log('Redirect Response Headers:', res.headers);
    
    if (res.statusCode === 200) {
      console.log('✅ Redirected stream is ONLINE');
    } else {
      console.log('❌ Redirected stream returned:', res.statusCode);
    }
  });
  
  redirectReq.on('error', (err) => {
    console.log('❌ Redirect request failed:', err.message);
  });
  
  redirectReq.on('timeout', () => {
    console.log('⏰ Redirect request timeout');
    redirectReq.destroy();
  });
  
  redirectReq.end();
}

function testWithRangeRequest() {
  console.log('\n3. Testing with RANGE request (bytes=0-1024)...');
  
  const rangeOptions = {
    method: 'GET',
    timeout: 10000,
    headers: {
      'Range': 'bytes=0-1024',
      'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
    }
  };
  
  const rangeReq = https.request(url, rangeOptions, (res) => {
    console.log('Range Request Status:', res.statusCode);
    console.log('Range Request Headers:', res.headers);
    
    if (res.statusCode === 206) { // Partial content
      console.log('✅ Range request successful - stream is ONLINE');
      checkContentType(res.headers);
    } else if (res.statusCode === 200) {
      console.log('✅ Got 200 response - stream is ONLINE');
      checkContentType(res.headers);
    } else if (res.statusCode === 400) {
      console.log('⚠️  Got 400 from range request, trying direct connection...');
      testDirectConnection();
    } else {
      console.log('❌ Range request failed with status:', res.statusCode);
      testDirectConnection();
    }
    
    // Consume the response to avoid hanging
    res.on('data', () => {});
    res.on('end', () => {});
  });
  
  rangeReq.on('error', (err) => {
    console.log('❌ Range request failed:', err.message);
    testDirectConnection();
  });
  
  rangeReq.on('timeout', () => {
    console.log('⏰ Range request timeout');
    rangeReq.destroy();
    testDirectConnection();
  });
  
  rangeReq.end();
}

function testDirectConnection() {
  console.log('\n4. Testing direct connection to sonic.portalfoxmix.club:8106...');
  
  const directOptions = {
    hostname: 'sonic.portalfoxmix.club',
    port: 8106,
    path: '/stream',
    method: 'GET',
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RadioVerifier/1.0)'
    }
  };
  
  const directReq = http.request(directOptions, (res) => {
    console.log('Direct Connection Status:', res.statusCode);
    console.log('Direct Connection Headers:', res.headers);
    
    if (res.statusCode === 200) {
      console.log('✅ Direct connection successful - stream is ONLINE');
      checkContentType(res.headers);
    } else {
      console.log('❌ Direct connection failed with status:', res.statusCode);
    }
    
    // Consume the response
    res.on('data', () => {});
    res.on('end', () => {});
  });
  
  directReq.on('error', (err) => {
    console.log('❌ Direct connection failed:', err.message);
  });
  
  directReq.on('timeout', () => {
    console.log('⏰ Direct connection timeout');
    directReq.destroy();
  });
  
  directReq.end();
}

function checkContentType(headers) {
  const contentType = headers['content-type'] || headers['Content-Type'];
  if (contentType) {
    console.log('📄 Content-Type:', contentType);
    if (contentType.includes('audio') || contentType.includes('mpeg')) {
      console.log('🎵 Confirmed audio stream');
    }
  }
}