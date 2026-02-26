/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import {
  AlertCircle,
  CheckCircle2,
  Zap,
  Loader2,
  Upload,
  FileIcon,
  X,
  BrainCircuit,
  Bolt,
  Copy,
  Star,
  ShieldAlert,
  ChevronDown,
  Link as LinkIcon,
  RefreshCw,
  Github,
  Globe
} from 'lucide-react';
import { analyzeResume, type AnalysisResult } from './services/aiService';
import { cn } from './lib/utils';
import { extractTextFromFile } from './lib/fileParser';

const ROLE_SECTIONS = [
  {
    title: "Software / Development Roles",
    roles: [
      "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
      "Web Developer", "Mobile App Developer", "Application Developer", "Systems Engineer", "API Developer"
    ]
  },
  {
    title: "Cybersecurity / Security Roles",
    roles: [
      "Cybersecurity Analyst", "Security Analyst", "SOC Analyst", "Information Security Analyst",
      "Ethical Hacker", "Penetration Tester", "Vulnerability Analyst", "Security Engineer",
      "Network Security Engineer", "Digital Forensics Analyst"
    ]
  },
  {
    title: "AI / Data / ML Roles",
    roles: [
      "Data Scientist", "Machine Learning Engineer", "AI Engineer", "AI/ML Developer",
      "Data Analyst", "Business Intelligence Analyst", "NLP Engineer", "Computer Vision Engineer",
      "Data Engineer", "Research Engineer (AI)"
    ]
  },
  {
    title: "Cloud / Infrastructure Roles",
    roles: [
      "Cloud Architect", "Cloud Engineer", "DevOps Engineer", "Site Reliability Engineer (SRE)",
      "Infrastructure Engineer", "Platform Engineer", "Cloud Security Engineer"
    ]
  },
  {
    title: "Design / UI / UX Roles",
    roles: [
      "UI Designer", "UX Designer", "UI/UX Designer", "Product Designer", "Interaction Designer"
    ]
  },
  {
    title: "Management / Product Roles",
    roles: [
      "Product Manager", "Technical Product Manager", "Project Manager", "Program Manager", "Engineering Manager"
    ]
  },
  {
    title: "Business / Other Common Roles",
    roles: [
      "Marketing Manager / Director", "Financial Analyst", "Operations Manager", "Business Analyst"
    ]
  }
];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const handleAnalyze = async (roleOverride?: string) => {
    if (isAnalyzing) return;

    // Use override if provided, otherwise fall back to state
    const currentRole = roleOverride || targetRole;

    setIsAnalyzing(true);
    setError(null);
    try {
      let contentToAnalyze = pastedText;

      if (file) {
        const fileText = await extractTextFromFile(file);
        contentToAnalyze = fileText + "\n" + contentToAnalyze;
      }

      const hasContent = contentToAnalyze.trim().length > 0 || linkedinUrl.trim().length > 0;

      if (!hasContent) {
        // If triggered by role selection, we might not want to show an error yet if they haven't uploaded anything
        if (!roleOverride) {
          throw new Error('Please provide a resume file, LinkedIn URL, or paste your profile content.');
        }
        return;
      }

      const data = await analyzeResume(contentToAnalyze, currentRole, linkedinUrl);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze profile. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setFile(null);
    setLinkedinUrl('');
    setPastedText('');
    setTargetRole('');
    setError(null);
  };

  const copyToClipboard = () => {
    if (result?.professionalSummary) {
      navigator.clipboard.writeText(result.professionalSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Abstract Background Shapes */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
        <div className="bg-gradient-mesh absolute inset-0"></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between glass-card border-x-0 border-t-0 bg-background-dark/20">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center">
            <BrainCircuit className="text-white" size={20} />
          </div>
          <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Resume Analyser
          </span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="input-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-12"
            >
              {/* Hero Title */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                  AI Resume & LinkedIn Analyzer
                </h1>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                  Harness advanced neural analysis to optimize your professional profile for high-tier roles and beat modern ATS systems.
                </p>
              </div>

              {/* Centered Main Input Section */}
              <section className="max-w-4xl mx-auto">
                <div className="glass-card rounded-2xl p-8 border border-white/10 shadow-2xl space-y-8">
                  <div className="space-y-6">
                    <label className="block text-sm font-medium text-slate-300 px-1">Profile Content</label>

                    <div className="space-y-6">
                      {/* Upload Section */}
                      {!file ? (
                        <div
                          {...getRootProps()}
                          className={cn(
                            "glass-input rounded-xl border-dashed border-2 p-8 text-center cursor-pointer group transition-all",
                            isDragActive ? "border-primary bg-primary/5" : "border-white/10 hover:border-primary/50"
                          )}
                        >
                          <input {...getInputProps()} />
                          <div className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                            <Upload className="text-slate-400 group-hover:text-primary" size={24} />
                          </div>
                          <p className="text-sm text-slate-300">Drag & Drop or <span className="text-primary font-semibold">Upload Resume</span></p>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">PDF, DOCX (Max 5MB)</p>
                        </div>
                      ) : (
                        <div className="glass-input rounded-xl border border-white/10 p-6 flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="bg-primary/20 p-3 rounded-lg text-primary">
                              <FileIcon size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white truncate max-w-[200px]">{file.name}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button onClick={() => setFile(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all">
                            <X size={18} />
                          </button>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* LinkedIn URL */}
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-2 px-1 uppercase tracking-wider">LinkedIn Profile URL</label>
                          <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input
                              type="url"
                              value={linkedinUrl}
                              onChange={(e) => setLinkedinUrl(e.target.value)}
                              className="glass-input w-full rounded-lg h-12 pl-11 pr-4 text-slate-100 placeholder:text-slate-600 focus:ring-0"
                              placeholder="https://linkedin.com/in/username"
                            />
                          </div>
                        </div>
                        {/* Small Text Area */}
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-2 px-1 uppercase tracking-wider">Paste Text Directly</label>
                          <textarea
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            className="glass-input w-full rounded-lg h-12 p-3 text-sm text-slate-100 placeholder:text-slate-600 resize-none overflow-hidden focus:h-32 transition-all"
                            placeholder="Alternative: Paste content here..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 items-end pt-6 border-t border-white/5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2 px-1">Target Professional Role</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                          disabled={isAnalyzing}
                          className="glass-input w-full rounded-lg h-12 px-4 text-left text-slate-100 flex items-center justify-between focus:ring-1 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
                        >
                          <span className={targetRole ? "text-slate-100" : "text-slate-500"}>
                            {targetRole || "Select Role"}
                          </span>
                          <ChevronDown
                            className={cn(
                              "text-slate-500 transition-transform duration-300",
                              isRoleDropdownOpen && "rotate-180 text-primary"
                            )}
                            size={18}
                          />
                        </button>

                        <AnimatePresence>
                          {isRoleDropdownOpen && (
                            <>
                              {/* Backdrop to close dropdown */}
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsRoleDropdownOpen(false)}
                              />
                              <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-full mt-2 left-0 w-full max-h-80 overflow-y-auto z-50 glass-card rounded-xl border border-white/10 shadow-2xl custom-scrollbar"
                              >
                                {ROLE_SECTIONS.map((section, idx) => (
                                  <div key={idx} className="p-2">
                                    <h4 className="px-3 py-2 text-[10px] font-black text-primary uppercase tracking-widest border-b border-white/5 mb-1 bg-white/5 rounded-t-lg">
                                      {section.title}
                                    </h4>
                                    <div className="space-y-1">
                                      {section.roles.map(role => (
                                        <button
                                          key={role}
                                          onClick={() => {
                                            setTargetRole(role);
                                            setIsRoleDropdownOpen(false);
                                            handleAnalyze(role);
                                          }}
                                          className={cn(
                                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group",
                                            targetRole === role
                                              ? "bg-primary/20 text-white font-bold"
                                              : "text-slate-300 hover:bg-white/10 hover:text-white"
                                          )}
                                        >
                                          {role}
                                          {targetRole === role && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(43,108,238,0.8)]" />
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAnalyze()}
                      disabled={isAnalyzing || (!file && !linkedinUrl && !pastedText.trim())}
                      className={cn(
                        "glow-button bg-primary hover:bg-primary/90 text-white font-semibold h-12 rounded-lg flex items-center justify-center gap-2 group transition-all",
                        (isAnalyzing || (!file && !linkedinUrl && !pastedText.trim())) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span>Analyzing Profile...</span>
                        </>
                      ) : (
                        <>
                          <span>Analyze Profile</span>
                          <Bolt className="group-hover:translate-x-1 transition-transform" size={20} />
                        </>
                      )}
                    </button>
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                      <ShieldAlert size={16} />
                      {error}
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="result-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Results Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold tracking-tight text-white">Analysis Report</h2>
                  <p className="text-slate-400">Comprehensive evaluation of your professional profile.</p>
                </div>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors glass-card rounded-lg"
                >
                  <RefreshCw size={16} />
                  New Analysis
                </button>
              </div>

              {/* Analysis Results Grid */}
              <section className="grid md:grid-cols-12 gap-6">
                {/* Resume Strength Overview */}
                <div className="md:col-span-4 glass-card rounded-xl p-8 flex flex-col items-center justify-center text-center">
                  <h3 className="text-slate-400 text-xs font-bold mb-8 uppercase tracking-widest">Strength Overview</h3>
                  <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                    <svg className="w-full h-full -rotate-90">
                      <circle className="text-white/5" cx="80" cy="80" fill="transparent" r="74" stroke="currentColor" strokeWidth="8"></circle>
                      <motion.circle
                        className="text-primary"
                        cx="80"
                        cy="80"
                        fill="transparent"
                        r="74"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={464.9}
                        initial={{ strokeDashoffset: 464.9 }}
                        animate={{ strokeDashoffset: 464.9 - (464.9 * result.overallScore) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    <span className="absolute text-4xl font-black text-white">{result.overallScore}%</span>
                  </div>
                  <p className="text-slate-100 font-bold text-lg">
                    {result.overallScore >= 80 ? 'Strong Profile' : result.overallScore >= 60 ? 'Good Potential' : 'Needs Improvement'}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {result.overallScore >= 80 ? 'Top 15% of applicants in your field' : 'Competitive in some markets'}
                  </p>
                </div>

                {/* Advanced Multi-Dimensional Scoring */}
                <div className="md:col-span-8 glass-card rounded-xl p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Advanced Analysis Metrics</h3>
                    <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-1 rounded tracking-widest uppercase">
                      Deterministic Local Analysis
                    </span>
                  </div>
                  <div className="grid md:grid-cols-3 gap-8">
                    {/* Impact Score */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Impact Score</p>
                          <p className="text-2xl font-black text-white">{result.impact_score}%</p>
                        </div>
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Zap size={16} className="text-primary" />
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary/50 to-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${result.impact_score}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed italic">
                        {result.explanation.impact}
                      </p>
                    </div>

                    {/* Specificity Score */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Specificity Score</p>
                          <p className="text-2xl font-black text-white">{result.specificity_score}%</p>
                        </div>
                        <div className="bg-blue-500/10 p-2 rounded-lg">
                          <BrainCircuit size={16} className="text-blue-500" />
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500/50 to-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${result.specificity_score}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed italic">
                        {result.explanation.specificity}
                      </p>
                    </div>

                    {/* ATS Score */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">ATS Alignment</p>
                          <p className="text-2xl font-black text-white">{result.ats_score}%</p>
                        </div>
                        <div className="bg-emerald-500/10 p-2 rounded-lg">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-emerald-500/50 to-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${result.ats_score}%` }}
                          transition={{ duration: 1, delay: 0.4 }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed italic">
                        {result.explanation.ats}
                      </p>
                    </div>
                  </div>

                  {/* Keyword signals */}
                  <div className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex justify-between text-sm mb-4">
                      <span className="text-slate-400 font-medium">ATS Optimization Progress</span>
                      <span className="text-primary font-black uppercase text-[10px]">{result.atsOptimization.keywordStrengthText}</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Parsing Reliability</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-grow h-1 bg-white/10 rounded-full">
                            <div className="h-full bg-primary" style={{ width: `${result.atsOptimization.formatParsing}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-white">{result.atsOptimization.formatParsing}%</span>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Skills Validation</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-grow h-1 bg-white/10 rounded-full">
                            <div className="h-full bg-primary" style={{ width: `${result.atsOptimization.skillsValidation}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-white">{result.atsOptimization.skillsValidation}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Section Review & Improvements */}
                <div className="md:col-span-6 glass-card rounded-xl p-8">
                  <h3 className="text-slate-400 text-xs font-bold mb-8 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="text-amber-500" size={16} />
                    Resume Analysis
                  </h3>

                  <div className="space-y-8">
                    {/* Section Feedback */}
                    {Object.entries(result.section_feedback).map(([section, items], idx) => (
                      <div key={idx} className="space-y-4">
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-widest px-2 py-1 bg-primary/5 rounded border border-primary/10 inline-block">
                          {section}
                        </h4>
                        <ul className="space-y-3">
                          {items.map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0 opacity-60"></div>
                              <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* Phrase Improvements */}
                    {result.phrase_improvements.length > 0 && (
                      <div className="pt-6 border-t border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2 py-1 bg-amber-500/5 rounded border border-amber-500/10 inline-block">
                          Phrase Improvements
                        </h4>
                        <ul className="space-y-6">
                          {result.phrase_improvements.map((item, idx) => (
                            <li key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5">
                              <div className="flex flex-col gap-2">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                  {item.section}
                                </span>
                                <p className="text-sm font-medium text-slate-400 italic flex items-center gap-2">
                                  "{item.original}"
                                  <span className="text-primary">→</span>
                                  <span className="text-white font-bold">"{item.improved}"</span>
                                </p>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                  {item.reason}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing Sections */}
                    {result.missing_recommended_sections.length > 0 && (
                      <div className="pt-6 border-t border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-2 py-1 bg-emerald-500/5 rounded border border-emerald-500/10 inline-block">
                          Recommendations
                        </h4>
                        <div className="space-y-2">
                          <p className="text-xs text-slate-400">Consider adding these high-impact sections:</p>
                          <div className="flex flex-wrap gap-2">
                            {result.missing_recommended_sections.map((section, idx) => (
                              <span key={idx} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-300 font-medium">
                                + {section}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Generated Professional Summary */}
                <div className="md:col-span-6 glass-card rounded-xl p-8 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Zap className="text-primary" size={16} />
                      AI-Optimized Summary
                    </h3>
                    <button
                      onClick={copyToClipboard}
                      className={cn(
                        "text-slate-500 hover:text-white transition-all p-1.5 rounded-lg hover:bg-white/5",
                        copied && "text-emerald-400"
                      )}
                    >
                      {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <div className="bg-white/5 rounded-xl p-6 border border-white/5 relative flex-grow mb-4">
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2 opacity-60">Overall Assessment</p>
                    <p className="text-slate-300 text-sm italic mb-4 border-b border-white/5 pb-4">
                      {result.overall_summary}
                    </p>
                    <p className="text-slate-200 leading-relaxed text-sm font-medium">
                      {result.professionalSummary}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {result.hashtags.map((tag, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-white/5 rounded text-[10px] text-slate-400 font-black uppercase tracking-wider border border-white/5">
                        #{tag.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Final Expert Verdict */}
                <div className="md:col-span-12 glass-card rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-primary/60 shadow-xl">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Final Expert Verdict</h4>
                      <p className="text-slate-400 text-sm">
                        Based on current market trends{targetRole ? ` for ${targetRole} roles` : ''}.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Status</p>
                      <p className="text-lg font-black text-slate-100">{result.verdict.status}</p>
                    </div>
                    <span className="inline-flex items-center gap-2 bg-primary px-8 py-3 rounded-xl font-black text-white shadow-lg shadow-primary/30 text-sm tracking-widest uppercase">
                      {result.verdict.label}
                      <Star size={18} fill="currentColor" />
                    </span>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 text-center text-slate-600 text-sm pb-12">
        <p className="text-slate-400 font-medium">Developed by B A Fareed Ahamed</p>

        <div className="mt-6 flex justify-center gap-4">
          <a
            href="https://github.com/fareedahamed0425-code"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-all glass-card rounded-xl border border-white/5 hover:border-white/10"
          >
            <Github size={16} />
            GitHub
          </a>
          <a
            href="https://bafareedahamedportfolio.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-all glass-card rounded-xl border border-white/5 hover:border-white/10"
          >
            <Globe size={16} />
            Portfolio
          </a>
        </div>


      </footer>
    </div>
  );
}
