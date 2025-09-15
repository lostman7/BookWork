// This module abstracts the connection to the AI backend.
// It's designed to be compatible with OpenAI-like APIs (Ollama, LM Studio, OpenRouter).

// IMPORTANT: Replace with your actual AI service endpoint and API key.
const AI_API_URL = process.env.AI_API_URL || 'http://localhost:11434/v1/chat/completions'; // Example for LM Studio/Ollama
const AI_API_KEY = process.env.AI_API_KEY || 'ollama'; // Example for LM Studio/Ollama

async function generateText(systemPrompt, userPrompt, model = 'llama3') {
    // For now, we will simulate the AI response to avoid needing a live API key.
    // This allows us to build and test the entire pipeline.
    // To enable real generation, comment out the mock response and uncomment the fetch call.

    // --- Mock AI Response ---
    const mockResponse = {
        choices: [{
            message: {
                role: 'assistant',
                content: `(This is a simulated AI response based on the prompt: "${userPrompt}")\n\nThe system prompt contained ${systemPrompt.length} characters of context, including world info and character details. The AI would use this to generate a rich, context-aware continuation of the story.`
            }
        }]
    };
    return mockResponse.choices[0].message.content;
    // --- End Mock AI Response ---


    /*
    // --- Real API Call (uncomment to use) ---
    const body = {
        model: model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        stream: false // For simplicity, we're not using streaming responses yet
    };

    try {
        const response = await fetch(AI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`AI API request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error('Error calling AI API:', error);
        throw new Error('Failed to generate text from AI service.');
    }
    // --- End Real API Call ---
    */
}

module.exports = { generateText };
