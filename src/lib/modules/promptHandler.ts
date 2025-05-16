// /src/lib/modules/promptHandler.ts

import { PageContext, PromptInput } from "../types";


// Class that creates the prompts that the modules use and pass to the llm
export class PromptHandler {


    /**
     * Story Planner Prompts
     */
    createStoryPlannerSystemPrompt(prompt: PromptInput): string {

        let systemPrompt = `You are a master story architect and planner. You will be provided a topic for an original story.
            Your task is to create a detailed story plan that will serve as the blueprint for an AI writer that will generate the story written about this topic.`;

        if (prompt.authorStyle) {
            systemPrompt += `\n\nImportantly, the story must be writen in the style of ${prompt.authorStyle}. Consider how they would approach planning the story.`
        }

        systemPrompt += `\n\nBrainstorm the basis of a compelling narrative arc with beginning, middle, and end.

            Your plan should include detailed descriptions of:
            -Key events and plot developments
            -Key characters and their character traits
            -Key settings
            -Emotional beats and tone`;

        if (prompt.pages) {
            systemPrompt += `\n\nPlan for the final story to be approximately ${prompt.pages} pages long.`;
        }

        return systemPrompt;
    }


    createStoryPlannerUserPrompt(prompt: PromptInput): string {
        
        let userPrompt = `Create a detailed plan for writing a story on the topic of """${prompt.topic}"""`

        if (prompt.authorStyle) {
            userPrompt += ` in the literary style of ${prompt.authorStyle}`;
        }
        userPrompt += `.`;

        return userPrompt;
    }



    /**
     * Page Planner prompts
     */
    createPagePlannerSystemPrompt(prompt: PromptInput, pageContext: PageContext): string {
        let systemPrompt = `You are a skilled story page planner. Your task is to create a detailed plan for page ${pageContext.currentPageIndex + 1} of a ${prompt.pages}-page story.
        
        You will be provided with:
        1. The overall story plan
        2. The topic of the story
        3. The page numer you need to plan (${pageContext.currentPageIndex + 1} of ${prompt.pages})
        ${pageContext.currentPageIndex > 0 ? "4. Plans for the previous pages" : ""}
        
        Your page plan will serve as a detailed blueprint for the writer module that will generate this specific page.`;

        if (prompt.authorStyle) {
            systemPrompt += `\n\nKeep in mind that the story will be written in the style of ${prompt.authorStyle}, so consider how this would affect what events or elements should appear on this page.`;
        }

        systemPrompt += `\n\nA good page plan should include:
        - Specific events, actions, and dialogue that will occur on this page
        - Description of the setting/environment for this page
        - Character emotions and developments
        - Key revelations or plot advancements
        - Transitions from previous pages and into subsequent pages
        
        The plan should contain content to produce a 2000 character page (~300-400 words) while itself being concise (aim for 100 words or less).
        The plan must be detailed enough for the writer to create compelling, specific content, but should not include the actual prose.
        Most importantly, ensure your plan fits logically within the larger story structure. Page ${pageContext.currentPageIndex + 1} must continue naturally from previous pages and set up what follows in a coherent way.`;

        return systemPrompt;
    }


    createPagePlannerUserPrompt(prompt: PromptInput, pageContext: PageContext, previousPagePlans: string[] = []): string {
        let userPrompt = `Please create a detailed plan for page ${pageContext.currentPageIndex + 1} of a ${prompt.pages}-page story about "${prompt.topic}"`;

        if (prompt.authorStyle) {
            userPrompt += ` in the style of ${prompt.authorStyle}`;
        }

        userPrompt += `.\n\nOVERALL STORY PLAN:\n${pageContext.storyPlan}\n\n`;

        // Include previous page plans if available
        if (previousPagePlans.length > 0) {
            userPrompt += `PREVIOUS PAGE PLANS:\n`;
            previousPagePlans.forEach((plan, index) => {
                userPrompt += `Page ${index + 1}: ${plan}\n\n`;
            });
        }

        userPrompt += `Please provide a specific, detailed plan for what should happen on page ${pageContext.currentPageIndex + 1}.
        Include key events, character actions, dialogue points, setting details, and emotional beats.
        
        The plan should guide the writer to create content that:
        - Fits logically within the overall story
        - Follows naturally from previous pages
        - Advances the narrative appropriately for this stage of the story
        
        Concisely outline the elements that should appear on this page.`;

        return userPrompt;
    }


