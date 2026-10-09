/**
 * Example component showing how to use the centralized validation system
 * This demonstrates best practices for form validation and error handling
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Import the new centralized validation system
import {
  FormSchemas,
  ToastManager,
  usePasswordValidation,
  useFieldValidation,
  ValidationSchemas,
} from "@/lib/validation";

// Example: Simple login form with centralized validation
export const ExampleLoginForm = () => {
  const form = useForm({
    resolver: zodResolver(FormSchemas.login),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      // Your API call here
      console.log("Login data:", data);

      // Show success toast
      ToastManager.auth.loginSuccess();
    } catch (error) {
      // Show error toast with proper API error handling
      ToastManager.apiError(error, "Login failed");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
    </Form>
  );
};

// Example: Password field with strength validation
export const ExamplePasswordField = () => {
  const { password, setPassword, strength, isStrong, feedback } =
    usePasswordValidation({
      requireStrong: true,
      showToastOnWeakPassword: false, // We'll show inline feedback instead
    });

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Password</label>
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter a strong password"
      />

      {/* Password strength indicator */}
      <div className="space-y-1">
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1 w-full rounded ${
                level <= strength.score
                  ? level <= 2
                    ? "bg-red-500"
                    : level <= 3
                    ? "bg-yellow-500"
                    : "bg-green-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {feedback.length > 0 && (
          <ul className="text-xs text-gray-600">
            {feedback.map((tip, index) => (
              <li key={index}>• {tip}</li>
            ))}
          </ul>
        )}

        {isStrong && (
          <p className="text-xs text-green-600">✓ Strong password!</p>
        )}
      </div>
    </div>
  );
};

// Example: Email field with real-time validation
export const ExampleEmailField = () => {
  const { value, setValue, error, isValid, isValidating } = useFieldValidation(
    ValidationSchemas.email,
    {
      debounceMs: 500,
      showToastOnError: false, // Show inline error instead
    }
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Email</label>
      <div className="relative">
        <Input
          type="email"
          value={value || ""}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter your email"
          className={
            error ? "border-red-500" : isValid ? "border-green-500" : ""
          }
        />

        {/* Loading indicator */}
        {isValidating && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
          </div>
        )}

        {/* Validation status */}
        {!isValidating && value && (
          <div className="absolute right-3 top-2.5">
            {isValid ? (
              <span className="text-green-500">✓</span>
            ) : (
              <span className="text-red-500">✗</span>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

// Example: Contact form with comprehensive validation
export const ExampleContactForm = () => {
  const form = useForm({
    resolver: zodResolver(FormSchemas.contact),
    defaultValues: {
      fullName: "",
      email: "",
      mobile: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (formData: {
    fullName: string;
    email: string;
    mobile: string;
    subject: string;
    message: string;
  }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Log form data (in real app, send to API)
      console.log("Contact form data:", formData);

      // Show success toast
      ToastManager.data.saved("Contact form");

      // Reset form
      form.reset();
    } catch (error) {
      ToastManager.apiError(error, "Failed to send message");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your.email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="10-digit mobile number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="What's this about?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  placeholder="Your message here..."
                  className="min-h-[120px] w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </Form>
  );
};

// Example: Using toast notifications for different scenarios
export const ExampleToastDemo = () => {
  const handleSuccess = () => {
    ToastManager.success("Operation completed successfully!");
  };

  const handleError = () => {
    ToastManager.error("Something went wrong!");
  };

  const handleValidationError = () => {
    ToastManager.validationError([
      { field: "email", message: "Email is required" },
      { field: "password", message: "Password must be at least 8 characters" },
    ]);
  };

  const handleApiError = () => {
    // Simulate an API error
    const mockError = {
      response: {
        status: 400,
        data: { message: "Invalid credentials" },
      },
    };
    ToastManager.apiError(mockError);
  };

  const handleAuthToasts = () => {
    ToastManager.auth.loginSuccess();
  };

  const handleUploadToasts = () => {
    ToastManager.upload.sizeError("5MB");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Toast Examples</h3>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={handleSuccess} variant="outline">
          Success Toast
        </Button>
        <Button onClick={handleError} variant="outline">
          Error Toast
        </Button>
        <Button onClick={handleValidationError} variant="outline">
          Validation Error
        </Button>
        <Button onClick={handleApiError} variant="outline">
          API Error
        </Button>
        <Button onClick={handleAuthToasts} variant="outline">
          Auth Success
        </Button>
        <Button onClick={handleUploadToasts} variant="outline">
          Upload Error
        </Button>
      </div>
    </div>
  );
};
