// scripts/check-environment.js
// Simple script to check current environment configuration

const fs = require('fs');
const path = require('path');

function checkEnvironment() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    console.log('❌ No .env.local file found');
    console.log(
      '💡 Run "npm run env:test" or "npm run env:prod" to set up environment',
    );
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'));

  console.log('🔧 Current Environment Configuration:');
  console.log('═'.repeat(50));

  const config = {};
  lines.forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      config[key.trim()] = value.trim();
    }
  });

  // Key environment indicators
  const nodeEnv = config.NODE_ENV || 'not set';
  const databaseEnv = config.DATABASE_ENV || 'not set';
  const useMockGpt = config.USE_MOCK_GPT || 'not set';
  const hasOpenAiKey = config.OPENAI_API_KEY ? 'Yes' : 'No';

  console.log(`📍 NODE_ENV: ${nodeEnv}`);
  console.log(`🗄️  DATABASE_ENV: ${databaseEnv}`);
  console.log(`🎭 USE_MOCK_GPT: ${useMockGpt}`);
  console.log(`🔑 OpenAI API Key: ${hasOpenAiKey}`);

  console.log('═'.repeat(50));

  // Determine what will actually happen
  const willUseMock =
    useMockGpt === 'true' ||
    databaseEnv === 'test' ||
    (nodeEnv === 'development' && !config.OPENAI_API_KEY);

  if (willUseMock) {
    console.log('🎭 RESULT: Will use MOCK GPT responses');
    console.log('💡 Benefits: Fast development, no API costs, offline support');
    console.log('🔄 To use real GPT: npm run env:prod');
  } else {
    console.log('🚀 RESULT: Will use REAL OpenAI GPT API');
    console.log('💰 Note: This will make real API calls and incur costs');
    console.log('🔄 To use mock GPT: npm run env:test');
  }

  console.log('═'.repeat(50));
}

checkEnvironment();
