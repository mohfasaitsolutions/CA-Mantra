import { useState, useCallback, useEffect } from "react";
import { useForm, FieldValues, UseFormProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Validator, ValidationException } from "@/lib/validation/validator";
import { ValidationError } from "@/lib/validation/schemas";
import { ToastManager } from "@/lib/toast/toastManager";

/**
 * Helper function to create a form submit handler with automatic error handling
 */
export function createFormSubmitHandler<T>(
  onSubmit: (data: T) => Promise<void> | void,
  options: {
    showToastOnError?: boolean;
    showToastOnSuccess?: boolean;
    successMessage?: string;
  } = {}
) {
  const { showToastOnError = true, showToastOnSuccess = false, successMessage } = options;

  return async (data: T) => {
    try {
      await onSubmit(data);
      if (showToastOnSuccess) {
        ToastManager.formSuccess("Form", successMessage);
      }
    } catch (error) {
      if (showToastOnError) {
        if (error instanceof ValidationException) {
          ToastManager.formValidationError(
            error.validationErrors.reduce((acc: Record<string, string>, err: ValidationError) => {
              acc[err.field] = err.message;
              return acc;
            }, {} as Record<string, string>)
          );
        } else {
          ToastManager.apiError(error);
        }
      }
      throw error;
    }
  };
}

/**
 * Enhanced form hook that works seamlessly with React Hook Form
 */
export function useEnhancedForm<T extends FieldValues>(
  schema: z.ZodSchema<T>,
  options?: UseFormProps<T>
) {
  return useForm<T>({
    resolver: zodResolver(schema),
    ...options,
  });
}

/**
 * Field validation hook with real-time validation and toast notifications
 */
export function useFieldValidation<T>(
  schema: z.ZodSchema<T>,
  options?: {
    debounceMs?: number;
    showToastOnError?: boolean;
    initialValue?: T;
  }
) {
  const { debounceMs = 300, showToastOnError = false, initialValue } = options || {};
  const [value, setValue] = useState<T | undefined>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Debounced validation
  useEffect(() => {
    if (value === undefined) return;

    setIsValidating(true);
    const timeoutId = setTimeout(async () => {
      try {
        const result = await Validator.validateFieldRealtime(schema, value, { debounceMs: 0 });
        setIsValid(result.isValid);
        setError(result.error || null);
        
        if (!result.isValid && showToastOnError && result.error) {
          ToastManager.validationError({ field: "field", message: result.error });
        }
      } catch (err) {
        setIsValid(false);
        setError("Validation failed");
      } finally {
        setIsValidating(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, schema, debounceMs, showToastOnError]);

  const validate = useCallback(
    (newValue: T) => {
      try {
        schema.parse(newValue);
        return { isValid: true, error: null };
      } catch (err) {
        const errorMessage = err instanceof z.ZodError 
          ? err.errors[0]?.message || "Invalid value"
          : "Validation failed";
        return { isValid: false, error: errorMessage };
      }
    },
    [schema]
  );

  const setValue_validated = useCallback((newValue: T) => {
    setValue(newValue);
  }, []);

  return {
    value,
    setValue: setValue_validated,
    error,
    isValid,
    isValidating,
    validate,
  };
}

/**
 * Password validation hook with strength indicator and real-time feedback
 */
export function usePasswordValidation(options?: {
  showToastOnWeakPassword?: boolean;
  requireStrong?: boolean;
}) {
  const { showToastOnWeakPassword = false, requireStrong = false } = options || {};
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState({ score: 0, feedback: [] as string[], isStrong: false });

  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, feedback: [], isStrong: false });
      return;
    }

    // Calculate password strength (you can implement this based on your requirements)
    const newStrength = calculatePasswordStrength(password);
    setStrength(newStrength);

    if (showToastOnWeakPassword && !newStrength.isStrong && requireStrong) {
      ToastManager.warning({
        title: "Weak Password",
        description: "Consider using a stronger password for better security",
      });
    }
  }, [password, showToastOnWeakPassword, requireStrong]);

  return {
    password,
    setPassword,
    strength,
    isStrong: strength.isStrong,
    feedback: strength.feedback,
  };
}

