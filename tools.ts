// tools.ts

interface Tool {
    name: string;
    description: string;
    parameters: any; // JSON Schema for arguments
    execute: (args: any) => Promise<string>;
}

const availableTools: Tool[] = [
    {
        name: "code_interpreter",
        description: "Executes a given TypeScript or JavaScript code snippet and returns the output. Useful for testing code or evaluating expressions.",
        parameters: {
            type: "object",
            properties: {
                code: {
                    type: "string",
                    description: "The TypeScript/JavaScript code snippet to execute."
                }
            },
            required: ["code"]
        },
        execute: async (args: { code: string }) => {
            try {
                // WARNING: In a real application, executing arbitrary code is a security risk.
                // This should be done in a sandboxed environment (e.g., separate process, WebAssembly).
                const result = eval(args.code); // Simplified for example
                return String(result);
            } catch (error: any) {
                return `Error: ${error.message}`;
            }
        }
    },
    {
        name: "search_documentation",
        description: "Searches external documentation (e.g., MDN, TypeScript docs, project docs) for a given query.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query for documentation."
                }
            },
            required: ["query"]
        },
        execute: async (args: { query: string }) => {
            // Simulasi pencarian dokumentasi
            if (args.query.toLowerCase().includes("typescript interface")) {
                return "TypeScript interfaces define contracts in your code. They are used to type-check objects, functions, and classes.";
            }
            return `No specific documentation found for "${args.query}".`;
        }
    }
    // Tambahkan tool lain seperti 'file_reader', 'linter_checker', 'test_runner'
];

export function createToolManager() {
    return {
        getToolDefinitions() {
            return availableTools.map(tool => ({
                type: "function" as const,
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters,
                },
            }));
        },
        async executeTool(toolName: string, args: any): Promise<string> {
            const tool = availableTools.find(t => t.name === toolName);
            if (!tool) {
                throw new Error(`Tool "${toolName}" not found.`);
            }
            return await tool.execute(args);
        }
    };
}