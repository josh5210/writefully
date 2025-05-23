// /src/lib/session/sessionManager.ts

import { CreateSessionOptions, SessionProgress, StorySession, UpdateSessionOptions } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { MemorySessionStore } from "./memoryStore";



export class SessionManager {
    private store: MemorySessionStore;

    constructor() {
        this.store = new MemorySessionStore;
    }

    // Create a new session
    createSession(options: CreateSessionOptions): StorySession {
        const sessionId = options.sessionId || uuidv4();
        const storyId = options.storyId || uuidv4();

        // Calculate expiry (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const session: StorySession = {
            sessionId,
            storyId,
            status: 'pending',
            prompt: options.prompt,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt,
            progress: {
                currentPage: 0,
                totalPages: options.prompt.pages,
                completedPages: 0,
                currentStep: 'planning',
            },
        };

        this.store.set(sessionId, session);
        return session;
    }

    // Get a session
    getSession(sessionId: string): StorySession | null {
        return this.store.get(sessionId) || null;
    }

    // Update a session
    updateSession(sessionId: string, updates: UpdateSessionOptions): boolean {
        const current = this.store.get(sessionId);
        if (!current) {
            return false;
        }

        // Merger progress updates if provided
        const updatesProgress = updates.progress ? { ...current.progress, ...updates.progress } : current.progress;

        return this.store.update(sessionId, {
            status: updates.status,
            progress: updatesProgress,
            error: updates.error,
        });
    }

    // Update session progress
    updateProgress(sessionId: string, progress: Partial<SessionProgress>): boolean {
        return this.updateSession(sessionId, { progress });
    }

    // Set session status
    setStatus(sessionId: string, status: StorySession['status'], error?: string): boolean {
        return this.updateSession(sessionId, { status, error });
    }

    // Cancel a session
    cancelSession(sessionId: string): boolean {
        return this.setStatus(sessionId, 'cancelled');
    }

    // Complete a session
    completeSession(sessionId: string): boolean {
        return this.setStatus(sessionId, 'completed');
    }

    // Mark session as failed
    failSession(sessionId: string, error: string): boolean {
        return this.setStatus(sessionId, 'failed', error);
    }

    // Delete a session
    deleteSession(sessionId: string): boolean {
        return this.store.delete(sessionId);
    }

    // Check if session exists
    sessionExsists(sessionId: string): boolean {
        return this.store.has(sessionId);
    }

    // Get all active sessions
    getActiveSessions(): StorySession[] {
        return this.store.getAllActive();
    }

    // Get sessions by status
    getSessionByStatus(status: StorySession['status']): StorySession[] {
        return this.store.getByStatus(status);
    }

    // Get store statistics
    getStats(): { total: number; active: number; byStatus: Record<string, number> } {
        return this.store.getStats();
    }

    // Graceful shutdown
    destroy(): void {
        this.store.destroy();
    }
}


// Create singleton instance
export const sessionManager = new SessionManager();
