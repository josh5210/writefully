// /src/app/api/health/route.ts

import { HealthResponse } from "@/lib/types";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        // Basic health check
        const health: HealthResponse = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            services: {
                api: 'healthy',
                // TODO: add database, orchestrator health checks,
                // database: await checkDatabaseHealth(),
                // orchestrator: await checkOrchestratorHealth(),
            },
        };

        return NextResponse.json(health);
    } catch (error) {
        console.error('Health check failed:', error);
        return NextResponse.json(
            {
                status: 'unhealthy',
                error: 'Health check failed',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}