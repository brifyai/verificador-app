// Test script to verify streaming platform updates
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const RADIO_ID = 'radio-1'; // Update with your test radio ID

async function testStreamingPlatformUpdate() {
  console.log('🧪 Testing streaming platform update...');
  
  try {
    // Get current radio data
    console.log('📻 Getting current radio data...');
    const getResponse = await axios.get(`${API_BASE}/radios-direct/${RADIO_ID}`);
    const radio = getResponse.data;
    
    console.log('Current radio data:', {
      id: radio.id,
      name: radio.name,
      streamPlatform: radio.metadata?.streamPlatform,
      streamUrl: radio.streamUrl
    });
    
    // Update streaming platform
    const newPlatform = 'shoutcast';
    const updateData = {
      name: radio.name,
      region: radio.region,
      city: radio.metadata?.city || '',
      frequency: radio.metadata?.frequency || '',
      website: radio.metadata?.website || '',
      programadora: radio.metadata?.programadora || '',
      streamUrl: radio.streamUrl,
      streamPlatform: newPlatform
    };
    
    console.log(`🔄 Updating streaming platform to: ${newPlatform}`);
    const updateResponse = await axios.put(`${API_BASE}/radios-direct/${RADIO_ID}`, updateData);
    
    console.log('✅ Update response:', {
      id: updateResponse.data.id,
      name: updateResponse.data.name,
      streamPlatform: updateResponse.data.metadata?.streamPlatform,
      streamUrl: updateResponse.data.streamUrl
    });
    
    // Verify the update was saved
    console.log('🔍 Verifying update was saved...');
    const verifyResponse = await axios.get(`${API_BASE}/radios-direct/${RADIO_ID}`);
    const updatedRadio = verifyResponse.data;
    
    console.log('Final verification:', {
      id: updatedRadio.id,
      name: updatedRadio.name,
      streamPlatform: updatedRadio.metadata?.streamPlatform,
      streamUrl: updatedRadio.streamUrl,
      updateSuccessful: updatedRadio.metadata?.streamPlatform === newPlatform
    });
    
    if (updatedRadio.metadata?.streamPlatform === newPlatform) {
      console.log('✅ SUCCESS: Streaming platform update is working correctly!');
    } else {
      console.log('❌ FAILED: Streaming platform update was not saved correctly');
    }
    
  } catch (error) {
    console.error('❌ Error testing streaming platform update:', error.response?.data || error.message);
  }
}

// Run the test
testStreamingPlatformUpdate();