    /**
     * Create the system prompt for the writer module
     * @param prompt structured PromptInput object
     * @param pageContext what has been written in previous pages
     * @returns system prompt string passed to writer then llm
     */
    createWriterSystemPrompt(prompt: PromptInput, pageContext?: PageContext): string {
        let systemPrompt = `You are a masterful creative writer tasked with generating high-quality, original content.
            You will be writing a story about "${prompt.topic}".`;
        
        // Add author style if available
        if (prompt.authorStyle) {
            systemPrompt += `\n\nImportant: You must write in the style of ${prompt.authorStyle}.
                Capture the essence of their writing style, including:
                -Typical sentence structure and paragraph organization
                - Voice and tone characteristics
                - Common themes or motifs
                - Characteristic literary devices
                - Vocabulary choices and lingquistic patterns`;
        }

        // Add context if available
        if (pageContext) {
            systemPrompt += `\n\nYou will be writing page ${pageContext.currentPageIndex + 1} of a ${prompt.pages} page story.
            You will be provided with:
            1. An overall story plan
            2. A specific plan for this page
            3. The full content for the previous up to 2 pages, if available
            
            Write ONLY the content for page ${pageContext.currentPageIndex + 1}, approximately 2000 characters (~300-400 words).
            
            Focus on:
            - Following the page plan exactly
            - Maintaining narrative consistency with previous pages
            - Creating engaging, vivid prose
            
            Do not include "Page X" headers or any meta-commentary. Write only the story content.`
        }

        return systemPrompt;
    }


    /**
     * Create the user propmt for the writer
     * @param prompt PromptInput object
     * @param pageContext what has been written/planned in previous pages
     * @returns user prompt string passed to writer then llm
     */
    createWriterUserPrompt(prompt: PromptInput, pageContext?: PageContext): string {
        let userPrompt = ``

        // Designate which page to write if applicable
        if (pageContext?.currentPageIndex) {
            userPrompt += `Write page ${pageContext.currentPageIndex + 1} of a ${prompt.pages}-page story.`;
        } else {
            // If for some reason we have no page num (like no length specified in prompt), write "short" story
            userPrompt += `Write a short story.\n`;
        }

        // Declare the topic
        userPrompt += `\n\nSTORY TOPIC: "${prompt.topic}".`;

        // Decalre author style if applicable
        if (prompt.authorStyle) {
            userPrompt += `\n\nImportant: write in the style of ${prompt.authorStyle}.`;
        }

        // Provide the context if available
        if (pageContext) {
            userPrompt += `\n\nOVERALL STORY PLAN:\n${pageContext.storyPlan}\n\n`;
            userPrompt += `PLAN FOR PAGE ${pageContext.currentPageIndex + 1}:\n${pageContext.currentPagePlan}\n\n`;

            // Add full content of previous 1-2 pages for immediate context
            if (pageContext.recentPreviousPagesFull.length > 0) {
                pageContext.recentPreviousPagesFull.forEach((prevPage, idx) => {
                    const prevPageNumber = pageContext.currentPageIndex + 1 - pageContext.recentPreviousPagesFull.length + idx + 1;
                    userPrompt += `CONTENT OF PAGE ${prevPageNumber}:\n${prevPage.text}\n\n`;
                });
            }
        }

        userPrompt += `Please write ONLY the content specified. Do not include a page header, summary, or any comments - write pure story content.`;

        return userPrompt;
    }


    /**
     * Critic prompts
     */
    createCriticSystemPrompt(prompt: PromptInput, pageContext?: PageContext): string {
        let systemPrompt = `You are an exceptionally demanding literary critic with expert knowledge of various writing styles and genres.
            Your task is to evaluate a piece of writing and provide specific, constructive feedback.

            You should be generous with your critique but sparing with your praise. Reserve your highest approval only for truly exceptional work.`;

        if (prompt.authorStyle) {
            systemPrompt += `\n\nScrutinize how well the writing captures the style of ${prompt.authorStyle}, considering elements like:
            - Sentence structure and paragraph organization
            - Voice and tone
            - Thematic elements
            - Literary devices
            - Vocabulary and linguistic patterns

            Be stringent in your assessment - merely referencing the author is not enough; the writing must genuinely capture their essence.`;
            }

        if (pageContext) {
            systemPrompt += `\n\nYou are evaluating page ${pageContext.currentPageIndex + 1} of a ${prompt.pages}-page story. Pay special attention to:
            - How well the page follows its intended plan
            - Narrative consistency with previous pages
            - Appropriate pacing for this stage of the story
            - Whether the page accomplishes what it needs to within the character limit`;
        }

        systemPrompt += `\n\nYour evaluation must be thorough, specific, and constructively critical. Identify at least 3-5 substantive areas for improvement, even in good writing.
            Format your critique as a well-structured analysis with paragraphs addressing different aspects of the writing.
            ALWAYS provide concrete examples from the text to illustrate your points - vague criticism is unhelpful.
            At the end of your critique, include a "Revision Priorities" section with at least 3 bullet points listing the most important improvements needed.
            Remember that meaningful growth comes from rigorous feedback. Do not sugar-coat your assessment - be honest about shortcomings while remaining constructive.`;

        return systemPrompt;
    }


