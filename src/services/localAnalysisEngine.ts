/**
 * Advanced Local AI-powered Resume Intelligence System
 * Performs signal-strength and signal-deficit evaluation using deterministic logic.
 */

// --- Constants & Dictionaries ---

const ACTION_VERBS = {
    HIGH: new Set([
        "spearheaded", "orchestrated", "transformed", "modernized", "pioneered", "revitalized",
        "masterminded", "overhauled", "engineered", "accelerated", "championed", "negotiated",
        "surpassed", "maximized", "liquidated", "capitalized", "instituted", "architected",
        "conceptualized", "formulated", "re-engineered", "pioneered", "optimized", "strategized"
    ]),
    MEDIUM: new Set([
        "developed", "managed", "led", "implemented", "designed", "optimized", "increased",
        "reduced", "saved", "automated", "built", "created", "expanded", "generated", "solved",
        "achieved", "amplified", "delivered", "enhanced", "executed", "improved", "launched",
        "integrated", "coordinated", "stabilized", "centralized", "facilitated", "supervised"
    ]),
    LOW: new Set([
        "assisted", "helped", "supported", "collaborated", "contributed", "participated",
        "handled", "organized", "maintained", "coordinated", "followed", "performed",
        "supervised", "documented", "monitored", "processed", "prepared", "assisted"
    ])
};

const WEAK_PHRASES = [
    { original: "responsible for", improved: "led / spearheaded / executed", reason: "Focuses on duty rather than achievement." },
    { original: "worked on", improved: "developed / engineered / implemented", reason: "Vague; doesn't specify exact contribution." },
    { original: "familiar with", improved: "proficient in / expert in", reason: "Sounds tentative; use definite competency terms." },
    { original: "participated in", improved: "contributed to / drove", reason: "Passive; fails to highlight specific impact." },
    { original: "handled", improved: "managed / directed / oversaw", reason: "Functional but lacks punch." },
    { original: "results-oriented", improved: "consistently achieving [X]% growth", reason: "Buzzword; replace with specific metrics." },
    { original: "team player", improved: "collaborated across functions to", reason: "Cliché; provide evidence of teamwork." },
    { original: "hard worker", improved: "consistently exceeded performance targets", reason: "Vague; use achievement-based language." },
    { original: "self-starter", improved: "initiated and completed [Project] with [Metric]", reason: "Show the initiative with a real example." },
    { original: "think outside the box", improved: "innovatively solved [Problem]", reason: "Overused idiom; use professional terms." },
    { original: "passionate about", improved: "dedicated to / specializing in", reason: "Focus on results, not emotion." },
    { original: "motivated", improved: "driven to deliver [X]", reason: "Generic personality trait." },
    { original: "proven track record", improved: "demonstrated success in [Metric]", reason: "Show the record instead of claiming it." },
    { original: "effectively", improved: "", reason: "Filler word; results should speak for themselves." },
    { original: "extensive experience", improved: "[N] years of experience in", reason: "Be specific about timeframes." },
    { original: "detail-oriented", improved: "ensured 100% accuracy in", reason: "Soft skill buzzword; show result." },
    { original: "dynamic", improved: "adaptable / multifaceted", reason: "Empty descriptor." },
    { original: "go-to person", improved: "recognized subject matter expert for", reason: "Informal and vague." }
];

const FILLER_PHRASES = new Set([
    "various", "multiple", "several", "extensive", "effective", "successful", "different",
    "dynamic", "professional", "excellent", "great", "best", "highly", "very", "really",
    "quickly", "rapidly", "seamlessly", "successfully", "diligently", "efficiently"
]);

