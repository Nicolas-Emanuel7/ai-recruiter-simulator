export interface SimulateRequest {
  jobTitle: string;
  jobDescription?: string;
  experienceLevel: 'Júnior' | 'Pleno' | 'Sênior';
  resumeText: string;
}

export interface AtsAnalysis {
  keywordsMatched: string[];
  keywordsMissing: string[];
}

export interface TechnicalEvaluation {
  strengths: string[];
  risks: string[];
  perceivedSeniority: string;
}

export interface HrEvaluation {
  communication: string;
  clarity: string;
  redFlags: string[];
}

export interface FinalDecision {
  decision: 'AVANÇA' | 'TALVEZ' | 'REPROVA';
  justification: string;
}

export interface SimulateResponse {
  atsScore: number;
  atsAnalysis: AtsAnalysis;
  technicalEvaluation: TechnicalEvaluation;
  hrEvaluation: HrEvaluation;
  finalDecision: FinalDecision;
  resumeSuggestions: string[];
}
