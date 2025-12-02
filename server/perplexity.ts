// Perplexity AI integration with API key rotation - perplexity_v0 blueprint
import { storage } from "./storage";

const API_KEYS = [
  process.env.PERPLEXITY_API_KEY_1,
  process.env.PERPLEXITY_API_KEY_2,
  process.env.PERPLEXITY_API_KEY_3,
].filter(Boolean) as string[];

// Current Perplexity API model names (as of 2025)
const MODEL_MAP: Record<string, string> = {
  "sonar-pro": "sonar-pro",
  "sonar": "sonar",
  "sonar-reasoning": "sonar-reasoning",
  "sonar-deep-research": "sonar-deep-research",
};

const DJANGO_SYSTEM_PROMPT = `You are Perplexia, an expert AI assistant specialized in Django full-stack development with PostgreSQL.

Your expertise includes:
- Django models, views, templates, and URL routing
- Django REST Framework for building APIs
- PostgreSQL database design and optimization
- Django ORM queries and migrations
- Authentication and authorization patterns
- Django admin customization
- Best practices for production Django deployments

When generating code:
1. Always provide complete, working code examples
2. Include proper imports at the top of each file
3. Use descriptive variable and function names
4. Add inline comments explaining complex logic
5. Structure files with clear filename headers (e.g., \`\`\`python models.py)
6. Follow Django conventions and PEP 8 style guide
7. Include requirements.txt when relevant
8. Provide database migration commands when needed

Always aim to generate production-ready code that follows Django best practices.`;

interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  citations?: string[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function getActiveApiKey(): Promise<{ key: string; index: number } | null> {
  // First try to get the current active key that's not exhausted
  const activeKey = await storage.getActiveApiKey();
  if (activeKey && API_KEYS[activeKey.keyIndex - 1]) {
    return { key: API_KEYS[activeKey.keyIndex - 1], index: activeKey.keyIndex };
  }
  
  // If no active key found, try each key in order
  const allKeys = await storage.getApiKeyStatuses();
  for (const keyStatus of allKeys) {
    if (!keyStatus.isExhausted && API_KEYS[keyStatus.keyIndex - 1]) {
      // Activate this key
      await storage.resetKeyStatus(keyStatus.keyIndex);
      return { key: API_KEYS[keyStatus.keyIndex - 1], index: keyStatus.keyIndex };
    }
  }
  
  // Fallback: check if we have any API keys at all
  for (let i = 0; i < API_KEYS.length; i++) {
    if (API_KEYS[i]) {
      return { key: API_KEYS[i], index: i + 1 };
    }
  }
  
  return null;
}

async function callPerplexityWithRotation(
  messages: PerplexityMessage[],
  model: string
): Promise<{ content: string; citations?: string[] }> {
  const modelId = MODEL_MAP[model] || MODEL_MAP["sonar"];
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    const apiKeyInfo = await getActiveApiKey();
    
    if (!apiKeyInfo) {
      throw new Error("No API keys available. All keys may be exhausted.");
    }

    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKeyInfo.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          max_tokens: 4096,
          temperature: 0.2,
          top_p: 0.9,
          stream: false,
          frequency_penalty: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        
        if (response.status === 429 || response.status === 402) {
          console.log(`API key ${apiKeyInfo.index} exhausted or rate limited. Rotating...`);
          await storage.markKeyExhausted(apiKeyInfo.index);
          continue;
        }
        
        throw new Error(`Perplexity API error: ${response.status} - ${errorData}`);
      }

      const data: PerplexityResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from Perplexity API");
      }

      return {
        content: data.choices[0].message.content,
        citations: data.citations,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (error instanceof Error && 
          (error.message.includes("429") || error.message.includes("402"))) {
        await storage.markKeyExhausted(apiKeyInfo.index);
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error("All API keys exhausted");
}

export async function sendToPerplexity(
  conversationHistory: Array<{ role: string; content: string }>,
  userMessage: string,
  model: string = "sonar"
): Promise<{ content: string; citations?: string[] }> {
  const messages: PerplexityMessage[] = [
    { role: "system", content: DJANGO_SYSTEM_PROMPT },
  ];

  for (let i = 0; i < conversationHistory.length; i++) {
    const msg = conversationHistory[i];
    if (i === 0 || conversationHistory[i - 1].role !== msg.role) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }
  }

  if (messages.length === 1 || messages[messages.length - 1].role !== "user") {
    messages.push({ role: "user", content: userMessage });
  }

  return callPerplexityWithRotation(messages, model);
}

export async function getApiKeyStatus(): Promise<{
  activeKey: number;
  keyStatuses: Array<{ keyIndex: number; isActive: boolean; isExhausted: boolean }>;
}> {
  await storage.initializeApiKeys();
  const statuses = await storage.getApiKeyStatuses();
  const activeKey = await storage.getActiveApiKey();
  
  return {
    activeKey: activeKey?.keyIndex || 1,
    keyStatuses: statuses.map((s) => ({
      keyIndex: s.keyIndex,
      isActive: s.isActive,
      isExhausted: s.isExhausted,
    })),
  };
}