    createCriticUserPrompt(content: string, originalPrompt: PromptInput, pageContext?: PageContext): string {
        let userPrompt = `Please evaluate the following `;

        if (pageContext) {
            userPrompt += `conent for page ${pageContext.currentPageIndex + 1} of a ${originalPrompt.pages}-page story`;
        } else {
            userPrompt += `story`;
        }

        if (originalPrompt.authorStyle) {
            userPrompt += ` that was written to be in the style of ${originalPrompt.authorStyle}`;
        }

        userPrompt == `.\n\n`;

        // Add page-specific context if available
        if (pageContext) {
            userPrompt += `STORY PLAN: ${pageContext.storyPlan}\n\n`;
            userPrompt += `PLAN FOR THIS PAGE: ${pageContext.currentPagePlan}\n\n`;
            userPrompt += `TARGET LENGTH: Approximately 2000 characters (current length: ${content.length} characters)\n\n`;
        }

        userPrompt += `Provide a detailed critique addressing:
        1. Style and voice
        2. Content and storytelling
        3. Structure and pacing
        4. Language and mechanics
        5. Overall assessment
        
        Include bullet points for key takeaways or specific suggestions for improvement.
        
        Here's the text to evaluate:
        
        """${content}"""`;

        return userPrompt;
    }


    /**
     * Editor prompts
     */
    createEditorSystemPrompt(): string {
        let systemPrompt = `You are a master editor with exceptional skill in transforming good writing into excellent writing.
            Your task is to significantly imrpove the text provided to you.
            
            Focus on:

            1. Structural improvements: reorganize content for optimal flow and impact
            2. Sylistic refinement: ensure the voice is consistent and powerful
            3. Narrative strengthening: deepen character development and thematic elements
            4. Language precision: replace generic wording with vivid, specific language
            5. Eliminating weaknesses: fix all issues highlighted by critique of the content provided to you
            6. Amplifying strengths: identify what works well and enhance it further

            Make bold, substantive improvemnts. Don't just fix surface issues - transform the text to elevate its quality significantly.

            You will be provided with a preliminary draft of the text to revise.
            
            If applicable, you may also recieve:
            - Critique of the preliminary draft
            - Details on the intended topic and author style being replicated
            - Context about the contents relationship to a wider body of work (i.e. page number)`;

        return systemPrompt;
    }


    createEditorUserPrompt(content: string, originalPrompt: PromptInput, critique?: string, pageContext?: PageContext): string {
        let userPrompt = `Your task is to substantially improve the following `;

        if (pageContext) {
            userPrompt += `content for page ${pageContext.currentPageIndex + 1} of a ${originalPrompt.pages}-page story`;
        } else {
            userPrompt += `story`;
        }

        if (originalPrompt.authorStyle) {
            userPrompt += ` written in the style of ${originalPrompt.authorStyle}`;
        }

        userPrompt += `on the topic of "${originalPrompt.topic}". Focus on enhancing the quality while preserving the style and intent.`;

        // Add page context if available
        if (pageContext) {
            userPrompt += `\n\nPLAN FOR THIS PAGE:\n${pageContext.currentPagePlan}\n\n`;
            userPrompt += `TARGET LENGTH: Approximately 2000 characters (current length: ${content.length} characters)\n\n`;
        }

        // Add critique if available
        if (critique) {
            userPrompt += `\n\nA literary critic has identified these issues that MUST be addressed in your revision:\n\n"""${critique}"""`;
        }

        userPrompt += `\n\nHere is the text to revise:\n\n""""${content}"""\n\nProvide ONLY the revised text with no explanations or comments.`;

        return userPrompt;
    }
}