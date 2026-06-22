import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/**
 * Swappable, resilient LLM client with automatic fallback recovery.
 * Set LLM_PROVIDER=anthropic|openai|groq in .env.
 * All SDK clients are initialized if their respective environment keys are present,
 * enabling transparent fallbacks if a primary provider hits rate limits (429) or gets exhausted.
 */

let anthropicClient = null;
let openaiClient = null;
let groqClient = null;

if (process.env.ANTHROPIC_API_KEY) {
  anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
if (process.env.GROQ_API_KEY) {
  groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

/**
 * Helper to race a promise against a timeout limit.
 * @param {Promise<any>} promise
 * @param {number} timeoutMs
 * @param {string} label
 */
function withTimeout(promise, timeoutMs, label) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout: LLM request for ${label} exceeded ${timeoutMs}ms`));
    }, timeoutMs);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise
  ]);
}

/**
 * @param {string} systemPrompt - the reasoning-chain system prompt
 * @param {object} userPayload - the structured decision context (paths + constraints)
 * @returns {Promise<string>} raw text response from the model
 */
export async function llmComplete(systemPrompt, userPayload) {
  const userMessage = JSON.stringify(userPayload);
  const preferredProvider = process.env.LLM_PROVIDER || "openai";
  
  const providersToTry = [preferredProvider];
  if (preferredProvider !== "groq" && process.env.GROQ_API_KEY) providersToTry.push("groq");
  if (preferredProvider !== "openai" && process.env.OPENAI_API_KEY) providersToTry.push("openai");
  if (preferredProvider !== "anthropic" && process.env.ANTHROPIC_API_KEY) providersToTry.push("anthropic");

  const TIMEOUT_MS = 12000;
  const MAX_ATTEMPTS = 2; // up to 2 attempts (initial + 1 retry) per provider
  let lastErr = null;

  for (const prov of providersToTry) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        console.log(`[llmClient] Completion attempt ${attempt}/${MAX_ATTEMPTS} using provider: ${prov}`);
        
        if (prov === "anthropic" && anthropicClient) {
          const response = await withTimeout(
            anthropicClient.messages.create({
              model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
              max_tokens: 1500,
              system: systemPrompt,
              messages: [{ role: "user", content: userMessage }],
            }),
            TIMEOUT_MS,
            `anthropic-completion (${attempt})`
          );
          const textBlock = response.content.find((b) => b.type === "text");
          return textBlock ? textBlock.text : "";
        }
        
        if (prov === "openai" && openaiClient) {
          const response = await withTimeout(
            openaiClient.chat.completions.create({
              model: process.env.OPENAI_MODEL || "gpt-4o-mini",
              max_tokens: 1500,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
              ],
              response_format: { type: "json_object" },
            }),
            TIMEOUT_MS,
            `openai-completion (${attempt})`
          );
          return response.choices[0]?.message?.content || "";
        }
        
        if (prov === "groq" && groqClient) {
          // If preferred groq model fails or rate-limits, fall back to instant 8B model automatically
          const models = [process.env.GROQ_MODEL || "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
          let groqErr = null;
          for (const m of models) {
            try {
              console.log(`[llmClient] Groq completion attempt ${attempt}/${MAX_ATTEMPTS} using model: ${m}`);
              const response = await withTimeout(
                groqClient.chat.completions.create({
                  model: m,
                  max_tokens: m === "llama-3.1-8b-instant" ? 1000 : 1500,
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage },
                  ],
                  response_format: { type: "json_object" },
                }),
                TIMEOUT_MS,
                `groq-${m}-completion (${attempt})`
              );
              return response.choices[0]?.message?.content || "";
            } catch (e) {
              console.warn(`[llmClient] Groq model ${m} failed:`, e.message);
              groqErr = e;
            }
          }
          throw groqErr;
        }
      } catch (err) {
        console.error(`[llmClient] Provider ${prov} attempt ${attempt} failed:`, err.message);
        lastErr = err;
      }
    }
  }
  
  throw lastErr || new Error("No LLM providers available or initialized successfully.");
}

/**
 * Multi-turn chat completion.
 * @param {string} systemPrompt
 * @param {Array<{role: "user"|"assistant", content: string}>} messages
 * @returns {Promise<string>} raw text (JSON) from the model
 */
export async function llmChatComplete(systemPrompt, messages) {
  const preferredProvider = process.env.LLM_PROVIDER || "openai";
  
  const providersToTry = [preferredProvider];
  if (preferredProvider !== "groq" && process.env.GROQ_API_KEY) providersToTry.push("groq");
  if (preferredProvider !== "openai" && process.env.OPENAI_API_KEY) providersToTry.push("openai");
  if (preferredProvider !== "anthropic" && process.env.ANTHROPIC_API_KEY) providersToTry.push("anthropic");

  const TIMEOUT_MS = 12000;
  const MAX_ATTEMPTS = 2; // up to 2 attempts (initial + 1 retry) per provider
  let lastErr = null;

  for (const prov of providersToTry) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        console.log(`[llmClient] Chat completion attempt ${attempt}/${MAX_ATTEMPTS} using provider: ${prov}`);
        
        if (prov === "anthropic" && anthropicClient) {
          const response = await withTimeout(
            anthropicClient.messages.create({
              model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
              max_tokens: 2000,
              system: systemPrompt,
              messages,
            }),
            TIMEOUT_MS,
            `anthropic-chat (${attempt})`
          );
          const textBlock = response.content.find((b) => b.type === "text");
          return textBlock ? textBlock.text : "";
        }
        
        if (prov === "openai" && openaiClient) {
          const response = await withTimeout(
            openaiClient.chat.completions.create({
              model: process.env.OPENAI_MODEL || "gpt-4o-mini",
              max_tokens: 2000,
              messages: [{ role: "system", content: systemPrompt }, ...messages],
              response_format: { type: "json_object" },
            }),
            TIMEOUT_MS,
            `openai-chat (${attempt})`
          );
          return response.choices[0]?.message?.content || "";
        }
        
        if (prov === "groq" && groqClient) {
          const models = [process.env.GROQ_MODEL || "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
          let groqErr = null;
          for (const m of models) {
            try {
              console.log(`[llmClient] Groq chat completion attempt ${attempt}/${MAX_ATTEMPTS} using model: ${m}`);
              const response = await withTimeout(
                groqClient.chat.completions.create({
                  model: m,
                  max_tokens: m === "llama-3.1-8b-instant" ? 1200 : 2000,
                  messages: [{ role: "system", content: systemPrompt }, ...messages],
                  response_format: { type: "json_object" },
                }),
                TIMEOUT_MS,
                `groq-chat-${m} (${attempt})`
              );
              return response.choices[0]?.message?.content || "";
            } catch (e) {
              console.warn(`[llmClient] Groq model ${m} failed:`, e.message);
              groqErr = e;
            }
          }
          throw groqErr;
        }
      } catch (err) {
        console.error(`[llmClient] Provider ${prov} chat attempt ${attempt} failed:`, err.message);
        lastErr = err;
      }
    }
  }
  
  throw lastErr || new Error("No LLM providers available or initialized successfully.");
}
