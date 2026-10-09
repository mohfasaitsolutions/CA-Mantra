export interface FileUploadConfig {
  acceptedTypes: string[];
  maxSizeInMB: number;
  maxSizeInBytes: number;
  description: string;
  multiple?: boolean;
}

export const UPLOAD_CONFIGS = {
  PROFILE_PICTURE: {
    acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxSizeInMB: 5,
    maxSizeInBytes: 5 * 1024 * 1024, // 5MB before compression to 400KB
    description: 'Profile pictures (JPEG, PNG, GIF, WebP) - Max 5MB, will be compressed to 400KB',
    multiple: false,
  },
  PDF_DOCUMENT: {
    acceptedTypes: ['application/pdf'],
    maxSizeInMB: 20,
    maxSizeInBytes: 20 * 1024 * 1024, // 20MB
    description: 'PDF documents only - Max 20MB',
    multiple: false,
  },
  ANSWER_SHEET: {
    acceptedTypes: ['application/pdf'],
    maxSizeInMB: 20,
    maxSizeInBytes: 20 * 1024 * 1024, // 20MB
    description: 'Answer sheet PDF only - Max 20MB',
    multiple: false,
  },
  TEST_SERIES_THUMBNAIL: {
    acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxSizeInMB: 5,
    maxSizeInBytes: 5 * 1024 * 1024, // 5MB
    description: 'Thumbnail images (JPEG, PNG, GIF, WebP) - Max 5MB',
    multiple: false,
  },
  QUESTION_PAPERS: {
    acceptedTypes: ['application/pdf'],
    maxSizeInMB: 20,
    maxSizeInBytes: 20 * 1024 * 1024, // 20MB
    description: 'Question paper and suggested answer PDFs - Max 20MB each',
    multiple: true,
  },
  STUDY_MATERIAL: {
    acceptedTypes: ['application/pdf'],
    maxSizeInMB: 20,
    maxSizeInBytes: 20 * 1024 * 1024, // 20MB
    description: 'Study material PDF only - Max 20MB',
    multiple: false,
  },
  SCHEDULE: {
    acceptedTypes: ['application/pdf'],
    maxSizeInMB: 20,
    maxSizeInBytes: 20 * 1024 * 1024, // 20MB
    description: 'Schedule PDF only - Max 20MB',
    multiple: false,
  },
  EVALUATED_ANSWER: {
    acceptedTypes: ['application/pdf'],
    maxSizeInMB: 20,
    maxSizeInBytes: 20 * 1024 * 1024, // 20MB
    description: 'Evaluated answer sheet PDF only - Max 20MB',
    multiple: false,
  },
};

export type UploadConfigKey = keyof typeof UPLOAD_CONFIGS;
