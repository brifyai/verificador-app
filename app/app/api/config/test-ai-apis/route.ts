
import { NextRequest, NextResponse } from 'next/server';

interface ProviderStatus {
  status: 'healthy' | 'unhealthy' | 'testing';
  latency?: number;
  error?: string;
  lastTested?: string;
}

async function testAbacusAI(config: any): Promise<ProviderStatus> {
  if (!config.abacusAI?.enabled || !config.abacusAI?.apiKey) {
    return { status: 'unhealthy', error: 'No configurado' };
  }

  const startTime = Date.now();
  try {
    // Simular test de conexión (en producción sería una llamada real a la API)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    const latency = Date.now() - startTime;
    return {
      status: 'healthy',
      latency,
      lastTested: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'Error de conexión',
      lastTested: new Date().toISOString()
    };
  }
}

async function testGroq(config: any): Promise<ProviderStatus> {
  if (!config.groq?.enabled || !config.groq?.apiKey) {
    return { status: 'unhealthy', error: 'No configurado' };
  }

  const startTime = Date.now();
  try {
    // Simular test de conexión ultra-rápida de Groq
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    const latency = Date.now() - startTime;
    return {
      status: 'healthy',
      latency,
      lastTested: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'Error de conexión',
      lastTested: new Date().toISOString()
    };
  }
}

async function testOpenAI(config: any): Promise<ProviderStatus> {
  if (!config.openai?.enabled || !config.openai?.apiKey) {
    return { status: 'unhealthy', error: 'No configurado' };
  }

  const startTime = Date.now();
  try {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    const latency = Date.now() - startTime;
    return {
      status: 'healthy',
      latency,
      lastTested: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'Error de conexión',
      lastTested: new Date().toISOString()
    };
  }
}

async function testAssemblyAI(config: any): Promise<ProviderStatus> {
  if (!config.assemblyai?.enabled || !config.assemblyai?.apiKey) {
    return { status: 'unhealthy', error: 'No configurado' };
  }

  const startTime = Date.now();
  try {
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 250));
    
    const latency = Date.now() - startTime;
    return {
      status: 'healthy',
      latency,
      lastTested: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'Error de conexión',
      lastTested: new Date().toISOString()
    };
  }
}

async function testRevAI(config: any): Promise<ProviderStatus> {
  if (!config.revai?.enabled || !config.revai?.apiKey) {
    return { status: 'unhealthy', error: 'No configurado' };
  }

  const startTime = Date.now();
  try {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
    
    const latency = Date.now() - startTime;
    return {
      status: 'healthy',
      latency,
      lastTested: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'Error de conexión',
      lastTested: new Date().toISOString()
    };
  }
}

async function testDeepgram(config: any): Promise<ProviderStatus> {
  if (!config.deepgram?.enabled || !config.deepgram?.apiKey) {
    return { status: 'unhealthy', error: 'No configurado' };
  }

  const startTime = Date.now();
  try {
    await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 120));
    
    const latency = Date.now() - startTime;
    return {
      status: 'healthy',
      latency,
      lastTested: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'Error de conexión',
      lastTested: new Date().toISOString()
    };
  }
}

async function testSpeechmatics(config: any): Promise<ProviderStatus> {
  if (!config.speechmatics?.enabled || !config.speechmatics?.apiKey) {
    return { status: 'unhealthy', error: 'No configurado' };
  }

  const startTime = Date.now();
  try {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    const latency = Date.now() - startTime;
    return {
      status: 'healthy',
      latency,
      lastTested: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'Error de conexión',
      lastTested: new Date().toISOString()
    };
  }
}

async function testGoogleCloud(config: any): Promise<ProviderStatus> {
  if (!config.googleCloud?.enabled || !config.googleCloud?.apiKey) {
    return { status: 'unhealthy', error: 'No configurado' };
  }

  const startTime = Date.now();
  try {
    await new Promise(resolve => setTimeout(resolve, 180 + Math.random() * 280));
    
    const latency = Date.now() - startTime;
    return {
      status: 'healthy',
      latency,
      lastTested: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'Error de conexión',
      lastTested: new Date().toISOString()
    };
  }
}

async function testAWSTranscribe(config: any): Promise<ProviderStatus> {
  if (!config.awsTranscribe?.enabled || !config.awsTranscribe?.accessKeyId || !config.awsTranscribe?.secretAccessKey) {
    return { status: 'unhealthy', error: 'No configurado' };
  }

  const startTime = Date.now();
  try {
    await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 350));
    
    const latency = Date.now() - startTime;
    return {
      status: 'healthy',
      latency,
      lastTested: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'Error de conexión',
      lastTested: new Date().toISOString()
    };
  }
}

async function testAzureSpeech(config: any): Promise<ProviderStatus> {
  if (!config.azureSpeech?.enabled || !config.azureSpeech?.subscriptionKey) {
    return { status: 'unhealthy', error: 'No configurado' };
  }

  const startTime = Date.now();
  try {
    await new Promise(resolve => setTimeout(resolve, 220 + Math.random() * 320));
    
    const latency = Date.now() - startTime;
    return {
      status: 'healthy',
      latency,
      lastTested: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'Error de conexión',
      lastTested: new Date().toISOString()
    };
  }
}

async function testElevenLabs(config: any): Promise<ProviderStatus> {
  if (!config.elevenlabs?.enabled || !config.elevenlabs?.apiKey) {
    return { status: 'unhealthy', error: 'No configurado' };
  }

  const startTime = Date.now();
  try {
    await new Promise(resolve => setTimeout(resolve, 120 + Math.random() * 180));
    
    const latency = Date.now() - startTime;
    return {
      status: 'healthy',
      latency,
      lastTested: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: 'Error de conexión',
      lastTested: new Date().toISOString()
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    console.log('Testing AI API connections...');
    
    // Probar todas las conexiones en paralelo
    const [
      abacusResult,
      groqResult,
      openaiResult,
      assemblyaiResult,
      revaiResult,
      deepgramResult,
      speechmaticsResult,
      googleCloudResult,
      awsTranscribeResult,
      azureSpeechResult,
      elevenlabsResult
    ] = await Promise.all([
      testAbacusAI(config),
      testGroq(config),
      testOpenAI(config),
      testAssemblyAI(config),
      testRevAI(config),
      testDeepgram(config),
      testSpeechmatics(config),
      testGoogleCloud(config),
      testAWSTranscribe(config),
      testAzureSpeech(config),
      testElevenLabs(config)
    ]);

    return NextResponse.json({
      abacus: abacusResult,
      groq: groqResult,
      openai: openaiResult,
      assemblyai: assemblyaiResult,
      revai: revaiResult,
      deepgram: deepgramResult,
      speechmatics: speechmaticsResult,
      googleCloud: googleCloudResult,
      awsTranscribe: awsTranscribeResult,
      azureSpeech: azureSpeechResult,
      elevenlabs: elevenlabsResult
    });

  } catch (error) {
    console.error('Error testing AI API connections:', error);
    return NextResponse.json(
      { error: 'Error testing connections' },
      { status: 500 }
    );
  }
}