const STOP_WORDS = new Set(["a", "an", "the", "and", "or", "but", "if", "then", "else", "when", "at", "from", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "in", "on", "of", "off", "over", "under", "again", "further", "then", "once", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did"]);

const PASSIVE_VOICE_AUXILIARY = ["is", "are", "was", "were", "be", "been", "being"];

const SECTION_PATTERNS: Record<string, RegExp> = {
    "Summary": /^(summary|objective|profile|professional profile|about me|career goal|executive summary|overview|background)/i,
    "Education": /^(education|academic|qualification|scholastic|degrees|university|college)/i,
    "Experience": /^(experience|work|professional|employment|history|career|occupational|positions|background)/i,
    "Projects": /^(projects|personal|key|academic|case studies|notable|portfolio)/i,
    "Skills": /^(skills|technical|key|competencies|technologies|expertise|proficiency|tools|stack)/i,
    "Certifications": /^(certifications|certificates|licenses|accreditations|development|training)/i,
    "Achievements": /^(achievements|awards|honors|accomplishments|recognitions|prizes)/i,
    "Languages": /^(languages|linguistic|proficiency)/i,
    "Publications": /^(publications|research|papers|conferences|patents)/i,
    "Links": /^(links|portfolio|socials|contact|websites|profiles)/i,
    "LinkedIn_About": /^(about|personal description|bio)/i,
    "LinkedIn_Posts": /^(activity|posts|articles|shared)/i,
    "LinkedIn_Endorsements": /^(endorsements|recommendations)/i
};

// --- Role Intelligence Models ---

interface RoleWeights {
    impact: number;
    depth: number;
    keyword: number;
    language: number;
    structure: number;
}

interface RoleExpectations {
    keywords: string[];
    mandatorySignals: string[];
    preferredSignals: string[];
    mandatorySections: string[];
    impactMetrics: string[];
    weights: RoleWeights;
}

const ROLE_CRITERIA: Record<string, RoleExpectations> = {
    "Software": {
        keywords: ["javascript", "typescript", "react", "node", "python", "java", "git", "ci/cd", "rest", "sql", "testing", "agile", "architecture", "microservices", "docker", "kubernetes", "frontend", "backend", "fullstack", "nosql", "aws", "azure", "cloud", "api", "database"],
        mandatorySignals: ["Development", "Design", "Software", "System", "Cloud", "API", "Web", "Application"],
        preferredSignals: ["Optimization", "Scalability", "Testing", "Deployment", "Infrastructure", "Automation"],
        mandatorySections: ["Skills", "Experience"],
        impactMetrics: ["latency", "throughput", "scale", "performance", "deployment", "efficiency"],
        weights: { impact: 0.3, depth: 0.3, keyword: 0.2, language: 0.1, structure: 0.1 }
    },
    "Cybersecurity": {
        keywords: ["siem", "firewall", "security", "penetration", "owasp", "network", "encryption", "incident", "vulnerability", "compliance", "soc", "threat", "endpoint", "cryptography", "linux", "cloud", "audit", "hacker"],
        mandatorySignals: ["Security", "Network", "Threat", "Audit", "Risk", "Compliance", "Identity", "Access", "Vulnerability"],
        preferredSignals: ["Forensics", "Mitigation", "Hardening", "Automation", "Intelligence"],
        mandatorySections: ["Skills", "Experience"],
        impactMetrics: ["mitigation", "detection", "compliance", "risk", "prevention"],
        weights: { impact: 0.25, depth: 0.25, keyword: 0.4, language: 0.05, structure: 0.05 }
    },
    "AI / Data": {
        keywords: ["tensorflow", "pytorch", "pandas", "numpy", "nlp", "machine learning", "data", "transformers", "regression", "statistics", "engineering", "deep learning", "spark", "hadoop", "keras", "python", "sql"],
        mandatorySignals: ["Data", "Analysis", "Model", "Algorithm", "Statistics", "Pipeline", "Learning"],
        preferredSignals: ["Inference", "Optimization", "Ethics", "Deployment", "Visualization"],
        mandatorySections: ["Skills", "Experience", "Projects"],
        impactMetrics: ["accuracy", "precision", "recall", "performance", "quality"],
        weights: { impact: 0.3, depth: 0.3, keyword: 0.2, language: 0.1, structure: 0.1 }
    },
    "Cloud": {
        keywords: ["aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible", "microservices", "serverless", "iac", "monitoring", "logging", "ci/cd", "automation", "linux", "contain"],
        mandatorySignals: ["Cloud", "Infrastructure", "Automation", "Container", "Network", "DevOps"],
        preferredSignals: ["Reliability", "Scalability", "Cost", "Security", "Migration"],
        mandatorySections: ["Skills", "Experience"],
        impactMetrics: ["uptime", "utilization", "cost", "frequency", "latency"],
        weights: { impact: 0.25, depth: 0.3, keyword: 0.3, language: 0.05, structure: 0.1 }
    },
    "Design": {
        keywords: ["figma", "sketch", "adobe", "ui", "ux", "prototyping", "research", "wireframing", "accessibility", "visual", "interaction", "product"],
        mandatorySignals: ["Design", "User", "Interface", "Experience", "Visual", "Interaction"],
        preferredSignals: ["Usability", "Consistency", "Systems", "Prototyping", "Research"],
        mandatorySections: ["Skills", "Projects"],
        impactMetrics: ["engagement", "conversion", "usability", "completion", "retention"],
        weights: { impact: 0.35, depth: 0.25, keyword: 0.2, language: 0.1, structure: 0.1 }
    },
    "Management": {
        keywords: ["agile", "scrum", "product", "project", "roadmap", "stakeholder", "kpi", "budget", "risk", "strategy", "leadership", "management"],
        mandatorySignals: ["Project", "Product", "Management", "Leadership", "Strategy", "Team"],
        preferredSignals: ["Cycle", "Lifecycle", "Change", "GTM", "Roadmap"],
        mandatorySections: ["Experience", "Summary"],
        impactMetrics: ["roi", "velocity", "budget", "delivery", "satisfaction"],
        weights: { impact: 0.45, depth: 0.15, keyword: 0.2, language: 0.1, structure: 0.1 }
    },
    "Business": {
        keywords: ["business", "analysis", "market", "sales", "marketing", "operations", "strategy", "crm", "analytical", "communication", "finance"],
        mandatorySignals: ["Business", "Market", "Analysis", "Sales", "Strategy", "Operations"],
        preferredSignals: ["Growth", "Improvement", "Efficiency", "Process", "Relations"],
        mandatorySections: ["Experience", "Summary"],
        impactMetrics: ["revenue", "growth", "share", "acquisition", "savings"],
        weights: { impact: 0.4, depth: 0.2, keyword: 0.2, language: 0.1, structure: 0.1 }
    }
};

// --- Interfaces ---

export interface PhraseImprovement {
    section: string;
    original: string;
    improved: string;
    reason: string;
}

export interface BulletScore {
    text: string;
    verbStrength: number;
    measurability: number;
    specificity: number;
    ownership: number;
    credibility: number;
    isPassive: boolean;
    isAchievement: boolean;
    issues: string[];
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
    phrase_improvements: PhraseImprovement[];
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
    bullet_level_issues: string[];
    improvementPriorities: string[];
}

// --- Intelligence Engine ---

class ResumeAnalyzer {
    private content: string;
    private targetRole: string;
    private lines: string[];
    private sections: Record<string, string[]> = {};
    private roleCategory: string;
    private reasoningTrace: string[] = [];

    constructor(content: string, targetRole: string = "") {
        this.content = content;
        this.targetRole = targetRole;
        this.lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        this.roleCategory = this.detectRoleCategory();
        this.reasoningTrace.push(`[INITIALIZATION] Target detected as: ${this.targetRole || 'Generic'}. Mapping to system category: ${this.roleCategory}.`);
        this.detectSections();
    }

    private detectRoleCategory(): string {
        const role = this.targetRole.toLowerCase();
        if (role.includes("software") || role.includes("developer") || role.includes("engineer")) return "Software";
        if (role.includes("security") || role.includes("cyber") || role.includes("hacker") || role.includes("penetration")) return "Cybersecurity";
        if (role.includes("data") || role.includes("ai") || role.includes("ml")) return "AI / Data";
        if (role.includes("cloud") || role.includes("devops") || role.includes("infrastructure")) return "Cloud";
        if (role.includes("design") || role.includes("ux") || role.includes("ui")) return "Design";
        if (role.includes("product") || role.includes("project")) return "Management";
        if (role.includes("business") || role.includes("sale") || role.includes("marketing") || role.includes("analyst")) return "Business";
        return "Business";
    }

    private isLinkedInProfile: boolean = false;

    private detectSections() {
        let currentSection = "Header";
        this.sections[currentSection] = [];

        if (this.content.includes("[SOURCE: LINKEDIN PROFILE]")) {
            this.isLinkedInProfile = true;
            this.reasoningTrace.push("[PARSING] Source identified as LinkedIn. Activating social-signal intelligence layer.");
        }

        for (const line of this.lines) {
            let foundSection = false;

            // Check for explicit LinkedIn markers from scraper
            const linkedinMarkerMatch = line.match(/^\[LINKEDIN SECTION: (.*)\]/i);
            if (linkedinMarkerMatch) {
                const rawName = linkedinMarkerMatch[1].toLowerCase();
                let mappedName = "Custom";
                if (rawName.includes("about")) mappedName = "LinkedIn_About";
                if (rawName.includes("activity") || rawName.includes("posts")) mappedName = "LinkedIn_Posts";
                if (rawName.includes("skills")) mappedName = "Skills";
                if (rawName.includes("experience")) mappedName = "Experience";
                if (rawName.includes("education")) mappedName = "Education";
                if (rawName.includes("endorsements") || rawName.includes("recommendations")) mappedName = "LinkedIn_Endorsements";

                currentSection = mappedName;
                if (!this.sections[currentSection]) this.sections[currentSection] = [];
                this.reasoningTrace.push(`[PARSING] Explicit LinkedIn block detected: "${mappedName}".`);
                continue;
            }

            const lineTokens = line.split(/\s+/);
            // Relaxed section detection for LinkedIn style headers
            if (lineTokens.length > 0 && lineTokens.length <= 8) {
                for (const [sectionName, pattern] of Object.entries(SECTION_PATTERNS)) {
                    if (pattern.test(line)) {
                        currentSection = sectionName;
                        if (!this.sections[currentSection]) this.sections[currentSection] = [];
                        foundSection = true;
                        this.reasoningTrace.push(`[PARSING] Discovered section: "${sectionName}" via pattern matching.`);
                        break;
                    }
                }
            }
            if (!foundSection) {
                this.sections[currentSection].push(line);
            }
        }
        this.reasoningTrace.push(`[PARSING] Document segmentation complete. ${Object.keys(this.sections).length} logical blocks identified.`);
    }

    private analyzeBullet(text: string): BulletScore {
        const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 0);
        const score: BulletScore = {
            text,
            verbStrength: 0,
            measurability: 0,
            specificity: 0,
            ownership: 0,
            credibility: 0,
            isPassive: false,
            isAchievement: false,
            issues: []
        };

        if (words.length === 0) return score;

        const firstWord = words[0];
        if (ACTION_VERBS.HIGH.has(firstWord)) {
            score.verbStrength = 100;
            score.ownership = 100;
        } else if (ACTION_VERBS.MEDIUM.has(firstWord)) {
            score.verbStrength = 70;
            score.ownership = 60;
        } else {
            score.verbStrength = 30;
            score.ownership = 20;
            score.issues.push("Weak initiation: Lacks impact-driven lead verb.");
        }

        const metricsRegex = /\d+%|\d+\s?k|\d+\s?m|\$\d+|[0-9]{2,}/g;
        const matches = text.match(metricsRegex);
        if (matches) {
            score.measurability = Math.min(100, matches.length * 40);
            score.isAchievement = score.ownership >= 60;
        }

        const fillerCount = words.filter(w => FILLER_PHRASES.has(w)).length;
        const totalWords = words.length;
        score.specificity = Math.max(0, 100 - (fillerCount / totalWords) * 300);
        score.credibility = totalWords > 8 && score.specificity > 60 ? 100 : 50;

        for (let i = 0; i < words.length - 1; i++) {
            if (PASSIVE_VOICE_AUXILIARY.includes(words[i]) && (words[i + 1].endsWith('ed') || words[i + 1].endsWith('en'))) {
                score.isPassive = true;
                break;
            }
        }

        return score;
    }

    private evaluateRoleAlignment() {
        const criteria = ROLE_CRITERIA[this.roleCategory];
        if (!criteria) return { score: 50, defects: [], penalty: 0, signalStrength: 50, missingKeywords: [], findings: [] };

        const contentLower = this.content.toLowerCase();

        const matchedMandatory = criteria.mandatorySignals.filter(s => contentLower.includes(s.toLowerCase()));
        const missingMandatory = criteria.mandatorySignals.filter(s => !contentLower.includes(s.toLowerCase()));
        const matchedPreferred = criteria.preferredSignals.filter(s => contentLower.includes(s.toLowerCase()));

        const signalMatchRatio = (matchedMandatory.length + (matchedPreferred.length * 0.4)) / (criteria.mandatorySignals.length + (criteria.preferredSignals.length * 0.4));

        this.reasoningTrace.push(`[ALIGNMENT] Evaluating alignment for ${this.roleCategory}. Found ${matchedMandatory.length}/${criteria.mandatorySignals.length} mandatory signals.`);

        let penalty = 0;
        const defects: string[] = [];
        const findings: string[] = [];

        // Dynamic Role-Specific Review Generation
        if (missingMandatory.length > 0) {
            const signalDeficit = (missingMandatory.length / criteria.mandatorySignals.length) * 35;
            penalty += signalDeficit;

            // Contextual Explanation for the role
            findings.push(`[ROLE REQUIREMENT] For a ${this.roleCategory} specialist, demonstrating proficiency in ${missingMandatory.slice(0, 3).join(", ")} is non-negotiable for high-tier ATS clearance.`);
            findings.push(`[MODIFICATION] Your resume currently lacks explicit signal markers for ${missingMandatory[0]}. You should re-write your experience bullets to specifically mention how you used ${missingMandatory[0]} to solve problems.`);
        }

        const missingMetrics = criteria.impactMetrics.filter(m => !contentLower.includes(m.toLowerCase()));
        if (missingMetrics.length > 0) {
            findings.push(`[IMPACT GAP] ${this.roleCategory} roles are evaluated on ${criteria.impactMetrics.slice(0, 2).join(" and ")}. Your profile lacks these specific quantitative markers.`);
            findings.push(`[MODIFICATION] Inject measurable results into your project descriptions. Instead of "Improved performance", use "${missingMetrics[0]} improved by X% via [Method]".`);
        }

        if (matchedMandatory.length < 2) {
            penalty += 15; // Heavy penalty for lack of core domain authority
            defects.push(`Critical Domain Deficit: Profile does not project the expected ${this.roleCategory} authority.`);
        }

        const score = Math.max(0, 100 - (penalty * 1.2));

        return {
            score,
            defects,
            penalty,
            signalStrength: Math.round(signalMatchRatio * 100),
            missingKeywords: criteria.keywords.filter(k => !contentLower.includes(k.toLowerCase())).slice(0, 6),
            findings
        };
    }

    private evaluateLinkedInSocialSignal() {
        if (!this.isLinkedInProfile) return { score: 100, penalty: 0, feedback: [], findings: [] };

        const feedback: string[] = [];
        const findings: string[] = [];
        let penalty = 0;

        this.reasoningTrace.push("[SOCIAL] Analyzing LinkedIn-specific social signals...");

        const highTrustKeywords = ["google", "microsoft", "amazon", "meta", "apple", "netflix", "openai", "engineer", "senior", "lead", "architect", "university"];
        const highTrustCount = highTrustKeywords.filter(k => this.content.toLowerCase().includes(k)).length;
        if (highTrustCount > 2) {
            this.reasoningTrace.push(`[SOCIAL] High-trust authority markers detected (${highTrustCount}). Adjusting scoring weights for elite profile.`);
        }

        // 1. About section analysis
        const aboutText = (this.sections["LinkedIn_About"] || []).join(" ").toLowerCase();
        if (aboutText.length < 50) {
            penalty += 8;
            feedback.push("About section is underdeveloped.");
            findings.push("[ISSUE] Sparse 'About' section on LinkedIn. [ACTION] Write a 2-3 paragraph professional narrative highlighting your mission and key tech stack.");
            this.reasoningTrace.push("[SOCIAL] Infrequent 'About' signal detected.");
        } else {
            this.reasoningTrace.push("[SOCIAL] Profile 'About' section verified for depth.");
        }

        // 2. Posts/Activity Analysis
        const posts = (this.sections["LinkedIn_Posts"] || []).join(" ").toLowerCase();
        const roleKeywords = ROLE_CRITERIA[this.roleCategory]?.keywords.slice(0, 12) || [];
        const industryKeywordsMatched = roleKeywords.filter(k => posts.includes(k.toLowerCase()));

        if (posts.length < 30) {
            penalty += 12;
            feedback.push("Low activity feed density.");
            findings.push(`[ISSUE] Minimal public activity on LinkedIn. [ACTION] Share 1-2 articles per week related to ${this.roleCategory} to build topical authority.`);
            this.reasoningTrace.push("[SOCIAL] Social signal deficit: low activity.");
        } else {
            const industryDensity = industryKeywordsMatched.length / Math.max(1, roleKeywords.length);
            if (industryDensity < 0.15) {
                penalty += 7;
                feedback.push("Activity feed has low topical relevance.");
                findings.push(`[ISSUE] LinkedIn activity feed is off-topic. [ACTION] Engage with and post content specific to ${this.roleCategory} trends.`);
                this.reasoningTrace.push(`[SOCIAL] Weak topical alignment in activity feed.`);
            } else {
                this.reasoningTrace.push(`[SOCIAL] Strong topical alignment confirmed in activity feed.`);
            }
        }

        // 3. Authority Recovery (Google Employee / Senior logic)
        if (highTrustCount > 3) {
            const recovery = Math.min(penalty, 15);
            penalty -= recovery;
            this.reasoningTrace.push(`[SOCIAL] High-authority profile detected. Recovered ${recovery} points for elite status.`);
        }

        return {
            score: Math.max(0, 100 - penalty),
            penalty,
            feedback,
            findings
        };
    }

    public analyze(): AnalysisResult {
        const sectionFeedback: Record<string, string[]> = {};
        const improvementPriorities: string[] = [];

        let overallDeficit = 0;
        const baseline = 100;

        const roleResult = this.evaluateRoleAlignment();
        overallDeficit += (roleResult.penalty * 0.5);
        this.reasoningTrace.push(`[DEFICIT] Role alignment analysis injected ${Math.round(roleResult.penalty * 0.5)} deficit points.`);

        const socialResult = this.evaluateLinkedInSocialSignal();
        if (this.isLinkedInProfile) {
            overallDeficit += (socialResult.penalty * 0.3);
            this.reasoningTrace.push(`[DEFICIT] Social signal deficit injected ${Math.round(socialResult.penalty * 0.3)} pts.`);
        }

        let structuralScore = 100;
        const sectionNames = Object.keys(this.sections);
        const criteria = ROLE_CRITERIA[this.roleCategory];

        if (criteria) {
            const missingSections = criteria.mandatorySections.filter(s => !sectionNames.includes(s));
            if (missingSections.length > 0) {
                structuralScore -= missingSections.length * 20;
                overallDeficit += missingSections.length * 8;
                this.reasoningTrace.push(`[STRUCTURE] Missing sections: ${missingSections.join(", ")}.`);
            }
        }

        let impactScore = 100;
        let specificityScore = 100;
        let bulletCount = 0;
        let achievementDeficit = 0;
        let credDeficit = 0;
        let passiveCount = 0;
        const bulletLevelIssues: string[] = [];
        const bulletFindings: string[] = [];

        const experienceLines = this.sections["Experience"] || this.sections["Header"];
        for (const line of experienceLines) {
            if (line.match(/^[•\-\*\.>\+]/) || (line.length > 25 && /^[A-Z]/.test(line))) {
                const b = this.analyzeBullet(line.replace(/^[•\-\*\.>\+]\s*/, ""));
                bulletCount++;

                if (!b.isAchievement) achievementDeficit += 8;
                if (b.credibility < 65) credDeficit += 8;
                if (b.isPassive) passiveCount++;

                if (b.issues.length > 0 && bulletLevelIssues.length < 3) {
                    bulletLevelIssues.push(`${line.substring(0, 30)}... [${b.issues[0]}]`);
                    bulletFindings.push(`[ISSUE] Bullet "${line.substring(0, 30)}..." lacks a measurable outcome. [ACTION] Use a result-oriented verb like "Spearheaded" and add a metric (e.g., "resulting in 20% efficiency gain").`);
                }
            }
        }

        const avgAchievementDeficit = bulletCount > 0 ? (achievementDeficit / bulletCount) : 10;
        const avgCredDeficit = bulletCount > 0 ? (credDeficit / bulletCount) : 8;

        impactScore = Math.max(0, 100 - (avgAchievementDeficit * 6));
        specificityScore = Math.max(0, 100 - (avgCredDeficit * 6));
        overallDeficit += (avgAchievementDeficit * 0.4) + (avgCredDeficit * 0.4);

        let finalScore = Math.round(baseline - overallDeficit);

        // Final sanity checks
        if (roleResult.signalStrength < 10) finalScore = Math.min(finalScore, 40);
        if (bulletCount === 0 && !this.sections["Experience"]) finalScore = Math.min(finalScore, 25);

        finalScore = Math.max(5, Math.min(100, finalScore));

        this.reasoningTrace.push(`[SCORING] Analysis converged at ${finalScore}% based on multi-source calibration.`);

        // Detail Feedback Generation (Detailed Review)
        const combinedFindings = [...roleResult.findings, ...socialResult.findings, ...bulletFindings];
        if (combinedFindings.length > 0) {
            sectionFeedback[`Strategic Review: ${this.targetRole || this.roleCategory} Domain`] = combinedFindings.slice(0, 6);
        }

        if (roleResult.defects.length > 0) {
            sectionFeedback["Technical Signal Deficits"] = roleResult.defects;
        }

        if (this.isLinkedInProfile) {
            sectionFeedback["LinkedIn Presence Logic"] = socialResult.feedback.map(f => `NOTICE: ${f}`);
        }

        sectionFeedback["Neural Reasoning Trace (CoT)"] = this.reasoningTrace;

        const result: AnalysisResult = {
            overallScore: finalScore,
            impact_score: Math.round(impactScore),
            specificity_score: Math.round(specificityScore),
            ats_score: Math.round(roleResult.score),
            overall_summary: `Neural assessment for **${this.targetRole || this.roleCategory}** tier. Signal profile is ${finalScore > 75 ? 'Superior' : finalScore > 45 ? 'Standard' : 'Initial'}. ${this.isLinkedInProfile ? 'LinkedIn verification active: ' + (socialResult.score > 80 ? 'High digital authority.' : 'Social signal requires amplification.') : ''} Identified ${bulletCount} markers with an alignment index of ${roleResult.signalStrength}%.`,
            detected_sections: sectionNames.filter(s => s !== "Header"),
            missing_recommended_sections: (criteria?.mandatorySections || []).filter(s => !sectionNames.includes(s)),
            section_feedback: sectionFeedback,
            phrase_improvements: [],
            atsOptimization: {
                keywordStrength: Math.min(100, roleResult.signalStrength + 5),
                formatParsing: structuralScore,
                skillsValidation: roleResult.signalStrength,
                keywordStrengthText: finalScore > 75 ? "Qualified" : "Borderline",
                missingKeywords: roleResult.missingKeywords
            },
            professionalSummary: `Strategically aligned ${this.targetRole || this.roleCategory} profile. Found ${impactScore > 70 ? 'strong' : 'moderate'} outcome-signals for ${this.roleCategory} domains. Prioritize refining ${roleResult.penalty > 10 ? 'mandatory keywords' : 'metric-density'}.`,
            hashtags: criteria?.keywords.slice(0, 4).map(k => `#${k}`) || [],
            verdict: {
                status: finalScore > 75 ? "Qualified Domain Expert" : "Requires Targeted Refinement",
                label: finalScore > 85 ? `Elite ${this.roleCategory}` : finalScore > 65 ? `Competitive Applicant` : `Early Career / Entry`
            },
            explanation: {
                impact: `Calculated via result-to-task density. Deficit deduction: ${Math.round(avgAchievementDeficit * 0.4)}%.`,
                specificity: `Weighted credibility analysis of technical jargon. Deficit: ${Math.round(avgCredDeficit * 0.4)}%.`,
                ats: `Computed via Role-Criticality Verification. Mandatory signals: ${roleResult.signalStrength}%.`
            },
            reasoning_path: this.reasoningTrace,
            selected_role: this.targetRole || this.roleCategory,
            structuralScore,
            languageScore: Math.round(100 - (passiveCount * 1.5) - (avgCredDeficit * 1.5)),
            roleAlignmentScore: roleResult.score,
            criticalGaps: roleResult.defects,
            bullet_level_issues: bulletLevelIssues,
            improvementPriorities: combinedFindings.map(f => f.slice(0, 40) + "...")
        };

        return result;
    }
}

export function analyzeResumeLocally(content: string, targetRole: string = "", linkedinUrl: string = ""): AnalysisResult {
    const analyzer = new ResumeAnalyzer(content, targetRole);
    return analyzer.analyze();
}
