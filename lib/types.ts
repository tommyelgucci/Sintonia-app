export type FlowIntensity = "none" | "light" | "medium" | "heavy";

export interface DailyLog {
  logDate: string; // 'YYYY-MM-DD'
  flow: FlowIntensity;
  symptoms: string[];
  mood: string[];
  notes: string | null;
}

export interface CycleRecord {
  startDate: string; // 'YYYY-MM-DD'
  periodLength: number | null;
}
