import { analyzeResumeLocally } from './localAnalysisEngine';

export interface ImprovementInsight {
  detected: string;
  why: string;
  recommendation: string;
  improvement: string;
}

export interface AnalysisResult {
  overallScore: number;
  impact_score: number;
  specificity_score: number;
  ats_score: number;
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
  explanation: {
    impact: string;
    specificity: string;
    ats: string;
  };
  reasoning_path: string[];
  selected_role: string;
  structuralScore: number;
  languageScore: number;
  roleAlignmentScore: number;
  criticalGaps: string[];
  bullet_level_issues: ImprovementInsight[];
  improvementPriorities: string[];
  critical_improvement_areas: ImprovementInsight[];
  missing_signals: ImprovementInsight[];
  recommendations: ImprovementInsight[];
}

export async function analyzeResume(content: string, targetRole?: string, linkedinUrl?: string): Promise<AnalysisResult> {
  let finalContent = content;

  // If a LinkedIn URL is provided but no content is pasted/uploaded, try to fetch some data
  if (linkedinUrl && !content.trim()) {
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(linkedinUrl)}`;
      const resp = await fetch(proxyUrl);
      if (resp.ok) {
        const data = await resp.json();
        const html = data.contents;

        if (html) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;

          // Identify LinkedIn-specific sections if possible
          const sections: string[] = [];

          // Search for common LinkedIn data containers or headings
          const containers = tempDiv.querySelectorAll('section, div.artdeco-card');
          containers.forEach(container => {
            const h2 = container.querySelector('h2');
            if (h2) {
              const sectionName = h2.innerText.trim();
              const sectionContent = (container as HTMLElement).innerText.trim();
              if (sectionContent) {
                sections.push(`[LINKEDIN SECTION: ${sectionName}]\n${sectionContent}`);
              }
            }
          });

          if (sections.length > 0) {
            finalContent = "[SOURCE: LINKEDIN PROFILE]\n" + sections.join("\n\n");
          } else {
            const mainContent = tempDiv.querySelector('main') || tempDiv.querySelector('body') || tempDiv;
            mainContent.querySelectorAll('script, style, nav, footer').forEach(el => el.remove());
            const extractedText = (mainContent as HTMLElement).innerText || "";
            finalContent = "[SOURCE: LINKEDIN PROFILE]\n" + extractedText;
          }
        }
      }
    } catch (e) {
      console.warn("LinkedIn fetch failed, providing URL context only:", e);
    }
  }

  // Use the local analysis engine
  await new Promise(resolve => setTimeout(resolve, 800));

  try {
    const result = analyzeResumeLocally(finalContent, targetRole, linkedinUrl);
    return result as AnalysisResult;
  } catch (error) {
    console.error("Local analysis failed:", error);
    throw new Error("Failed to analyze resume locally. Please check the input content.");
  }
}
