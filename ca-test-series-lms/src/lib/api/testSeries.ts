import apiClient from './client';

export interface CreateTestSeriesData {
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountedPrice?: number;
  caLevel: 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL' | 'ALL';
  planId?: string;
  thumbnail?: File;
  // Access policy
  validityType?: 'UNLIMITED' | 'DAYS';
  validityDays?: number; // when validityType === 'DAYS'
  validityDate?: Date; // Used in UI, sent as fixed expiry date
  attemptsType?: 'UNLIMITED' | 'LIMITED';
  attemptsCount?: number; // when attemptsType === 'LIMITED'
}

export interface UpdateTestSeriesData {
  title?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  discountedPrice?: number;
  isActive?: boolean;
  validityType?: 'UNLIMITED' | 'DAYS';
  validityDays?: number;
  validityDate?: Date; // Used in UI, sent as fixed expiry date
  attemptsType?: 'UNLIMITED' | 'LIMITED';
  attemptsCount?: number;
  thumbnail?: File;
}

export interface CreateTestData {
  title: string;
  testType: 'OBJECTIVE' | 'SUBJECTIVE' | 'MIXED';
  subject: string;
  duration: number;
  instructions?: string;
  passingPercentage?: number;
  totalMarks?: number; // For subjective tests
  objectiveMarks?: number; // For mixed tests
  subjectiveMarks?: number; // For mixed tests
  allowedEvaluatorIds?: string[];
}

export interface MCQQuestionData {
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  marks: number;
  negativeMarks?: number;
}

export interface AddMCQQuestionsData {
  mcqQuestions: MCQQuestionData[];
}

export interface TestItemResponse {
  id: string;
  title: string;
  testType: 'OBJECTIVE' | 'SUBJECTIVE' | 'MIXED' | string;
  subject: string;
  duration?: number;
  instructions?: string;
  passingPercentage?: number;
  totalMarks?: number;
  objectiveMarks?: number;
  subjectiveMarks?: number;
  questionPaperUrl?: string;
  allowedEvaluatorIds?: string[];
  // suggestedAnswerUrl is intentionally omitted in public API
  totalQuestions?: number;
}

