import { toast, useToast as useToastPrimitive } from "@/hooks/use-toast";
import { ValidationError } from "../validation/schemas";
import { ToastActionElement } from "@/components/ui/toast";

/**
 * Toast types for different scenarios
 */
export type ToastType = "success" | "error" | "warning" | "info";

/**
 * Enhanced toast configuration
 */
export interface ToastConfig {
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  action?: ToastActionElement;
  persistent?: boolean;
}

/**
 * Centralized toast utility for consistent error and success messaging
 */
export class ToastManager {
  /**
   * Shows a success toast
   */
  static success(config: Omit<ToastConfig, "type"> | string) {
    if (typeof config === "string") {
      toast({
        title: "Success",
        description: config,
        variant: "default",
      });
    } else {
      toast({
        title: config.title || "Success",
        description: config.description,
        variant: "default",
        action: config.action,
      });
    }
  }

  /**
   * Shows an error toast
   */
  static error(config: Omit<ToastConfig, "type"> | string) {
    if (typeof config === "string") {
      toast({
        title: "Error",
        description: config,
        variant: "destructive",
      });
    } else {
      toast({
        title: config.title || "Error",
        description: config.description,
        variant: "destructive",
        action: config.action,
      });
    }
  }

  /**
   * Shows a warning toast
   */
  static warning(config: Omit<ToastConfig, "type"> | string) {
    if (typeof config === "string") {
      toast({
        title: "Warning",
        description: config,
        variant: "default",
      });
    } else {
      toast({
        title: config.title || "Warning",
        description: config.description,
        variant: "default",
        action: config.action,
      });
    }
  }

  /**
   * Shows an info toast
   */
  static info(config: Omit<ToastConfig, "type"> | string) {
    if (typeof config === "string") {
      toast({
        title: "Information",
        description: config,
        variant: "default",
      });
    } else {
      toast({
        title: config.title || "Information",
        description: config.description,
        variant: "default",
        action: config.action,
      });
    }
  }

  /**
   * Shows validation errors as toast
   */
  static validationError(errors: ValidationError | ValidationError[], title?: string) {
    const errorArray = Array.isArray(errors) ? errors : [errors];
    
    if (errorArray.length === 0) return;

    if (errorArray.length === 1) {
      this.error({
        title: title || "Validation Error",
        description: errorArray[0].message,
      });
    } else {
      const description = errorArray
        .map((error, index) => `${index + 1}. ${error.message}`)
        .join("\n");

      this.error({
        title: title || "Validation Errors",
        description: description,
      });
    }
  }

  /**
   * Shows API error with proper formatting
   */
  static apiError(error: unknown, defaultMessage = "An error occurred") {
    let message = defaultMessage;
    let title = "Error";

    // Handle different error types
    if (error && typeof error === "object") {
      // Axios error response
      if ("response" in error) {
        const axiosError = error as {
          response?: {
            data?: { message?: string; errors?: ValidationError[] };
            status?: number;
          };
          message?: string;
        };

        if (axiosError.response?.data?.errors) {
          // Handle validation errors from API
          this.validationError(axiosError.response.data.errors);
          return;
        }

        message = axiosError.response?.data?.message || axiosError.message || defaultMessage;
        
        // Set title based on status code
        if (axiosError.response?.status) {
          switch (axiosError.response.status) {
            case 400:
              title = "Bad Request";
              break;
            case 401:
              title = "Unauthorized";
              break;
            case 403:
              title = "Forbidden";
              break;
            case 404:
              title = "Not Found";
              break;
            case 500:
              title = "Server Error";
              break;
            default:
              title = "Error";
          }
        }
      } 
      // Standard Error object
      else if ("message" in error) {
        message = (error as Error).message || defaultMessage;
      }
    } 
    // String error
    else if (typeof error === "string") {
      message = error;
    }

    this.error({ title, description: message });
  }

  /**
   * Shows loading toast that can be updated
   */
  static loading(message: string) {
    return toast({
      title: "Loading...",
      description: message,
      variant: "default",
    });
  }

  /**
   * Updates an existing toast
   */
  static updateToast(_toastId: string, _config: ToastConfig) {
    // Note: The existing toast hook doesn't support updating by ID
    // This is a placeholder for future implementation
    console.warn("Toast update not implemented in current toast system");
  }

