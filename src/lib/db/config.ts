// lib/db/config.ts
import { Pool } from 'pg';

interface DatabaseConfig {
  connectionString: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  // acquireTimeoutMillis?: number;
  // createTimeoutMillis?: number;
}

const createDatabaseConfig = (): DatabaseConfig => {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return {
    connectionString,
    ssl: process.env.NODE_ENV === 'production',
    max: 15, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
    connectionTimeoutMillis: 15000, // How long to wait when connecting a client
    // acquireTimeoutMillis: 20000,  // Acquisition timeout
    // createTimeoutMillis: 15000, // Creation timeout
  };
};

// Create a singleton pool instance
let pool: Pool | null = null;

export const getDbPool = (): Pool => {
  if (!pool) {
    const config = createDatabaseConfig();
    pool = new Pool(config);
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return pool;
};

// Graceful shutdown
export const closeDbPool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

// Database types
export interface DbStory {
  id: string;
  session_id: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled';
  topic: string;
  total_pages: number;
  author_style?: string;
  art_style?: string;
  reader_voice?: string;
  quality: 0 | 1 | 2;
  story_plan?: string;
  // New fields for tiered planning approach
  story_structure?: string;
  story_characters?: string;
  story_settings?: string;
  story_narrative?: string;
  current_page: number;
  completed_pages: number;
  current_step?: 'planning' | 'writing' | 'critiquing' | 'editing';
  error_message?: string;
  retry_count: number;
  last_retry_at?: Date;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  expires_at: Date;
}

export interface DbPage {
  id: string;
  story_id: string;
  page_index: number;
  status: 'pending' | 'planning' | 'writing' | 'critiquing' | 'editing' | 'completed' | 'failed';
  page_plan?: string;
  content_text?: string;
  critique?: string;
  content_length?: number;
  iteration: number;
  started_at?: Date;
  completed_at?: Date;
  retry_count: number;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DbGenerationJob {
  id: string;
  story_id: string;
  page_id?: string;
  job_type: 'story_plan' | 'page_plan' | 'page_content' | 'page_critique' | 'page_edit';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  started_at?: Date;
  timeout_at?: Date;
  completed_at?: Date;
  retry_count: number;
  max_retries: number;
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}