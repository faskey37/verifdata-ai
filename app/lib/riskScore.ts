import { CustomerRecord } from '@/app/types';

export function calculateRiskScore(record: Partial<CustomerRecord>): { score: number; level: 'trusted' | 'review' | 'high_risk' } {
  let score = 100;
  
  if (record.status === 'invalid') score -= 40;
  else if (record.status === 'needs_review') score -= 15;
  
  if (!record.address || record.address.length < 5) score -= 20;
  else if (record.address.length < 15) score -= 8;
  
  if (record.isDuplicate) score -= 25;
  
  if (record.qualityFlags?.some(f => f.includes('Missing or short name'))) score -= 10;
  if (record.qualityFlags?.some(f => f.includes('Invalid email'))) score -= 5;
  if (record.qualityFlags?.some(f => f.includes('address'))) score -= 8;
  
  score = Math.max(0, Math.min(100, Math.round(score)));
  
  let level: 'trusted' | 'review' | 'high_risk';
  if (score >= 85) level = 'trusted';
  else if (score >= 55) level = 'review';
  else level = 'high_risk';
  
  return { score, level };
}

export function getRiskColor(level: string): string {
  switch(level) {
    case 'trusted': return 'text-green-600 bg-green-50 border-green-200';
    case 'review': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'high_risk': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getRiskIcon(level: string): string {
  switch(level) {
    case 'trusted': return '✅';
    case 'review': return '⚠️';
    case 'high_risk': return '🔴';
    default: return '❓';
  }
}