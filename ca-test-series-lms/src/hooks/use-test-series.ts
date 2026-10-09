import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import {
  testSeriesApi,
  testApi,
  CreateTestSeriesData,
  CreateTestData,
  MCQQuestionData,
  TestSeriesResponse
} from '@/lib/api/testSeries';

// Shared helper types/utilities for normalizing backend ids
type WithMaybeId = { id?: string; _id?: string } & Record<string, unknown>;
const normalizeId = <T extends WithMaybeId>(obj: T): T & { id: string } => {
  const id = (obj.id ?? obj._id) as string;
  return { ...(obj as object), id } as T & { id: string };
};

export interface MCQQuestion {
  id?: string;
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

export interface Test {
  id?: string;
  title: string;
  type: 'OBJECTIVE' | 'SUBJECTIVE';
  subject: string;
  duration: number;
  instructions?: string;
  passingPercentage?: number;
  totalMarks?: number;
  allowedEvaluatorIds?: string[];
  mcqQuestions: MCQQuestion[];
  subjectiveQuestionPaper?: File;
  suggestedAnswer?: File;
}

export interface TestSeries {
  title: string;
  description?: string;
  price: string;
  originalPrice?: string;
  discountedPrice?: string;
  caLevel: 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL' | 'ALL';
  planId?: string;
  thumbnail?: File;
  validityType?: 'UNLIMITED' | 'DATE'; // UI uses DATE, backend uses DAYS
  validityDate?: Date; // UI date picker, converted to days for backend
  attemptsType?: 'UNLIMITED' | 'LIMITED';
  attemptsCount?: number;
  tests: Test[];
}

export const useTestSeriesManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createTestSeries = async (testSeriesData: TestSeries): Promise<string | null> => {
    setIsLoading(true);
    let createdTestSeriesId: string | null = null;

    try {
      // Validate and convert price
      const priceNumber = Number(testSeriesData.price);
      if (isNaN(priceNumber) || priceNumber <= 0) {
        toast({
          title: "Error",
          description: "Price must be a positive number.",
          variant: "destructive",
        });
        return null;
      }

      // Validate title
      if (!testSeriesData.title.trim()) {
        toast({
          title: "Error",
          description: "Title is required and cannot be empty.",
          variant: "destructive",
        });
        return null;
      }

      if (testSeriesData.title.trim().length > 200) {
        toast({
          title: "Error",
          description: "Title must be 200 characters or less.",
          variant: "destructive",
        });
        return null;
      }

      // Validate CA Level
      if (!['FOUNDATION', 'INTERMEDIATE', 'FINAL', 'ALL'].includes(testSeriesData.caLevel)) {
        toast({
          title: "Error",
          description: "CA Level must be FOUNDATION, INTERMEDIATE, FINAL, or ALL.",
          variant: "destructive",
        });
        return null;
      }

      const originalPriceNumber = Number(testSeriesData.originalPrice || testSeriesData.price);
      const discountedPriceNumber = Number(testSeriesData.discountedPrice || testSeriesData.price);

      if (isNaN(originalPriceNumber) || originalPriceNumber <= 0) {
        toast({
          title: "Error",
          description: "Original price must be a positive number.",
          variant: "destructive",
        });
        return null;
      }

      if (isNaN(discountedPriceNumber) || discountedPriceNumber <= 0 || discountedPriceNumber > originalPriceNumber) {
        toast({
          title: "Error",
          description: "Discounted price must be positive and not greater than original price.",
          variant: "destructive",
        });
        return null;
      }

      // First, create the test series
      const createData: CreateTestSeriesData = {
        title: testSeriesData.title.trim(),
        description: testSeriesData.description?.trim() || '',
        price: discountedPriceNumber,
        originalPrice: originalPriceNumber,
        discountedPrice: discountedPriceNumber,
        caLevel: testSeriesData.caLevel,
        planId: testSeriesData.planId,
        thumbnail: testSeriesData.thumbnail,
        validityType: testSeriesData.validityType === 'DATE' ? 'DAYS' : testSeriesData.validityType,
        validityDate: testSeriesData.validityDate, // Will be converted to days in API layer
        attemptsType: testSeriesData.attemptsType,
        attemptsCount: testSeriesData.attemptsCount,
      };

      console.log('Creating test series with data:', createData);

      const { testSeries } = await testSeriesApi.create(createData);
      const normalized = normalizeId(testSeries as unknown as { id?: string; _id?: string });
      const testSeriesId = normalized.id;
      createdTestSeriesId = testSeriesId;

      // Then, create each test in the series
      for (const test of testSeriesData.tests) {
        console.log('Creating test:', test.title, 'for test series:', testSeriesId);

        const testData: CreateTestData = {
          title: test.title.trim(), // Trim whitespace to avoid issues
          testType: test.type,
          subject: test.subject,
          duration: test.duration,
          instructions: test.instructions,
          passingPercentage: test.passingPercentage,
          totalMarks: test.type === 'SUBJECTIVE' ? test.totalMarks : undefined,
          allowedEvaluatorIds: test.type === 'SUBJECTIVE' ? test.allowedEvaluatorIds : undefined,
        };

        let createdTest;
        try {
          const response = await testApi.create(testSeriesId, testData);
          createdTest = response.test;
          console.log('Successfully created test:', createdTest.id, createdTest.title);
        } catch (error) {
          console.error('Failed to create test:', test.title, error);
          throw error; // Re-throw to maintain error handling flow
        }

        // Handle objective tests - add MCQ questions
        if (test.type === 'OBJECTIVE' && test.mcqQuestions.length > 0) {
          const mcqData: MCQQuestionData[] = test.mcqQuestions.map(q => ({
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
          }));

          await testApi.addMCQQuestions(testSeriesId, createdTest.id, {
            mcqQuestions: mcqData,
          });
        }

        // Handle subjective tests - upload PDFs
        if (test.type === 'SUBJECTIVE' && test.subjectiveQuestionPaper) {
          const files: { questionPaper: File; suggestedAnswer?: File } = {
            questionPaper: test.subjectiveQuestionPaper,
          };

          if (test.suggestedAnswer) {
            files.suggestedAnswer = test.suggestedAnswer;
          }

          try {
            await testApi.uploadPDFs(testSeriesId, createdTest.id, files);
          } catch (uploadError: any) {
            // Show specific error for file size issues
            const errorMessage = uploadError.message || 'Failed to upload PDF files';
            toast({
              title: "PDF Upload Error",
              description: errorMessage,
              variant: "destructive",
            });
            throw uploadError;
          }
        }
      }

      toast({
        title: "Draft saved",
        description: "Test series saved as a draft. Publish it when everything is ready.",
      });

      return testSeriesId;
    } catch (error: unknown) {
      console.error('Error creating test series:', error);

      // Creation is a multi-step workflow: the parent series is created first,
      // followed by tests, questions, and PDFs. Remove an incomplete parent so
      // a retry cannot leave duplicate or partially configured series behind.
      let rollbackSucceeded = true;
      if (createdTestSeriesId) {
        try {
          await testSeriesApi.delete(createdTestSeriesId);
          console.info('Removed incomplete test series after save failure:', createdTestSeriesId);
        } catch (rollbackError) {
          rollbackSucceeded = false;
          console.error('Failed to remove incomplete test series:', rollbackError);
        }
      }

      const errorMessage = (error as any)?.response?.data?.error || (error as any)?.response?.data?.message || (error as { message?: string })?.message || 'Failed to create test series';
      const saveStatus = createdTestSeriesId
        ? rollbackSucceeded
          ? 'The incomplete series was removed. Your form data is still here; please retry.'
          : 'The series may be partially saved. Please do not retry with the same title until it is checked by an administrator.'
        : 'Your form data is still here; please retry.';

      toast({
        title: "Test series was not saved",
        description: `${errorMessage} ${saveStatus}`,
        variant: "destructive",
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTestSeries = async (id: string, data: Partial<CreateTestSeriesData> & { isActive?: boolean }) => {
    setIsLoading(true);
    try {
      await testSeriesApi.update(id, data);

      toast({
        title: "Success",
        description: "Test series updated successfully!",
      });

      return true;
    } catch (error: unknown) {
      console.error('Error updating test series:', error);

      const errorMessage = (error as any)?.response?.data?.error || (error as any)?.response?.data?.message || (error as { message?: string })?.message || 'Failed to update test series';

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTestSeries = async (id: string) => {
    console.log('Hook: Attempting to delete test series with ID:', id);

    if (!id || id === 'undefined' || id === undefined) {
      console.error('Hook: Invalid ID provided for deletion:', id);
      toast({
        title: "Error",
        description: "Invalid test series ID provided.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    try {
      console.log('Hook: Calling API to delete test series:', id);
      await testSeriesApi.delete(id);

      toast({
        title: "Success",
        description: "Test series deleted successfully!",
      });

      return true;
    } catch (error: unknown) {
      console.error('Error deleting test series:', error);

      const errorMessage = (error as any)?.response?.data?.error || (error as any)?.response?.data?.message || (error as { message?: string })?.message || 'Failed to delete test series';

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const publishTestSeries = async (id: string) => {
    setIsLoading(true);
    try {
      await testSeriesApi.publish(id);

      toast({
        title: "Published",
        description: "Test series is now visible to students.",
      });

      return true;
    } catch (error: unknown) {
      console.error('Error publishing test series:', error);

      const errorMessage = (error as any)?.response?.data?.message ||
        (error as any)?.response?.data?.error ||
        (error as { message?: string })?.message ||
        'Failed to publish test series';

      toast({
        title: "Cannot publish yet",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createTestSeries,
    updateTestSeries,
    deleteTestSeries,
    publishTestSeries,
    isLoading,
  };
};

export const useTestSeries = () => {
  const [testSeries, setTestSeries] = useState<TestSeriesResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const { toast } = useToast();

  const fetchTestSeries = useCallback(async (params?: {
    page?: number;
    limit?: number;
    caLevel?: 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL' | 'ALL';
    planId?: string;
    search?: string;
    isActive?: boolean;
  }, includeDrafts = false) => {
    setIsLoading(true);
    try {
      const response = await testSeriesApi.getAll(params, includeDrafts);
      // Normalize ids (_id -> id) to be safe across backend shapes
      const normalized = response.testSeries.map((ts) => {
        const withId = ts as unknown as WithMaybeId;
        const id = (withId.id ?? withId._id) as string;
        return { ...(ts as object), id } as TestSeriesResponse;
      });
      setTestSeries(normalized);
      // Map backend pagination to local shape
      setPagination({
        page: response.pagination.current,
        limit: params?.limit ?? 10,
        total: response.pagination.total,
        totalPages: response.pagination.pages,
      });
    } catch (error: unknown) {
      console.error('Error fetching test series:', error);

      const errorMessage = (error as any)?.response?.data?.error || (error as any)?.response?.data?.message || (error as { message?: string })?.message || 'Failed to fetch test series';

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchTestSeriesById = useCallback(async (id: string, includeDrafts = false): Promise<TestSeriesResponse | null> => {
    setIsLoading(true);
    try {
      const response = await testSeriesApi.getById(id, includeDrafts);
      const ts = response.testSeries as unknown as WithMaybeId;
      const normalized: TestSeriesResponse = {
        ...(ts as object),
        id: (ts.id ?? ts._id) as string,
      } as TestSeriesResponse;
      return normalized;
    } catch (error: unknown) {
      console.error('Error fetching test series:', error);

      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to fetch test series';

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    testSeries,
    pagination,
    isLoading,
    fetchTestSeries,
    fetchTestSeriesById,
  };
};