  /**
   * Shows form submission success
   */
  static formSuccess(formName = "Form", customMessage?: string) {
    this.success(customMessage || `${formName} submitted successfully!`);
  }

  /**
   * Shows form validation errors
   */
  static formValidationError(errors: Record<string, string>, title?: string) {
    const errorMessages = Object.values(errors).filter(Boolean);
    
    if (errorMessages.length === 0) return;

    if (errorMessages.length === 1) {
      this.error({
        title: title || "Form Validation Error",
        description: errorMessages[0],
      });
    } else {
      const description = errorMessages
        .map((error, index) => `${index + 1}. ${error}`)
        .join("\n");

      this.error({
        title: title || "Form Validation Errors",
        description: description,
      });
    }
  }

  /**
   * Shows authentication specific messages
   */
  static auth = {
    loginSuccess: () => ToastManager.success("Welcome back! Redirecting to dashboard..."),
    loginError: (message?: string) => ToastManager.error({
      title: "Login Failed",
      description: message || "Invalid email or password",
    }),
    registrationSuccess: () => ToastManager.success("Account created successfully! Please verify your email."),
    registrationError: (message?: string) => ToastManager.error({
      title: "Registration Failed", 
      description: message || "Failed to create account",
    }),
    passwordChanged: () => ToastManager.success("Password changed successfully!"),
    passwordChangeError: (message?: string) => ToastManager.error({
      title: "Password Change Failed",
      description: message || "Failed to change password",
    }),
    emailVerified: () => ToastManager.success("Email verified successfully!"),
    emailVerificationSent: () => ToastManager.info("Verification email sent. Please check your inbox."),
    resetLinkSent: () => ToastManager.success("Password reset link sent to your email."),
    passwordReset: () => ToastManager.success("Password reset successfully! You can now login."),
    logoutSuccess: () => ToastManager.info("Logged out successfully"),
  };

  /**
   * Shows file upload specific messages
   */
  static upload = {
    success: (fileName?: string) => ToastManager.success(
      fileName ? `${fileName} uploaded successfully!` : "File uploaded successfully!"
    ),
    error: (message?: string) => ToastManager.error({
      title: "Upload Failed",
      description: message || "Failed to upload file",
    }),
    sizeError: (maxSize: string) => ToastManager.error({
      title: "File Too Large",
      description: `File size must be less than ${maxSize}`,
    }),
    typeError: (allowedTypes: string[]) => ToastManager.error({
      title: "Invalid File Type",
      description: `Only ${allowedTypes.join(", ")} files are allowed`,
    }),
    progress: (fileName: string, progress: number) => ToastManager.info(
      `Uploading ${fileName}... ${progress}%`
    ),
  };

  /**
   * Shows data operation specific messages
   */
  static data = {
    saved: (itemName = "Data") => ToastManager.success(`${itemName} saved successfully!`),
    deleted: (itemName = "Item") => ToastManager.success(`${itemName} deleted successfully!`),
    updated: (itemName = "Data") => ToastManager.success(`${itemName} updated successfully!`),
    fetchError: (itemName = "data") => ToastManager.error(`Failed to load ${itemName}`),
    saveError: (itemName = "data") => ToastManager.error(`Failed to save ${itemName}`),
    deleteError: (itemName = "item") => ToastManager.error(`Failed to delete ${itemName}`),
    notFound: (itemName = "Item") => ToastManager.error(`${itemName} not found`),
  };
}

/**
 * Enhanced useToast hook with predefined methods
 */
export function useEnhancedToast() {
  const { toast, dismiss, ...rest } = useToastPrimitive();

  return {
    toast,
    dismiss,
    success: ToastManager.success,
    error: ToastManager.error,
    warning: ToastManager.warning,
    info: ToastManager.info,
    validationError: ToastManager.validationError,
    apiError: ToastManager.apiError,
    formSuccess: ToastManager.formSuccess,
    formValidationError: ToastManager.formValidationError,
    auth: ToastManager.auth,
    upload: ToastManager.upload,
    data: ToastManager.data,
    ...rest,
  };
}

// Export for backward compatibility
export { useToastPrimitive as useToast };