// Helper function to calculate password strength
function calculatePasswordStrength(password: string) {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push("Use at least 8 characters");

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("Add lowercase letters");

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("Add uppercase letters");

  if (/\d/.test(password)) score += 1;
  else feedback.push("Add numbers");

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push("Add special characters");

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
}

/**
 * Multi-step form validation hook
 */
export function useMultiStepValidation<T extends FieldValues>(
  steps: Array<{ schema: z.ZodSchema<Partial<T>>; name: string }>,
  options?: {
    showToastOnStepError?: boolean;
    showToastOnComplete?: boolean;
  }
) {
  const { showToastOnStepError = true, showToastOnComplete = true } = options || {};
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState<Partial<T>[]>(steps.map(() => ({})));
  const [stepErrors, setStepErrors] = useState<Record<string, string>[]>(steps.map(() => ({})));

  const validateStep = useCallback(
    (stepIndex: number, data: Partial<T>) => {
      if (stepIndex < 0 || stepIndex >= steps.length) return false;

      const result = Validator.validateForm(steps[stepIndex].schema, data);
      
      setStepErrors(prev => {
        const newErrors = [...prev];
        newErrors[stepIndex] = result.errors;
        return newErrors;
      });

      if (!result.isValid && showToastOnStepError) {
        ToastManager.formValidationError(result.errors, `${steps[stepIndex].name} Validation Error`);
      }

      return result.isValid;
    },
    [steps, showToastOnStepError]
  );

  const goToStep = useCallback(
    (stepIndex: number, data?: Partial<T>) => {
      if (data) {
        setStepData(prev => {
          const newData = [...prev];
          newData[currentStep] = { ...prev[currentStep], ...data };
          return newData;
        });

        if (!validateStep(currentStep, { ...stepData[currentStep], ...data })) {
          return false;
        }
      }

      setCurrentStep(stepIndex);
      return true;
    },
    [currentStep, stepData, validateStep]
  );

  const nextStep = useCallback(
    (data?: Partial<T>) => {
      if (currentStep < steps.length - 1) {
        return goToStep(currentStep + 1, data);
      }
      return false;
    },
    [currentStep, steps.length, goToStep]
  );

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      return true;
    }
    return false;
  }, [currentStep]);

  const completeForm = useCallback(() => {
    // Validate all steps
    let allValid = true;
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i, stepData[i])) {
        allValid = false;
        break;
      }
    }

    if (allValid && showToastOnComplete) {
      ToastManager.formSuccess("Multi-step Form", "All steps completed successfully!");
    }

    return allValid;
  }, [steps.length, stepData, validateStep, showToastOnComplete]);

  const getAllData = useCallback((): Partial<T> => {
    return stepData.reduce((acc, data) => ({ ...acc, ...data }), {});
  }, [stepData]);

  return {
    currentStep,
    totalSteps: steps.length,
    stepData: stepData[currentStep],
    stepErrors: stepErrors[currentStep],
    allData: getAllData(),
    goToStep,
    nextStep,
    prevStep,
    validateStep: (data: Partial<T>) => validateStep(currentStep, data),
    completeForm,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    progress: ((currentStep + 1) / steps.length) * 100,
  };
}

/**
 * Async validation hook for checking unique values (e.g., email, username)
 */
export function useAsyncValidation<T>(
  validator: (value: T) => Promise<boolean>,
  options?: {
    debounceMs?: number;
    showToastOnError?: boolean;
    errorMessage?: string;
  }
) {
  const { debounceMs = 500, showToastOnError = false, errorMessage = "Value already exists" } = options || {};
  const [value, setValue] = useState<T | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value === null) {
      setIsValid(null);
      setError(null);
      return;
    }

    setIsChecking(true);
    const timeoutId = setTimeout(async () => {
      try {
        const result = await validator(value);
        setIsValid(result);
        setError(result ? null : errorMessage);
        
        if (!result && showToastOnError) {
          ToastManager.validationError({ field: "async", message: errorMessage });
        }
      } catch (err) {
        setIsValid(false);
        const errMsg = err instanceof Error ? err.message : "Validation failed";
        setError(errMsg);
        
        if (showToastOnError) {
          ToastManager.validationError({ field: "async", message: errMsg });
        }
      } finally {
        setIsChecking(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, validator, debounceMs, showToastOnError, errorMessage]);

  return {
    setValue,
    isChecking,
    isValid,
    error,
  };
}