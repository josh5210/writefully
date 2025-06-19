// lib/db/repository.ts
import { Pool } from 'pg';
import { getDbPool, DbStory, DbPage, DbGenerationJob } from './config';
import { PromptInput, Content } from '../types';

export class DatabaseRepository {
  private pool: Pool;

  constructor() {
    this.pool = getDbPool();
  }

  // Story operations
  async createStory(sessionId: string, prompt: PromptInput): Promise<DbStory> {
    const query = `
      INSERT INTO stories (
        session_id, status, topic, total_pages, author_style, 
        art_style, reader_voice, quality
      ) VALUES ($1::UUID, $2::VARCHAR, $3::TEXT, $4::INTEGER, $5::VARCHAR, $6::VARCHAR, $7::VARCHAR, $8::INTEGER)
      RETURNING *
    `;
    
    const values = [
      sessionId,
      'pending',
      prompt.topic,
      prompt.pages,
      prompt.authorStyle || null,
      prompt.artStyle || null,
      prompt.readerVoice || null,
      prompt.quality
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getStoryBySessionId(sessionId: string): Promise<DbStory | null> {
    const query = 'SELECT * FROM stories WHERE session_id = $1::UUID';
    const result = await this.pool.query(query, [sessionId]);
    return result.rows[0] || null;
  }

  async updateStoryStatus(storyId: string, status: DbStory['status'], errorMessage?: string): Promise<boolean> {
    const query = `
      UPDATE stories 
      SET status = $2::VARCHAR, error_message = $3::TEXT, updated_at = NOW(),
          completed_at = CASE WHEN $2::VARCHAR IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE completed_at END
      WHERE id = $1::UUID
    `;
    
    const result = await this.pool.query(query, [storyId, status, errorMessage || null]);
    return (result.rowCount ?? 0) > 0;
  }

  async updateStoryProgress(storyId: string, updates: {
    currentPage?: number;
    completedPages?: number;
    currentStep?: DbStory['current_step'];
    storyPlan?: string;
  }): Promise<boolean> {
    const setParts: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [storyId];
    let paramCount = 2;

    if (updates.currentPage !== undefined) {
      setParts.push(`current_page = $${paramCount}::INTEGER`);
      values.push(updates.currentPage);
      paramCount++;
    }

    if (updates.completedPages !== undefined) {
      setParts.push(`completed_pages = $${paramCount}::INTEGER`);
      values.push(updates.completedPages);
      paramCount++;
    }

    if (updates.currentStep !== undefined) {
      setParts.push(`current_step = $${paramCount}::VARCHAR`);
      values.push(updates.currentStep);
      paramCount++;
    }

    if (updates.storyPlan !== undefined) {
      setParts.push(`story_plan = $${paramCount}::TEXT`);
      values.push(updates.storyPlan);
      paramCount++;
    }

    const query = `UPDATE stories SET ${setParts.join(', ')} WHERE id = $1::UUID`;
    const result = await this.pool.query(query, values);
    return (result.rowCount ?? 0) > 0;
  }

  // Page operations
  async createPage(storyId: string, pageIndex: number): Promise<DbPage> {
    const query = `
      INSERT INTO pages (story_id, page_index, status)
      VALUES ($1::UUID, $2::INTEGER, $3::VARCHAR)
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [storyId, pageIndex, 'pending']);
    return result.rows[0];
  }

  async getPagesByStoryId(storyId: string): Promise<DbPage[]> {
    const query = 'SELECT * FROM pages WHERE story_id = $1::UUID ORDER BY page_index';
    const result = await this.pool.query(query, [storyId]);
    return result.rows;
  }

  async getPage(storyId: string, pageIndex: number): Promise<DbPage | null> {
    const query = 'SELECT * FROM pages WHERE story_id = $1::UUID AND page_index = $2::INTEGER';
    const result = await this.pool.query(query, [storyId, pageIndex]);
    return result.rows[0] || null;
  }

  async updatePageStatus(pageId: string, status: DbPage['status'], errorMessage?: string): Promise<boolean> {
    const query = `
      UPDATE pages 
      SET status = $2::VARCHAR, error_message = $3::TEXT, updated_at = NOW(),
          started_at = CASE WHEN $2::VARCHAR != 'pending' AND started_at IS NULL THEN NOW() ELSE started_at END,
          completed_at = CASE WHEN $2::VARCHAR = 'completed' THEN NOW() ELSE completed_at END
      WHERE id = $1::UUID
    `;
    
    const result = await this.pool.query(query, [pageId, status, errorMessage || null]);
    return (result.rowCount ?? 0) > 0;
  }

  async updatePageContent(pageId: string, updates: {
    pagePlan?: string;
    contentText?: string;
    critique?: string;
    iteration?: number;
  }): Promise<boolean> {
    const setParts: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [pageId];
    let paramCount = 2;

    if (updates.pagePlan !== undefined) {
      setParts.push(`page_plan = $${paramCount}::TEXT`);
      values.push(updates.pagePlan);
      paramCount++;
    }

    if (updates.contentText !== undefined) {
      setParts.push(`content_text = $${paramCount}::TEXT`, `content_length = $${paramCount + 1}::INTEGER`);
      values.push(updates.contentText, updates.contentText.length);
      paramCount += 2;
    }

    if (updates.critique !== undefined) {
      setParts.push(`critique = $${paramCount}::TEXT`);
      values.push(updates.critique);
      paramCount++;
    }

    if (updates.iteration !== undefined) {
      setParts.push(`iteration = $${paramCount}::INTEGER`);
      values.push(updates.iteration);
      paramCount++;
    }

    const query = `UPDATE pages SET ${setParts.join(', ')} WHERE id = $1::UUID`;
    const result = await this.pool.query(query, values);
    return (result.rowCount ?? 0) > 0;
  }

  // Generation job operations
  async createGenerationJob(
    storyId: string,
    jobType: DbGenerationJob['job_type'],
    pageId?: string,
    inputData?: Record<string, unknown>,
    timeoutMinutes: number = 5
  ): Promise<DbGenerationJob> {
    const timeoutAt = new Date();
    timeoutAt.setMinutes(timeoutAt.getMinutes() + timeoutMinutes);

    const query = `
      INSERT INTO generation_jobs (
        story_id, page_id, job_type, status, timeout_at, input_data
      ) VALUES ($1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::TIMESTAMP, $6::JSONB)
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [
      storyId, 
      pageId || null, 
      jobType, 
      'pending',
      timeoutAt, 
      inputData ? JSON.stringify(inputData) : null
    ]);
    return result.rows[0];
  }

  async startGenerationJob(jobId: string): Promise<boolean> {
    const query = `
      UPDATE generation_jobs 
      SET status = $2::VARCHAR, started_at = NOW(), updated_at = NOW()
      WHERE id = $1::UUID AND status = $3::VARCHAR
    `;
    
    const result = await this.pool.query(query, [jobId, 'running', 'pending']);
    return (result.rowCount ?? 0) > 0;
  }

  async completeGenerationJob(jobId: string, outputData?: Record<string, unknown>): Promise<boolean> {
    const query = `
      UPDATE generation_jobs 
      SET status = $2::VARCHAR, completed_at = NOW(), output_data = $3::JSONB, updated_at = NOW()
      WHERE id = $1::UUID
    `;
    
    const result = await this.pool.query(query, [
      jobId, 
      'completed',
      outputData ? JSON.stringify(outputData) : null
    ]);
    return (result.rowCount ?? 0) > 0;
  }

  async failGenerationJob(jobId: string, errorMessage: string): Promise<boolean> {
    const query = `
      UPDATE generation_jobs 
      SET status = $2::VARCHAR, error_message = $3::TEXT, updated_at = NOW()
      WHERE id = $1::UUID
    `;
    
    const result = await this.pool.query(query, [jobId, 'failed', errorMessage]);
    return (result.rowCount ?? 0) > 0;
  }

  async getTimedOutJobs(): Promise<DbGenerationJob[]> {
    const query = `
      SELECT * FROM generation_jobs 
      WHERE status = $1::VARCHAR AND timeout_at < NOW()
    `;
    
    const result = await this.pool.query(query, ['running']);
    return result.rows;
  }

  async markJobAsTimedOut(jobId: string): Promise<boolean> {
    const query = `
      UPDATE generation_jobs 
      SET status = $2::VARCHAR, updated_at = NOW()
      WHERE id = $1::UUID
    `;
    
    const result = await this.pool.query(query, [jobId, 'timeout']);
    return (result.rowCount ?? 0) > 0;
  }

  // Utility operations
  async getStoryWithPages(sessionId: string): Promise<{
    story: DbStory;
    pages: DbPage[];
  } | null> {
    const story = await this.getStoryBySessionId(sessionId);
    if (!story) return null;

    const pages = await this.getPagesByStoryId(story.id);
    return { story, pages };
  }

  async cleanupExpiredStories(): Promise<number> {
    const query = 'DELETE FROM stories WHERE expires_at < NOW()';
    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }

  async getStoriesByStatus(status: DbStory['status']): Promise<DbStory[]> {
    const query = 'SELECT * FROM stories WHERE status = $1::VARCHAR';
    const result = await this.pool.query(query, [status]);
    return result.rows;
  }

  // Convert database page to Content type
  dbPageToContent(page: DbPage): Content | null {
    if (!page.content_text) return null;

    return {
      text: page.content_text,
      metadata: {
        prompt: {} as PromptInput, // This will need to be filled in by the calling code
        iteration: page.iteration,
        timestamp: page.updated_at,
        modelInfo: {
          name: 'unknown'
        },
        pageNumber: page.page_index
      }
    };
  }
}

// Singleton instance
export const dbRepository = new DatabaseRepository();