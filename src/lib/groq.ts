import Groq from "groq-sdk";

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Default model — fast and capable
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

interface GroqChatOptions {
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Send a chat completion request to Groq.
 * Returns the text content of the first choice.
 */
export async function groqChat(
  userMessage: string,
  options: GroqChatOptions = {}
): Promise<string> {
  const {
    systemPrompt = "You are a helpful AI assistant for a developer collaboration platform called DevConnect.",
    model = DEFAULT_MODEL,
    maxTokens = 1024,
    temperature = 0.7,
  } = options;

  try {
    const completion = await groqClient.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model,
      max_tokens: maxTokens,
      temperature,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq API error:", error);
    throw new Error("Failed to generate AI response");
  }
}

/**
 * Generate a developer profile summary based on their skills and projects.
 */
export async function generateDeveloperSummary(
  username: string,
  skills: string[],
  repos: { name: string; language: string; description: string }[],
  projectCount: number
): Promise<string> {
  const prompt = `Generate a concise, professional 2-3 paragraph developer profile summary for "${username}".

Their skills: ${skills.join(", ") || "Not specified yet"}
Their GitHub repositories (${repos.length} total):
${repos
  .slice(0, 10)
  .map((r) => `- ${r.name} (${r.language || "Unknown"}): ${r.description || "No description"}`)
  .join("\n")}
Projects collaborated on via DevConnect: ${projectCount}

Write in third person. Highlight their strengths, primary technologies, and experience level. Keep it under 200 words.`;

  return groqChat(prompt, {
    systemPrompt:
      "You are an AI that writes professional developer profile summaries. Be concise, insightful, and encouraging. Do not use markdown formatting.",
    temperature: 0.6,
  });
}

/**
 * Generate a project summary and extract key insights.
 */
export async function generateProjectSummary(
  title: string,
  description: string,
  technologies: string[],
  skills: string[]
): Promise<string> {
  const prompt = `Analyze this project and generate a concise summary:

Title: ${title}
Description: ${description}
Technologies: ${technologies.join(", ")}
Required Skills: ${skills.join(", ")}

Provide:
1. A 2-3 sentence project overview
2. Complexity level (Beginner/Intermediate/Advanced)
3. What makes this project interesting for collaborators

Keep the total response under 150 words. Do not use markdown.`;

  return groqChat(prompt, {
    systemPrompt:
      "You are an AI that analyzes software projects and provides useful summaries for developers looking to collaborate. Be concise and practical.",
    temperature: 0.5,
  });
}

/**
 * Generate AI-powered teammate recommendation reasoning.
 */
export async function generateMatchReasoning(
  projectTitle: string,
  projectSkills: string[],
  userSkills: string[],
  username: string
): Promise<string> {
  const prompt = `Why would "${username}" be a good fit for the project "${projectTitle}"?

Project needs: ${projectSkills.join(", ")}
User's skills: ${userSkills.join(", ")}

Write a single sentence (max 30 words) explaining the match. Be specific about overlapping or complementary skills.`;

  return groqChat(prompt, {
    systemPrompt:
      "You write very brief, specific match explanations for developer-project pairing. One sentence only.",
    maxTokens: 100,
    temperature: 0.4,
  });
}
