#!/usr/bin/env node

// Import the main stream verifier function
const { verifyStreamLegacy } = require('./lib/stream-verifier-legacy');

async function testChoapaVerification() {
  const streamUrl = 'https://cast.tunzilla.com/http://sonic.portalfoxmix.club:8106/stream';
  const radioId = 'radio_mijm9xsk_6oxkrbx';
  
  console.log('🔍 Testing Radio Choapa with legacy verifier...');
  console.log('URL:', streamUrl);
  console.log('Radio ID:', radioId);
  console.log('');
  
  try {
    const result = await verifyStreamLegacy(streamUrl, radioId);
    
    console.log('✅ Verification completed!');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.isOnline) {
      console.log('\n🎉 STREAM IS ONLINE!');
      console.log('Status:', result.status);
      console.log('Platform:', result.platform);
      console.log('Content Type:', result.contentType);
    } else {
      console.log('\n❌ Stream appears to be offline');
      console.log('Status:', result.status);
      console.log('Error:', result.error);
    }
    
  } catch (error) {
    console.log('❌ Verification failed with error:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the test
testChoapaVerification().catch(console.error);