export interface TestSeries {
  id: number;
  title: string;
  description?: string;
  price: number;
  caLevel: 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL' | 'ALL';
  status?: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string | null;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestSeriesResponse {
  id: string | number;
  _id?: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountedPrice?: number;
  caLevel: 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL' | 'ALL';
  status?: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string | null;
  planId?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  validity?: {
    isUnlimited: boolean;
    days?: number;
    expiryDate?: string;
  };
  attempts?: {
    isUnlimited: boolean;
    count?: number;
  };
  tests?: TestItemResponse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TestResponse {
  id: string;
  title: string;
  testType: string;
  subject: string;
  duration: number;
  instructions?: string;
  passingPercentage?: number;
  allowedEvaluatorIds?: string[];
  testSeriesId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetTestSeriesParams {
  page?: number;
  limit?: number;
  caLevel?: 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL' | 'ALL';
  planId?: string;
  search?: string;
  isActive?: boolean;
}

// Test Series API functions
export const testSeriesApi = {
  // Create a new test series
  create: async (data: CreateTestSeriesData): Promise<{ testSeries: TestSeriesResponse }> => {
    const formData = new FormData();

    console.log('API: Creating test series with data:', data);

    // Ensure we send the title (required field)
    formData.append('title', data.title.trim());

    // Only append description if it exists and is not empty
    if (data.description && data.description.trim()) {
      formData.append('description', data.description.trim());
    }

    // Convert price to number and append as string
    const priceNumber = Number(data.price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      throw new Error('Price must be a positive number');
    }
    formData.append('price', priceNumber.toString());
    if (data.originalPrice !== undefined) formData.append('originalPrice', Number(data.originalPrice).toString());
    if (data.discountedPrice !== undefined) formData.append('discountedPrice', Number(data.discountedPrice).toString());

    // Ensure caLevel is valid
    if (!['FOUNDATION', 'INTERMEDIATE', 'FINAL', 'ALL'].includes(data.caLevel)) {
      throw new Error('CA Level must be FOUNDATION, INTERMEDIATE, FINAL, or ALL');
    }
    formData.append('caLevel', data.caLevel);

    // Only append thumbnail if it exists
    if (data.thumbnail) {
      formData.append('thumbnail', data.thumbnail);
    }

    // Validity & Attempts
    if (data.validityType) formData.append('validityType', data.validityType);
    if (data.validityType === 'DAYS' && data.validityDate) {
      formData.append('validityExpiryDate', new Date(data.validityDate).toISOString());
    }
    if (data.attemptsType) formData.append('attemptsType', data.attemptsType);
    if (data.attemptsType === 'LIMITED' && typeof data.attemptsCount === 'number') {
      formData.append('attemptsCount', String(data.attemptsCount));
    }

    // Log what we're actually sending
    console.log('FormData contents:');
    for (const [key, value] of formData.entries()) {
      console.log(key, ':', value instanceof File ? `File: ${value.name}` : value);
    }

    // Let Axios/the browser add the multipart boundary. Setting this header
    // manually can produce a request the server cannot parse.
    const response = await apiClient.post('/test-series', formData);
    return response.data;
  },

  // Get all test series with optional filters
  getAll: async (params: GetTestSeriesParams = {}, includeDrafts = false) => {
    const endpoint = includeDrafts ? '/test-series/admin/all' : '/test-series';
    const response = await apiClient.get(endpoint, { params });
    return response.data as { testSeries: TestSeriesResponse[]; pagination: { current: number; pages: number; total: number } };
  },

  // Get a specific test series by ID
  getById: async (id: string, includeDrafts = false): Promise<{ testSeries: TestSeriesResponse }> => {
    const endpoint = includeDrafts ? `/test-series/admin/${id}` : `/test-series/${id}`;
    const response = await apiClient.get(endpoint);
    return response.data as { testSeries: TestSeriesResponse };
  },

  publish: async (id: string): Promise<{ testSeries: Pick<TestSeriesResponse, 'id' | 'title' | 'status' | 'publishedAt'> }> => {
    const response = await apiClient.patch(`/test-series/${id}/publish`);
    return response.data;
  },

  // Update a test series
  update: async (id: string, data: UpdateTestSeriesData): Promise<{ testSeries: TestSeriesResponse }> => {
    // If there's a thumbnail file, send as FormData, otherwise send as JSON
    if (data.thumbnail) {
      const formData = new FormData();

      if (data.title) formData.append('title', data.title);
      if (data.description !== undefined) formData.append('description', data.description);
      if (data.price !== undefined) formData.append('price', data.price.toString());
      if (data.originalPrice !== undefined) formData.append('originalPrice', data.originalPrice.toString());
      if (data.discountedPrice !== undefined) formData.append('discountedPrice', data.discountedPrice.toString());
      if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());
      if (data.validityType) formData.append('validityType', data.validityType);
      if (data.validityType === 'DAYS' && data.validityDate) {
        formData.append('validityExpiryDate', new Date(data.validityDate).toISOString());
      }
      if (data.attemptsType) formData.append('attemptsType', data.attemptsType);
      if (data.attemptsCount !== undefined) formData.append('attemptsCount', data.attemptsCount.toString());
      formData.append('thumbnail', data.thumbnail);

      const response = await apiClient.put(`/test-series/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Send as regular JSON if no file
      const jsonData: Record<string, any> = { ...data };
      delete jsonData.validityDate;
      if (data.validityType === 'DAYS' && data.validityDate) {
        jsonData.validityExpiryDate = new Date(data.validityDate).toISOString();
      }
      const response = await apiClient.put(`/test-series/${id}`, jsonData);
      return response.data;
    }
  },

  // Delete a test series
  delete: async (id: string): Promise<void> => {
    console.log('API: Attempting to delete test series with ID:', id);

    if (!id || id === 'undefined' || id === undefined) {
      console.error('API: Invalid ID provided for deletion:', id);
      throw new Error('Invalid test series ID provided');
    }

    console.log('API: Making DELETE request to:', `/test-series/${id}`);
    await apiClient.delete(`/test-series/${id}`);
  },
};

// Test Management API functions
export const testApi = {
  // Add a test to a test series
  create: async (testSeriesId: string, data: CreateTestData): Promise<{ test: TestResponse }> => {
    const response = await apiClient.post(`/test-series/${testSeriesId}/tests`, data);
    return response.data;
  },

  // Update an existing test in a test series
  update: async (testSeriesId: string, testId: string, data: Partial<CreateTestData>): Promise<{ test: TestResponse }> => {
    const response = await apiClient.put(`/test-series/${testSeriesId}/tests/${testId}`, data);
    return response.data;
  },

  // Add MCQ questions to an objective test
  addMCQQuestions: async (
    testSeriesId: string,
    testId: string,
    data: AddMCQQuestionsData
  ): Promise<{ message: string; questionsAdded: number }> => {
    const response = await apiClient.post(`/test-series/${testSeriesId}/tests/${testId}/mcq`, data);
    return response.data;
  },

  // Upload PDFs for subjective tests
  uploadPDFs: async (
    testSeriesId: string,
    testId: string,
    files: {
      questionPaper: File;
      suggestedAnswer?: File;
    }
  ): Promise<{ message: string; files: { questionPaper?: string; suggestedAnswer?: string } }> => {
    const formData = new FormData();
    formData.append('questionPaper', files.questionPaper);
    if (files.suggestedAnswer) {
      formData.append('suggestedAnswer', files.suggestedAnswer);
    }

    try {
      const response = await apiClient.post(`/test-series/${testSeriesId}/tests/${testId}/pdfs`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      // Handle 413 Payload Too Large specifically
      if (error.response?.status === 413) {
        throw new Error('File size too large. Please reduce the PDF file size to under 20MB and try again.');
      }
      // Re-throw other errors
      throw error;
    }
  },
};
