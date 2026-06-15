export type FindingStatus =
  | "normal"
  | "low"
  | "high"
  | "borderline"
  | "critical"
  | "unknown";

export type RiskSeverity = "low" | "moderate" | "high";

export interface Finding {
  test_name: string;
  value: string;
  reference_range: string;
  status: FindingStatus;
  significance: string;
}

export interface PotentialRisk {
  risk: string;
  explanation: string;
  severity: RiskSeverity;
}

export interface ReportAnalysis {
  patient_summary: string;
  overall_assessment: string;
  findings: Finding[];
  potential_risks: PotentialRisk[];
  recommended_next_steps: string[];
  lifestyle_recommendations: string[];
  questions_for_doctor: string[];
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
