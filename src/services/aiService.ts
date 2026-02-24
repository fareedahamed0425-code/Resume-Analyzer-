// AI Service utilizing OpenRouter API

const SYSTEM_PROMPT = `You are an advanced AI Resume and LinkedIn Profile Analyzer designed to provide precise, professional, and actionable career feedback.

Your role is to critically evaluate resumes and LinkedIn profile content with the accuracy of a senior recruiter, ATS system, and hiring manager combined.

Follow these rules strictly:
• Be direct, specific, and constructive — avoid generic advice
• Focus on impact, clarity, and professional strength
• Prefer measurable achievements and strong action verbs
• Never provide vague suggestions
• Maintain a confident, expert tone

TASKS TO PERFORM:
1. Detect weak, generic, or ineffective phrases
2. Explain why each phrase is weak
3. Provide significantly stronger rewritten versions
4. Evaluate ATS optimization and keyword strength
5. Identify missing or underused high-value keywords
6. Generate a powerful professional summary
7. Provide an overall quality assessment (score 0-100)

ANALYSIS CRITERIA:
• Strength of action verbs
• Specificity and measurable impact
• Professional tone and clarity
• Keyword richness and ATS compatibility
• Relevance to modern hiring expectations
• Avoidance of clichés and filler language`;

export interface AnalysisResult {
  overallScore: number;
  overallAssessment: string;
  weakPhrases: Array<{
    phrase: string;
    reason: string;
    rewrite: string;
  }>;
  atsOptimization: {
    keywordStrength: number;
    formatParsing: number;
    skillsValidation: number;
    keywordStrengthText: string;
    missingKeywords: string[];
  };
  professionalSummary: string;
  hashtags: string[];
  verdict: {
    status: string;
    label: string;
  };
}

export async function analyzeResume(content: string, targetRole?: string, linkedinUrl?: string): Promise<AnalysisResult> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || "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";

  let finalContent = content;

  // If a LinkedIn URL is provided but no content is pasted/uploaded, try to fetch some data
  if (linkedinUrl && !content.trim()) {
    try {
      // Attempting to fetch public profile data via a CORS proxy
      // This is a best-effort approach for public profiles
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(linkedinUrl)}`;
      const resp = await fetch(proxyUrl);
      if (resp.ok) {
        const data = await resp.json();
        const html = data.contents;

        if (html) {
          // Very basic text extraction from the fetched HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;

          // Focus on main content areas if they exist
          const mainContent = tempDiv.querySelector('main') || tempDiv.querySelector('body') || tempDiv;

          // Remove scripts and styles to get cleaner text
          mainContent.querySelectorAll('script, style, nav, footer').forEach(el => el.remove());

          const extractedText = (mainContent as HTMLElement).innerText || "";

          // Only use if we got something meaningful (not just a login wall or empty page)
          if (extractedText.trim().length > 200 && !extractedText.includes("Sign in to view")) {
            finalContent = extractedText;
          } else if (extractedText.trim().length > 50) {
            // Fallback: at least we got something, maybe name and headline
            finalContent = extractedText;
          }
        }
      }
    } catch (e) {
      console.warn("LinkedIn fetch failed, providing URL context only:", e);
    }
  }

  // Truncate content to 30k chars to be safer with free tier providers
  const truncatedContent = finalContent.length > 30000 ? finalContent.substring(0, 30000) + "..." : finalContent;

  const fullPrompt = `${SYSTEM_PROMPT}

Analyze the following professional profile content. 
${targetRole ? `TARGET ROLE: ${targetRole}` : ''}
${linkedinUrl ? `LINKEDIN PROFILE URL: ${linkedinUrl}` : ''}

CONTEXT: If only a URL is provided, try to reason based on any available text or the URL path if it contains a name. If you have any internal knowledge of this public figure/profile, use it. Otherwise, provide a general professional analysis based on best practices for the target role.

CONTENT TO ANALYZE:
${truncatedContent || "No detailed content provided. Please perform a high-level analysis based on the LinkedIn URL and Target Role (if provided)."}

CRITICAL: Return ONLY a valid JSON object. No explanation.
JSON STRUCTURE:
{
  "overallScore": number,
  "overallAssessment": "string",
  "weakPhrases": [{ "phrase": "string", "reason": "string", "rewrite": "string" }],
  "atsOptimization": {
    "keywordStrength": number,
    "formatParsing": number,
    "skillsValidation": number,
    "keywordStrengthText": "string",
    "missingKeywords": ["string"]
  },
  "professionalSummary": "string",
  "hashtags": ["string"],
  "verdict": { "status": "string", "label": "string" }
}`;

  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://careeredge.ai",
          "X-Title": "CareerEdge Analyzer",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "meta-llama/llama-3.3-70b-instruct:free",
          "messages": [
            {
              "role": "user",
              "content": fullPrompt
            }
          ],
          "response_format": { "type": "json_object" }
        })
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          console.error("OpenRouter Error:", errorData);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          const errorText = await response.text().catch(() => "");
          console.error("OpenRouter Non-JSON Error:", errorText);
        }
        lastError = errorMessage;
        // Wait 1s before retry if it's a provider error
        if (attempt < 1) await new Promise(r => setTimeout(r, 1000));
        continue;
      }

      const data = await response.json();
      let text = data.choices[0].message.content;

      if (!text) throw new Error("No response from AI");

      // Clean the response
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);

    } catch (e: any) {
      console.error(`Attempt ${attempt + 1} failed:`, e);
      lastError = e.message;
      if (attempt < 1) await new Promise(r => setTimeout(r, 1000));
    }
  }

  throw new Error(`Analysis failed: ${lastError || "The AI service is currently overloaded. Please try again in 30 seconds."}`);
}
