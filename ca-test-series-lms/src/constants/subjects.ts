// Canonical list of CA subjects organized by level
// This matches the backend subjects constant

export const SUBJECTS_BY_LEVEL = {
  FOUNDATION: [
    "Accounting",
    "Business Laws",
    "Quantitative Aptitude",
    "Business Economics",
    "Combo",
  ],
  INTERMEDIATE: [
    "Advanced Accounting",
    "Corporate and Other Laws",
    "Taxation",
    "Cost and Management Accounting",
    "Auditing and Ethics",
    "Financial Management and Strategic Management",
    "Combo",
  ],
  FINAL: [
    "Financial Reporting",
    "Advanced Financial Management",
    "Advanced Auditing, Assurance and Professional Ethics",
    "Direct Tax Laws and International Taxation",
    "Indirect Tax Laws",
    "Integrated Business Solution",
    "Corporate and Economic Laws",
    "Strategic Cost and Performance Management",
    "Combo",
  ],
  ALL: [
    // CA Foundation
    "Accounting",
    "Business Laws",
    "Quantitative Aptitude",
    "Business Economics",
    // CA Intermediate
    "Advanced Accounting",
    "Corporate and Other Laws",
    "Taxation",
    "Cost and Management Accounting",
    "Auditing and Ethics",
    "Financial Management and Strategic Management",
    // CA Final
    "Financial Reporting",
    "Advanced Financial Management",
    "Advanced Auditing, Assurance and Professional Ethics",
    "Direct Tax Laws and International Taxation",
    "Indirect Tax Laws",
    "Integrated Business Solution",
    "Corporate and Economic Laws",
    "Strategic Cost and Performance Management",
    // Combo (available at all levels)
    "Combo",
  ],
} as const;

// Flat list of all subjects
export const ALL_SUBJECTS = [
  ...SUBJECTS_BY_LEVEL.FOUNDATION,
  ...SUBJECTS_BY_LEVEL.INTERMEDIATE,
  ...SUBJECTS_BY_LEVEL.FINAL,
] as const;

// Type definitions for TypeScript
export type CALevel = keyof typeof SUBJECTS_BY_LEVEL;
export type FoundationSubject = (typeof SUBJECTS_BY_LEVEL.FOUNDATION)[number];
export type IntermediateSubject = (typeof SUBJECTS_BY_LEVEL.INTERMEDIATE)[number];
export type FinalSubject = (typeof SUBJECTS_BY_LEVEL.FINAL)[number];
export type Subject = (typeof ALL_SUBJECTS)[number];

// Helper function to get subjects for a specific level
export const getSubjectsByLevel = (level: CALevel): readonly string[] => {
  return SUBJECTS_BY_LEVEL[level];
};

// Helper function to check if a subject belongs to a level
export const isSubjectInLevel = (subject: string, level: CALevel): boolean => {
  return (SUBJECTS_BY_LEVEL[level] as readonly string[]).includes(subject);
};
