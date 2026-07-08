export interface Alert {
  title: string;
  description: string;
  severity: "mild" | "moderate" | "severe";
}

export interface Finding {
  test_name: string;
  value: string;
  status: "normal" | "abnormal";
  significance: string;
}

export interface ReportAnalysis {
  cohort_risk: string;
  alerts: Alert[];
  findings: Finding[];
  premium_preview: string;
  starter_suggestions: string[];
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
