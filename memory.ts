// memory.ts

interface Message {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    // Tambahan properti jika diperlukan, e.g., timestamp, tool_call_id
}

interface ToolResult {
    toolName: string;
    args: any;
    result: string;
}

export function createMemoryManager() {
    const shortTermMemory: Message[] = [];
    const longTermMemory: string[] = []; // Contoh sederhana, bisa diganti dengan VectorStore

    return {
        addMessageToContext(role: Message['role'], content: string) {
            shortTermMemory.push({ role, content });
            // Batasi ukuran STM jika perlu
            if (shortTermMemory.length > 10) {
                shortTermMemory.shift(); // Hapus pesan terlama
            }
        },
        addToolResultToContext(toolName: string, args: any, result: string) {
            shortTermMemory.push({
                role: "tool",
                content: `Tool '${toolName}' executed with args ${JSON.stringify(args)} and returned: ${result}`
            });
        },
        getConversationContext(): string {
            return shortTermMemory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        },
        async retrieveFromLTM(query: string): Promise<string[]> {
            // Contoh sederhana: pencarian substring
            // Dalam implementasi nyata, ini akan melibatkan embedding dan pencarian vektor
            return longTermMemory.filter(item => item.includes(query));
        },
        addToLTM(knowledge: string) {
            longTermMemory.push(knowledge);
        }
    };
}