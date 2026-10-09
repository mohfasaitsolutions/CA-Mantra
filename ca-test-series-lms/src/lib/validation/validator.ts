import { z } from "zod";
import { ValidationError as ValidationErrorType, ValidationResult, extractValidationErrors } from "./schemas";

/**
 * Centralized validation utility class
 * Provides consistent validation across the application
 */
export class Validator {
  /**
   * Validates data against a Zod schema
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
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
  }

  /**
   * Validates data against a schema and throws an error if validation fails
   */
  static validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = this.validate(schema, data);
    if (!result.success) {
      throw new ValidationException(
        result.errors?.[0]?.message || "Validation failed",
        result.errors || []
      );
    }
    return result.data!;
  }

  /**
   * Validates multiple fields individually and returns all errors
   */
  static validateFields(validations: Array<{ field: string; schema: z.ZodSchema; value: unknown }>): ValidationErrorType[] {
    const errors: ValidationErrorType[] = [];

    validations.forEach(({ field, schema, value }) => {
      try {
        schema.parse(value);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            errors.push({
              field,
              message: err.message,
            });
          });
        }
      }
    });

    return errors;
  }

  /**
   * Checks if a value is valid according to a schema without throwing
   */
  static isValid<T>(schema: z.ZodSchema<T>, data: unknown): boolean {
    try {
      schema.parse(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the first validation error message for a field
   */
  static getFieldError<T>(schema: z.ZodSchema<T>, data: unknown): string | null {
    try {
      schema.parse(data);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || null;
      }
      return "Invalid value";
    }
  }

  /**
   * Sanitizes and validates string input
   */
  static sanitizeString(value: string, options?: { trim?: boolean; toLowerCase?: boolean }): string {
    let sanitized = value;
    
    if (options?.trim !== false) {
      sanitized = sanitized.trim();
    }
    
    if (options?.toLowerCase) {
      sanitized = sanitized.toLowerCase();
    }
    
    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    return sanitized;
  }

  /**
   * Validates and normalizes email
   */
  static normalizeEmail(email: string): string {
    return this.sanitizeString(email, { trim: true, toLowerCase: true });
  }

  /**
   * Validates and normalizes phone number
   */
  static normalizePhone(phone: string): string {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // If it starts with country code +91, remove it
    if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
      return digitsOnly.slice(2);
    }
    
    return digitsOnly;
  }

  /**
   * Batch validation for form data
   */
  static validateForm<T extends Record<string, unknown>>(
    schema: z.ZodSchema<T>,
    formData: T
  ): { isValid: boolean; errors: Record<string, string>; data?: T } {
    try {
      const validatedData = schema.parse(formData);
      return {
        isValid: true,
        errors: {},
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        
        error.errors.forEach((err) => {
          const fieldPath = err.path.join('.');
          if (!fieldErrors[fieldPath]) {
            fieldErrors[fieldPath] = err.message;
          }
        });

        return {
          isValid: false,
          errors: fieldErrors,
        };
      }
      return {
        isValid: false,
        errors: { general: "Validation failed" },
      };
    }
  }

  /**
   * Real-time field validation for forms
   */
  static validateFieldRealtime<T>(
    schema: z.ZodSchema<T>,
    value: unknown,
    options?: { debounceMs?: number }
  ): Promise<{ isValid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const validateFn = () => {
        try {
          schema.parse(value);
          resolve({ isValid: true });
        } catch (error) {
          if (error instanceof z.ZodError) {
            resolve({
              isValid: false,
              error: error.errors[0]?.message || "Invalid value",
            });
          } else {
            resolve({ isValid: false, error: "Validation failed" });
          }
        }
      };

      if (options?.debounceMs) {
        setTimeout(validateFn, options.debounceMs);
      } else {
        validateFn();
      }
    });
  }
}

/**
 * Custom validation error class
 */
export class ValidationException extends Error {
  constructor(
    message: string,
    public readonly validationErrors: ValidationErrorType[] = []
  ) {
    super(message);
    this.name = "ValidationException";
  }

  /**
   * Gets all error messages
   */
  getAllMessages(): string[] {
    return this.validationErrors.map(error => error.message);
  }

  /**
   * Gets errors for a specific field
   */
  getFieldErrors(field: string): string[] {
    return this.validationErrors
      .filter(error => error.field === field)
      .map(error => error.message);
  }

  /**
   * Checks if a field has errors
   */
  hasFieldError(field: string): boolean {
    return this.validationErrors.some(error => error.field === field);
  }
}

/**
 * Utility functions for common validation patterns
 */
export const ValidationUtils = {
  /**
   * Checks if password meets strength requirements
   */
  getPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("Use at least 8 characters");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Add lowercase letters");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Add uppercase letters");
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push("Add numbers");
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Add special characters (!@#$%^&*)");
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      feedback.push("Avoid repeated characters");
      score = Math.max(0, score - 1);
    }

    if (/123|abc|password/i.test(password)) {
      feedback.push("Avoid common patterns");
      score = Math.max(0, score - 1);
    }

    return {
      score,
      feedback,
      isStrong: score >= 4 && feedback.length <= 1,
    };
  },

  /**
   * Formats validation errors for display
   */
  formatErrorsForDisplay(errors: ValidationErrorType[]): string {
    if (errors.length === 0) return "";
    if (errors.length === 1) return errors[0].message;
    
    return errors.map((error, index) => 
      `${index + 1}. ${error.message}`
    ).join("\n");
  },

  /**
   * Checks if email domain is commonly used
   */
  isCommonEmailDomain(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    const commonDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'rediffmail.com', 'yahoo.in', 'gmail.in'
    ];
    return commonDomains.includes(domain);
  },

  /**
   * Validates Indian mobile number format
   */
  isValidIndianMobile(mobile: string): boolean {
    const normalized = Validator.normalizePhone(mobile);
    return /^[6-9]\d{9}$/.test(normalized);
  },

  /**
   * Checks if name contains only valid characters
   */
  isValidName(name: string): boolean {
    return /^[a-zA-Z\s'-]+$/.test(name) && name.trim().length >= 2;
  },
};