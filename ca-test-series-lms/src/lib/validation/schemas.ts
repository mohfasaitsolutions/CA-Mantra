import { z } from "zod";

// Common validation patterns
const PHONE_REGEX = /^[0-9]{10}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/;

// Base validation schemas
export const ValidationSchemas = {
  // Basic fields
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),

  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password must be less than 128 characters" }),

  strongPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password must be less than 128 characters" })
    .regex(STRONG_PASSWORD_REGEX, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),

  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Name can only contain letters, spaces, hyphens, and apostrophes" }),

  mobile: z
    .string()
    .regex(PHONE_REGEX, { message: "Please enter a valid 10-digit mobile number" }),

  otp: z
    .string()
    .regex(/^\d{6}$/, { message: "OTP must be exactly 6 digits" }),

  // CA specific fields
  caLevel: z.enum(["foundation", "intermediate", "final"], {
    required_error: "Please select your CA level",
    invalid_type_error: "Invalid CA level selected",
  }),

  // Common text fields
  message: z
    .string()
    .trim()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(1000, { message: "Message must be less than 1000 characters" }),

  subject: z
    .string()
    .trim()
    .min(5, { message: "Subject must be at least 5 characters" })
    .max(200, { message: "Subject must be less than 200 characters" }),

  // File validation
  imageFile: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Image must be less than 5MB",
    })
    .refine(
      (file) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type),
      { message: "Only JPEG, PNG, and WebP images are allowed" }
    ),

  pdfFile: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: "PDF must be less than 10MB",
    })
    .refine((file) => file.type === "application/pdf", {
      message: "Only PDF files are allowed",
    }),

  // Optional variants
  optionalEmail: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .optional()
    .or(z.literal("")),

  optionalMobile: z
    .string()
    .regex(PHONE_REGEX, { message: "Please enter a valid 10-digit mobile number" })
    .optional()
    .or(z.literal("")),
};

// Composite schemas for common forms
export const FormSchemas = {
  // Authentication forms
  login: z.object({
    email: ValidationSchemas.email,
    password: ValidationSchemas.password,
  }),

  register: z
    .object({
      name: ValidationSchemas.name,
      email: ValidationSchemas.email,
      mobile: ValidationSchemas.mobile,
      caLevel: ValidationSchemas.caLevel,
      password: ValidationSchemas.strongPassword,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }),

  forgotPassword: z.object({
    email: ValidationSchemas.email,
  }),

  resetPassword: z
    .object({
      token: z.string().min(10, { message: "Invalid or missing token" }),
      password: ValidationSchemas.strongPassword,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }),

  changePassword: z
    .object({
      currentPassword: ValidationSchemas.password,
      newPassword: ValidationSchemas.strongPassword,
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "New passwords don't match",
      path: ["confirmPassword"],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: "New password must be different from current password",
      path: ["newPassword"],
    }),

  // Profile forms
  profileSetup: z.object({
    name: ValidationSchemas.name,
    mobile: ValidationSchemas.mobile,
    state: z.string().min(1, { message: "Please select your state" }),
    city: z.string().min(1, { message: "Please select your city" }),
  }),

  // Contact form
  contact: z.object({
    fullName: ValidationSchemas.name,
    email: ValidationSchemas.email,
    mobile: ValidationSchemas.mobile,
    subject: ValidationSchemas.subject,
    message: ValidationSchemas.message,
  }),

  // Admin forms
  createUser: z.object({
    fullName: ValidationSchemas.name,
    email: ValidationSchemas.email,
    role: z.enum(["admin", "evaluator", "student"], {
      required_error: "Please select a role",
    }),
    caLevel: ValidationSchemas.caLevel,
    specializations: z.array(z.string()).optional(),
  }),

  // Test series forms
  testSeriesCreate: z.object({
    title: z
      .string()
      .trim()
      .min(5, { message: "Title must be at least 5 characters" })
      .max(200, { message: "Title must be less than 200 characters" }),
    description: z
      .string()
      .trim()
      .min(10, { message: "Description must be at least 10 characters" })
      .max(500, { message: "Description must be less than 500 characters" }),
    price: z
      .number()
      .min(0, { message: "Price must be a positive number" })
      .max(99999, { message: "Price must be less than ₹99,999" }),
    duration: z
      .number()
      .min(15, { message: "Duration must be at least 15 minutes" })
      .max(480, { message: "Duration cannot exceed 8 hours" }),
    questionsCount: z
      .number()
      .min(1, { message: "At least 1 question is required" })
      .max(200, { message: "Cannot have more than 200 questions" }),
    caLevel: ValidationSchemas.caLevel,
    subject: z.string().min(1, { message: "Please select a subject" }),
  }),

  // MCQ creation form
  mcqCreate: z.object({
    question: z
      .string()
      .trim()
      .min(10, { message: "Question must be at least 10 characters" })
      .max(1000, { message: "Question must be less than 1000 characters" }),
    options: z
      .array(
        z
          .string()
          .trim()
          .min(1, { message: "Option cannot be empty" })
          .max(500, { message: "Option must be less than 500 characters" })
      )
      .length(4, { message: "Exactly 4 options are required" }),
    correctAnswer: z
      .number()
      .min(0, { message: "Please select the correct answer" })
      .max(3, { message: "Invalid correct answer index" }),
    explanation: z
      .string()
      .trim()
      .min(10, { message: "Explanation must be at least 10 characters" })
      .max(1000, { message: "Explanation must be less than 1000 characters" })
      .optional(),
    marks: z
      .number()
      .min(0.5, { message: "Marks must be at least 0.5" })
      .max(10, { message: "Marks cannot exceed 10" }),
    difficulty: z.enum(["easy", "medium", "hard"], {
      required_error: "Please select difficulty level",
    }),
  }),
};

// Validation error types
export type ValidationError = {
  field: string;
  message: string;
};

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
};

// Helper function to extract validation errors from Zod
export const extractValidationErrors = (error: z.ZodError): ValidationError[] => {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
};

// Utility to validate data against any schema
export const validateData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> => {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: extractValidationErrors(error),
      };
    }
    return {
      success: false,
      errors: [{ field: "general", message: "Validation failed" }],
    };
  }
};
