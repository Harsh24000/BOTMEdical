export type RiskSeverity = "low" | "moderate" | "high";

export interface Alert {
  title: string;
  description: string;
  severity: "red" | "orange";
}

export interface ReportAnalysis {
  cohort_risk: string;
  alerts: Alert[];
  disclaimer: string;
}

export interface UploadResponse {
  session_id: string;
  analysis: ReportAnalysis;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
