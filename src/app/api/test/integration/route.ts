// /src/app/api/test/integration/route.ts

import { NextResponse } from "next/server";
import { testStoryGeneration } from "../../../../../tests/integrationTest";



export async function POST(): Promise<NextResponse> {
    try {
        // Only enable in development
        if (process.env.NODE_ENV !== 'development') {
            return NextResponse.json(
                { error: 'Test endpoints only available in development' },
                { status: 403 }
            );
        }

        console.log('Starting integration test via API...');

        // Run the test (don't await to avoid timeout)
        testStoryGeneration().catch(error => {
            console.error('Integration test failed:', error);
        });

        return NextResponse.json({
            message: 'Integration test started - check server logs for progress',
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Error starting integration test:', error);
        return NextResponse.json(
            { error: 'Failed to start integration test' },
            { status: 500 }
        );
    }
}
