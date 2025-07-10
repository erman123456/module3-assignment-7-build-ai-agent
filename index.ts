// index.ts
import { CodingAssistantAgent } from './agent';
import 'dotenv/config'; // Untuk memuat variabel lingkungan dari .env

async function main() {
    const agent = new CodingAssistantAgent({
        llmApiKey: process.env.OPENAI_API_KEY || ''
    });

    // Contoh penggunaan
    console.log("Assistant: Hello! How can I help you with your coding today?");

    // Contoh 1: Pertanyaan umum
    let response1 = await agent.run("What is the difference between an interface and a type in TypeScript?");
    console.log("\nUser: What is the difference between an interface and a type in TypeScript?");
    console.log("Assistant:", response1);

    // Contoh 2: Meminta eksekusi kode (akan menggunakan tool)
    let response2 = await agent.run("Execute the following JavaScript code: console.log(10 * 5);");
    console.log("\nUser: Execute the following JavaScript code: console.log(10 * 5);");
    console.log("Assistant:", response2);

    // Contoh 3: Meminta pencarian dokumentasi (akan menggunakan tool)
    let response3 = await agent.run("Can you search documentation for 'TypeScript interface'?");
    console.log("\nUser: Can you search documentation for 'TypeScript interface'?");
    console.log("Assistant:", response3);
}

main().catch(console.error);