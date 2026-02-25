// AI Service utilizing OpenRouter API

const SYSTEM_PROMPT = `You are an advanced AI Resume and LinkedIn Profile Analyzer designed to provide precise, professional, and actionable career feedback.

Your role is to critically evaluate resumes and LinkedIn profile content with the accuracy of a senior recruiter, ATS system, and hiring manager combined.

CORE BEHAVIOR REQUIREMENTS:
• The system MUST NOT assume fixed resume sections.
• Dynamic Section Detection: Identify section headings from the content (e.g., Education, Experience, Projects, Skills, Summary, Certifications, Achievements, Internships, Publications, or custom headings).
• Do NOT rely on a predefined section list; allow unknown or unconventional sections.
• Generate feedback ONLY for sections present in the resume.
• Recommendations: If a major expected section is missing for the target role, suggest it.
• Feedback must be context-aware, section-specific, and avoid generic advice.

PHRASE IMPROVEMENT RULES:
• Extract weak or low-impact phrases from ANY section.
• Provide improvements in a clear comparison format.
• Provide a short justification for each suggestion.

FOLLOW THESE RULES STRICTLY:
• Be direct, specific, and constructive — avoid generic advice.
• Focus on impact, clarity, and professional strength.
• Prefer measurable achievements and strong action verbs.
• Maintain a confident, expert tone.

ANALYSIS CRITERIA:
• Strength of action verbs and measurable impact.
• Professional tone and clarity.
• Keyword richness and ATS compatibility.
• Relevance to modern hiring expectations.`;

export interface AnalysisResult {
  overallScore: number;
  overall_summary: string;
  detected_sections: string[];
  missing_recommended_sections: string[];
  section_feedback: {
    [key: string]: string[];
  };
  phrase_improvements: Array<{
    section: string;
    original: string;
    improved: string;
    reason: string;
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
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

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

  // Truncate content for better provider compatibility
  const truncatedContent = finalContent.length > 15000 ? finalContent.substring(0, 15000) + "..." : finalContent;

  const userContent = `Analyze the following professional profile content. 
${targetRole ? `CRITICAL: The candidate is targeting the role of "${targetRole}". All analysis, keywords, and the professional summary MUST be tailored specifically to this role's requirements and best practices.` : ''}
${linkedinUrl ? `LINKEDIN PROFILE URL: ${linkedinUrl}` : ''}

CONTEXT: If only a URL is provided, try to reason based on any available text or the URL path if it contains a name. Otherwise, provide a general professional analysis based on best practices for the target role.

CONTENT TO ANALYZE:
${truncatedContent || "No detailed content provided. Please perform a high-level analysis based on the LinkedIn URL and Target Role (if provided)."}

CRITICAL: Return ONLY a valid JSON object. No explanation.
REQUIRED JSON STRUCTURE:
{
  "overallScore": number (0-100),
  "overall_summary": "detailed assessment",
  "detected_sections": ["list of headings found in resume"],
  "missing_recommended_sections": ["sections that SHOULD be there but aren't"],
  "section_feedback": {
    "section_name": ["feedback item 1", "feedback item 2"]
  },
  "phrase_improvements": [
    { "section": "Experience", "original": "weak phrase", "improved": "strong phrase", "reason": "why" }
  ],
  "atsOptimization": {
    "keywordStrength": number,
    "formatParsing": number,
    "skillsValidation": number,
    "keywordStrengthText": "string",
    "missingKeywords": ["string"]
  },
  "professionalSummary": "highly optimized summary",
  "hashtags": ["relevant", "skills"],
  "verdict": { "status": "Ready/Needs Work", "label": "Expert Verdict Label" }
}`;


  let lastError = "";
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": import.meta.env.VITE_APP_URL || "http://localhost:3000",
          "X-OpenRouter-Title": "Resume Analyser",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "meta-llama/llama-3.3-70b-instruct:free",
          "messages": [
            {
              "role": "system",
              "content": SYSTEM_PROMPT
            },
            {
              "role": "user",
              "content": userContent
            }
          ]
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
        if (attempt < MAX_ATTEMPTS - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(r => setTimeout(r, delay));
        }
        continue;
      }

      const data = await response.json();
      let text = data.choices?.[0]?.message?.content;

      if (!text) {
        console.error("No content in response:", data);
        throw new Error("No response from AI");
      }

      // Clean the response
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);

    } catch (e: any) {
      console.error(`Attempt ${attempt + 1} failed:`, e);
      lastError = e.message;
      if (attempt < MAX_ATTEMPTS - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw new Error(`Analysis failed: ${lastError || "The AI service is currently overloaded. Please try again in 30 seconds."}`);
}
