import { z } from 'zod';

// User types
export const UserRoleEnum = z.enum(['student', 'admin', 'evaluator']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: UserRoleEnum,
  profileImage: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;

// Auth types
export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginFormValues = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
export type RegisterFormValues = z.infer<typeof RegisterSchema>;

// Student types
export const CALevelEnum = z.enum(['Foundation', 'Intermediate', 'Final']);
export type CALevel = z.infer<typeof CALevelEnum>;

export const StudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  caLevel: CALevelEnum,
  registrationDate: z.string(),
  testsCompleted: z.number(),
  averageScore: z.number(),
  status: z.enum(['active', 'inactive']),
  phone: z.string(),
  location: z.string(),
  testsPurchased: z.number(),
});
export type Student = z.infer<typeof StudentSchema>;

export const ProfileSetupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  city: z.string().min(2, 'Please select a city'),
  state: z.string().min(2, 'Please select a state'),
  country: z.string().min(2, 'Please select a country'),
  caLevel: z.string().min(1, 'Please select your CA level'),
});
export type ProfileSetupFormValues = z.infer<typeof ProfileSetupSchema>;

// Test types
export const TestTypeEnum = z.enum(['objective', 'subjective', 'mixed']);
export type TestType = z.infer<typeof TestTypeEnum>;

export const TestSectionSchema = z.object({
  name: z.string(),
  questions: z.number(),
  marks: z.number(),
});
export type TestSection = z.infer<typeof TestSectionSchema>;

export const TestSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnail: z.string(),
  price: z.number(),
  level: z.string(),
  isPurchased: z.boolean(),
  attemptsUsed: z.number(),
  attemptsTotal: z.number(),
  evaluationStatus: z.enum(['evaluated', 'pending', 'not-attempted']),
  sections: z.array(TestSectionSchema),
  duration: z.string(),
  totalMarks: z.number(),
  type: TestTypeEnum,
  subject: z.string(),
});
export type Test = z.infer<typeof TestSchema>;

export const TestSeriesSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnail: z.string(),
  price: z.number(),
  level: z.string(),
  isPurchased: z.boolean(),
  tests: z.array(TestSchema),
});
export type TestSeries = z.infer<typeof TestSeriesSchema>;

// Evaluator types
export const EvaluatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  specialization: z.array(z.string()),
  assignedTests: z.number(),
  completedTests: z.number(),
  pendingTests: z.number(),
  avgCompletionTime: z.number().optional(),
  profileImage: z.string().nullable().optional(),
  joinDate: z.string(),
  status: z.enum(['active', 'inactive']),
});
export type Evaluator = z.infer<typeof EvaluatorSchema>;

export const EvaluationSchema = z.object({
  id: z.number(),
  studentName: z.string(),
  testName: z.string(),
  testSeries: z.string(),
  subject: z.string(),
  submissionDate: z.string(),
  isLocked: z.boolean(),
  lockedBy: z.string().nullable(),
  maxMarks: z.number(),
  answerPdfUrl: z.string().optional(),
  questionPaperUrl: z.string().optional(),
  expectedAnswersheetUrl: z.string().optional(),
  score: z.number().optional(),
  feedback: z.string().optional(),
  status: z.enum(['pending', 'completed']),
});
export type Evaluation = z.infer<typeof EvaluationSchema>;

// Support ticket types
export const SupportTicketCategoryEnum = z.enum(['technical', 'billing', 'account', 'content', 'other']);
export type SupportTicketCategory = z.infer<typeof SupportTicketCategoryEnum>;

export const SupportTicketStatusEnum = z.enum(['open', 'in-progress', 'closed']);
export type SupportTicketStatus = z.infer<typeof SupportTicketStatusEnum>;

export const SupportTicketSchema = z.object({
  id: z.string(),
  studentName: z.string(),
  studentEmail: z.string().email(),
  subject: z.string(),
  message: z.string(),
  category: SupportTicketCategoryEnum,
  status: SupportTicketStatusEnum,
  submissionDate: z.string(),
  screenshot: z.string().nullable().optional(),
});
export type SupportTicket = z.infer<typeof SupportTicketSchema>;

export const ContactFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  subject: z.string().min(5, {
    message: 'Subject must be at least 5 characters.',
  }),
  message: z.string().min(10, {
    message: 'Message must be at least 10 characters.',
  }),
});
export type ContactFormValues = z.infer<typeof ContactFormSchema>;