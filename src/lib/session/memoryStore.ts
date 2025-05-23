// /src/lib/session/memoryStore.ts

import { StorySession } from "../types";




export class MemorySessionStore {
    private sessions = new Map<string, StorySession>();
    private cleanupInterval: NodeJS.Timeout | null = null;
    private readonly SESSION_EXPIRY_HOURS = 24;

    constructor() {
        // Start periodic cleanup
        this.startCleanup();
    }

    // Store a session
    set(sessionId: string, session: StorySession): void {
        this.sessions.set(sessionId, session);
    }

    // Get a session
    get(sessionId: string): StorySession | undefined {
        const session = this.sessions.get(sessionId);

        // Check if a session is expired
        if (session && session.expiresAt < new Date()) {
            this.sessions.delete(sessionId);
            return undefined;
        }

        return session;
    }

    // Update a session
    update(sessionId: string, updates: Partial<StorySession>): boolean {
        const session = this.get(sessionId);
        if (!session) {
            return false;
        }

        // Merge updates
        const updatedSession: StorySession = {
            ...session,
            ...updates,
            updatedAt: new Date(),
        };

        this.sessions.set(sessionId, updatedSession);
        return true;
    }

    // Delete a session
    delete(sessionId: string): boolean {
        return this.sessions.delete(sessionId);
    }

    // Check if session exists
    has(sessionId: string): boolean {
        return this.get(sessionId) !== undefined;
    }

    // Get all active sessions (for debugging/monitoring)
    getAllActive(): StorySession[] {
        const now = new Date();
        return Array.from(this.sessions.values()).filter(
            session => session.expiresAt > now
        );
    }

    // Get sessions by status
    getByStatus(status: StorySession['status']): StorySession[] {
        return this.getAllActive().filter(session => session.status === status);
    }

    // Cleanup expired sessions
    private cleanup(): void {
        const now = new Date();
        let cleanedCount = 0;

        for (const [sessionId, session] of this.sessions) {
            if (session.expiresAt < now) {
                this.sessions.delete(sessionId);
                cleanedCount++;
            }
        }

        if (cleanedCount >0) {
            console.log(`Cleaned up ${cleanedCount} expired sessions`);
        }
    }

    // Start periodic cleanup
    private startCleanup(): void {
        // Clean up every hour
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60 * 60 * 1000);
    }

    // Stop cleanup (for graceful shutdown)
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    // Get store statistics
    getStats(): { total: number; active: number; byStatus: Record<string, number> } {
        const active = this.getAllActive();
        const byStatus: Record<string, number> = {};

        for (const session of active) {
            byStatus[session.status] = (byStatus[session.status] || 0) + 1;
        }

        return {
            total: this.sessions.size,
            active: active.length,
            byStatus,
        };
    }
}
