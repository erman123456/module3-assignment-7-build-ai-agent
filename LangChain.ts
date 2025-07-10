// Contoh LangChain.js (konseptual)
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createReactAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { Tool } from "@langchain/core/tools";
import { DynamicTool } from "@langchain/core/tools";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// Definisikan Tools Anda
const codeInterpreterTool = new DynamicTool({
    name: "code_interpreter",
    description: "Executes a given TypeScript or JavaScript code snippet and returns the output. Useful for testing code or evaluating expressions.",
    func: async (code: string) => {
        try {
            const result = eval(code); // UNSAFE for production, use sandboxed env
            return String(result);
        } catch (error: any) {
            return `Error: ${error.message}`;
        }
    },
});

const tools: Tool[] = [codeInterpreterTool /* ... tools lainnya */];

// Inisialisasi LLM
const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
});

// Load prompt dari LangChain Hub atau buat kustom
const prompt = await pull<ChatPromptTemplate>("hwchase17/react");
// Atau buat prompt kustom Anda sendiri:
// const prompt = ChatPromptTemplate.fromMessages([
//     ["system", "You are a helpful AI assistant. You have access to the following tools: {tools}"],
//     ["human", "{input}"],
//     ["placeholder", "{agent_scratchpad}"]
// ]);


// Buat agen
const agent = await createReactAgent({
    llm,
    tools,
    prompt,
});

// Buat executor untuk menjalankan agen
const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: true, // Untuk melihat langkah-langkah agen
});

// Jalankan agen
async function runLangchainAgent(input: string) {
    const result = await agentExecutor.invoke({
        input: input,
    });
    console.log(result.output);
}

runLangchainAgent("Execute console.log('Hello LangChain!');");