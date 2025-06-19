// /src/lib/services/eventStreamer.ts

import type { GenericStreamEvent } from "../types";

type SSEController = ReadableStreamDefaultController<Uint8Array>;


export class EventStreamer {
    private clients = new Map<string, SSEController>();
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private readonly HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds

    constructor() {
        this.startHeartbeat();
    }


    /**
     * Add a client connection for a session
     */
    addClient(sessionId: string, controller: SSEController): void {
        // Remove existing client if present (handles reconnections)
        if (this.clients.has(sessionId)) {
            console.log(`[EventStreamer] Replacing existing client for session ${sessionId}`);
            this.removeClient(sessionId);
        }

        this.clients.set(sessionId, controller);
        console.log(`[EventStreamer] Client added for session ${sessionId}. Total clients: ${this.clients.size}`);
    }


    /**
     * Remove a client connection
     */
    removeClient(sessionId: string): void {
        const controller = this.clients.get(sessionId);
        if (controller) {
            try {
                controller.close();
            } catch {
                // Controller might already be closed
                console.log(`[EventStreamer] Controller already closed for session ${sessionId}`);
            }
            this.clients.delete(sessionId);
            console.log(`[EventStreamer] Client removed for session ${sessionId}. Total clients: ${this.clients.size}`);
        }
    }


    /**
     * Broadcast an event to a specific session
     */
    broadcastToSession(sessionId: string, event: Omit<GenericStreamEvent, 'sessionId' | 'timestamp'>): void {
        const controller = this.clients.get(sessionId);
        if (!controller) {
            console.log(`[EventStreamer] No client found for session ${sessionId}`);
            return;
        }

        const fullEvent: GenericStreamEvent = {
            ...event,
            sessionId,
            timestamp: new Date().toISOString(),
        };

        try {
            const eventData = `data: ${JSON.stringify(fullEvent)}\n\n`;
            controller.enqueue(new TextEncoder().encode(eventData));

            if (process.env.EXTENDED_DEBUG === 'true') {
                console.log(`[EventStreamer] Event sent to session ${sessionId}:`, event.type);
            }
        } catch (error) {
            console.error(`[EventStreamer] Failed to send event to session ${sessionId}:`, error);
            // Remove the client as the connection is likely broken
            this.removeClient(sessionId);
        }
    }


    /**
     * Broadcast to all connected clients (for system-wide events)
     */
    broadcastToAll(event: Omit<GenericStreamEvent, 'sessionId' | 'timestamp'>): void {
        const sessions = Array.from(this.clients.keys());
        console.log(`[EventStreamer] Broadcasting to ${sessions.length} clients:`, event.type);

        sessions.forEach(sessionId => {
            this.broadcastToSession(sessionId, event);
        });
    }


    /**
     * Send a heartbeat to all connected clients to keep connections alive
     */
    private sendHeartbeat(): void {
        const heartbeatEvent = {
            type: 'heartbeat',
            message: 'ping'
        };

        this.broadcastToAll(heartbeatEvent);

        if (this.clients.size > 0) {
            console.log(`[EventStreamer] Heartbeat sent to ${this.clients.size} clients`);
        }
    }


    /**
     * Start the heartbeat interval
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, this.HEARTBEAT_INTERVAL_MS);

        console.log(`[EventStreamer] Heartbeat started (${this.HEARTBEAT_INTERVAL_MS}ms interval)`);
    }


    /**
     * Stop the heartbeat and cleanup
     */
    destroy(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        // Close all client connections
        this.clients.forEach((controller, sessionId) => {
            try {
                controller.close();
            } catch (error) {
                console.log(`[EventStreamer] Error closing controller for session ${sessionId}:`, error);
            }
        });

        this.clients.clear();
        console.log('[EventStreamer] Destroyed and cleaned up all connections');
    }


    /**
     * Get statistics about active connecitons
     */
    getStats(): { totalClients: number; sessionIds: string[] } {
        return {
            totalClients: this.clients.size,
            sessionIds: Array.from(this.clients.keys()),
        };
    }


    /**
     * Check if a session has an active connection
     */
    hasClient(sessionId: string): boolean {
        return this.clients.has(sessionId);
    }
}



// Create singleton instance
export const eventStreamer = new EventStreamer();

// Cleanup on process exit
process.on('SIGINT', () => {
    console.log('[EventStreamer] Received SIGINT, cleaning up...');
    eventStreamer.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('[EventStreamer] Received SIGTERM, cleaning up...');
    eventStreamer.destroy();
    process.exit(0);
});
