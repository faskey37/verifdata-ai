export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: 'verified' | 'invalid' | 'needs_review' | 'pending';
  riskScore: number;
  riskLevel: 'trusted' | 'review' | 'high_risk';
  isDuplicate: boolean;
  qualityFlags: string[];
  carrier?: string;
  country?: string;
}

export interface AnalyticsData {
  total: number;
  verified: number;
  invalid: number;
  needsReview: number;
  duplicates: number;
}