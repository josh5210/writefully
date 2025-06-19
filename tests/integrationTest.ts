// /tests/integrationTest.ts

import { storyService } from "@/lib/services/storyService";
import { sessionManager } from "@/lib/session/sessionManager";
import { PromptInput } from "@/lib/types";



export async function testStoryGeneration() {
    console.log('Testing Ful lStory Generation Integration...');

    // Test data
    const testPrompt: PromptInput = {
        topic: 'A robot discovers emotions',
        pages: 2,
        authorStyle: 'Isaac Asimov',
        quality: 0,
    };

    try {
        // Test 1: Create session
        console.log('\n Step 1: creating session...');
        const session = sessionManager.createSession({ prompt: testPrompt });
        console.log(`Session created: ${session.sessionId}`);
        console.log(`Story ID: ${session.storyId}`);
        console.log(`Status: ${session.status}`);


        // Test 2: start generation
        console.log('\n Step 2: Starting story generation...');
        await storyService.startGeneration(session.sessionId);
        console.log('Story generation started');


        // Test 3: Monitor progress
        console.log('\n Step 3: Monitoring progress...');

        let attempts = 0;
        const maxAttempts = 60; // 60 seconds timeout

        while (attempts < maxAttempts) {
            const currentSession = sessionManager.getSession(session.sessionId);
            if (!currentSession) {
                console.log('Session disappeared');
                break;
            }

            console.log(`Status: ${currentSession.status}, ` +
                `Progress: ${currentSession.progress.completedPages}/${currentSession.progress.totalPages}, ` +
                `Step: ${currentSession.progress.currentStep}`);
            
            if (currentSession.status === 'completed') {
                console.log('Story generation completed successfully!');
                break;
            }

            if (currentSession.status === 'failed') {
                console.log(`Story generation failed: ${currentSession.error}`);
                break;
            }

            if (currentSession.status === 'cancelled') {
                console.log('Story generation was cancelled');
                break;
            }

            // Wait 1 second before checking again
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }

        if (attempts >= maxAttempts) {
            console.log('Test timed out after 60 seconds');

            // Try to cancel the generation
            console.log('Attempting to cancel...');
            await storyService.cancelGeneration(session.sessionId);
        }


        // Test 4: Final status
        console.log('\n Step 4: Final status...');
        const finalSession = sessionManager.getSession(session.sessionId);
        if (finalSession) {
            console.log(`Final status: ${finalSession.status}`);
            console.log(`Pages completed: ${finalSession.progress.completedPages}/${finalSession.progress.totalPages}`);
        }


        // Test 5: Get active generations
        // console.log(`\n Step 5: Active generations...`);
        // const activeGenerations = storyService.getActiveGenerations();
        // console.log(`Active generations: ${activeGenerations.length}`);

        // console.log('\n Integration test completed!');

    } catch (error) {
        console.error('Integration test failed:', error);
        throw error;
    }
}
