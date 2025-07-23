// src/utils/environment.ts
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Detects if we're using test database based on environment variables
 */
export function isTestDatabase(): boolean {
  // Primary method: Check DATABASE_ENV (most reliable)
  if (process.env.DATABASE_ENV === 'test') {
    return true;
  }

  // Secondary method: Check for USE_MOCK_GPT flag
  if (process.env.USE_MOCK_GPT === 'true') {
    return true;
  }

  // Tertiary method: Development + no production markers
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.DATABASE_ENV !== 'production'
  ) {
    return true;
  }

  return false;
}

/**
 * Detects if we should use mock GPT responses
 * Uses test database OR explicitly set to mock
 */
export function shouldUseMockGPT(): boolean {
  // Force mock if explicitly set
  if (process.env.USE_MOCK_GPT === 'true') {
    return true;
  }

  // Use mock in test database environment
  if (isTestDatabase()) {
    return true;
  }

  // Use mock in development if no OpenAI key
  if (isDevelopment && !process.env.OPENAI_API_KEY) {
    return true;
  }

  return false;
}

/**
 * Get current environment info for debugging
 */
export function getCurrentEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Determine database project based on environment variables (no hardcoded URLs)
  let supabaseProject = 'unknown';

  if (process.env.DATABASE_ENV === 'production') {
    supabaseProject = 'production';
  } else if (process.env.DATABASE_ENV === 'test') {
    supabaseProject = 'test';
  } else if (process.env.USE_MOCK_GPT === 'true') {
    supabaseProject = 'test'; // If using mocks, likely test environment
  } else if (process.env.NODE_ENV === 'development') {
    supabaseProject = 'development';
  }

  return {
    nodeEnv: process.env.NODE_ENV,
    databaseEnv: process.env.DATABASE_ENV,
    useMockGPT: process.env.USE_MOCK_GPT,
    isTestDatabase: isTestDatabase(),
    shouldUseMockGPT: shouldUseMockGPT(),
    supabaseProject,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  };
}

/**
 * Log environment info to console (useful for debugging)
 */
export function logEnvironmentInfo() {
  if (typeof window !== 'undefined') return; // Server-side only

  const env = getCurrentEnvironment();
  console.log('🔧 Environment Detection Debug:');
  console.log('📍 NODE_ENV:', process.env.NODE_ENV);
  console.log('🗄️  DATABASE_ENV:', process.env.DATABASE_ENV);
  console.log('🎭 USE_MOCK_GPT:', process.env.USE_MOCK_GPT);
  console.log(
    '🌐 Supabase URL:',
    process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
  );
  console.log('📊 Final Detection Results:');
  console.log('  - isTestDatabase():', env.isTestDatabase);
  console.log('  - shouldUseMockGPT():', env.shouldUseMockGPT);
  console.log('  - supabaseProject:', env.supabaseProject);

  if (env.shouldUseMockGPT) {
    console.log('💡 Using mock GPT responses for faster development!');
  } else {
    console.log('🚀 Using real GPT responses - API calls will be made!');
  }
}
