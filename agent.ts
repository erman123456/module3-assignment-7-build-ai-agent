// agent.ts

import { OpenAI } from 'openai'; // Atau pustaka LLM lainnya
import { createMemoryManager } from './memory';
import { createToolManager } from './tools';

interface AgentConfig {
    llmApiKey: string;
    // ... konfigurasi lainnya
}

export class CodingAssistantAgent {
    private openai: OpenAI;
    private memoryManager: ReturnType<typeof createMemoryManager>;
    private toolManager: ReturnType<typeof createToolManager>;

    constructor(config: AgentConfig) {
        this.openai = new OpenAI({ apiKey: config.llmApiKey });
        this.memoryManager = createMemoryManager(); // Inisialisasi memory manager
        this.toolManager = createToolManager();     // Inisialisasi tool manager
    }

    // --- Agent Loop ---
    async run(userPrompt: string): Promise<string> {
        let currentThought = "";
        let response = "";
        let continueLoop = true;
        let iteration = 0;
        const MAX_ITERATIONS = 5; // Batas iterasi untuk mencegah loop tak terbatas

        while (continueLoop && iteration < MAX_ITERATIONS) {
            iteration++;
            console.log(`\n--- Iteration ${iteration} ---`);

            // 1. Observe: Kumpulkan informasi
            const context = this.memoryManager.getConversationContext();
            const relevantLTM = await this.memoryManager.retrieveFromLTM(userPrompt); // Contoh: RAG
            const fullPrompt = this.constructFullPrompt(userPrompt, context, relevantLTM, currentThought);

            console.log("Observing with prompt:", fullPrompt);

            // 2. Decide: Kirim ke LLM untuk keputusan
            const llmResponse = await this.openai.chat.completions.create({
                model: "gpt-4o", // Ganti dengan model pilihan Anda
                messages: [
                    { role: "system", content: "You are a helpful coding assistant. You can use tools to assist the user. If you need to use a tool, respond with a JSON object indicating the tool and its arguments. Otherwise, respond directly." },
                    { role: "user", content: fullPrompt }
                ],
                tools: this.toolManager.getToolDefinitions(), // Definitions for function calling
                tool_choice: "auto",
            });

            const choice = llmResponse.choices[0];
            const message = choice.message;

            console.log("Deciding with LLM response:", JSON.stringify(message, null, 2));

            if (message.tool_calls && message.tool_calls.length > 0) {
                // LLM memutuskan untuk memanggil tool
                const toolCall = message.tool_calls[0]; // Ambil tool call pertama
                const toolName = toolCall.function.name;
                const toolArgs = JSON.parse(toolCall.function.arguments);

                console.log(`Acting: Calling tool "${toolName}" with args:`, toolArgs);

                // 3. Act: Jalankan tool
                try {
                    const toolResult = await this.toolManager.executeTool(toolName, toolArgs);
                    console.log("Tool result:", toolResult);

                    // Update memory with tool result for next observation
                    this.memoryManager.addToolResultToContext(toolName, toolArgs, toolResult);

                    // Beri tahu LLM hasil dari tool untuk observasi berikutnya
                    currentThought = `I used the tool '${toolName}' with arguments ${JSON.stringify(toolArgs)} and got the result: ${toolResult}. Now, I need to decide the next step based on this.`;

                    // Lanjutkan loop karena mungkin ada langkah selanjutnya
                    continueLoop = true;

                } catch (error) {
                    console.error(`Error executing tool ${toolName}:`, error);
                    currentThought = `I tried to use the tool '${toolName}' but encountered an error: ${error}. I need to reconsider or inform the user.`;
                    continueLoop = false; // Hentikan loop jika ada kesalahan tool
                    response = "An error occurred while using a tool. Please try again or refine your request.";
                }
            } else if (message.content) {
                // LLM memberikan respons langsung
                response = message.content;
                continueLoop = false; // Hentikan loop karena sudah ada respons akhir
                currentThought = ""; // Bersihkan thought
            } else {
                console.warn("LLM did not provide a tool call or content. Ending loop.");
                response = "I'm not sure how to proceed with that request.";
                continueLoop = false;
            }
            this.memoryManager.addMessageToContext("user", userPrompt); // Tambahkan prompt pengguna ke STM
            this.memoryManager.addMessageToContext("assistant", response); // Tambahkan respons agen ke STM
        }

        if (iteration >= MAX_ITERATIONS && continueLoop) {
            response = "I reached the maximum number of iterations. Please try to rephrase your request or provide more details.";
            console.warn("Agent reached max iterations.");
        }
        return response;
    }

    private constructFullPrompt(userPrompt: string, context: string, relevantLTM: string[], currentThought: string): string {
        let prompt = `User's Request: ${userPrompt}\n\n`;

        if (context) {
            prompt += `Conversation Context:\n${context}\n\n`;
        }
        if (relevantLTM.length > 0) {
            prompt += `Relevant Knowledge from Long-Term Memory:\n${relevantLTM.join('\n')}\n\n`;
        }
        if (currentThought) {
            prompt += `My current thought/plan: ${currentThought}\n\n`;
        }
        prompt += `Based on the above, what is the next step? Do I need to use a tool, or can I directly answer?`;
        return prompt;
    }
}