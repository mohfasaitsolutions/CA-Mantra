import React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AuthLayout from "@/components/AuthLayout";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/lib/store";

// Import the new centralized validation system
import { FormSchemas, ToastManager } from "@/lib/validation";
import { useEnhancedForm } from "@/hooks/useValidationNew";
import { GRADIENT_COLORS } from "@/constants/colors";

const Register = () => {
  const {
    register: registerUser,
    isLoading,
    error,
    clearError,
    info,
    clearInfo,
  } = useAuthStore();

  // Use the new validation system
  const form = useEnhancedForm(FormSchemas.register, {
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      caLevel: "foundation" as const,
      password: "",
      confirmPassword: "",
    },
  });

  const handleFormSubmit = form.handleSubmit(async (data) => {
    console.log("Form submitted with data:", data); // Debug log
    try {
      const caLevelBackend = data.caLevel.toUpperCase(); // FOUNDATION / INTERMEDIATE / FINAL
      console.log("Calling registerUser with:", {
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        caLevel: caLevelBackend,
      });
      await registerUser(data.name, data.email, data.password, data.mobile, caLevelBackend);
      // Success handling is done in the useEffect below
    } catch (error) {
      // Handle any unexpected errors - prevent page reload
      console.error("Registration error:", error);
      ToastManager.auth.registrationError(
        "An unexpected error occurred. Please try again."
      );
    }
  });

  // Handle side effects after registration attempt
  React.useEffect(() => {
    if (error) {
      ToastManager.auth.registrationError(error);
      clearError();
    } else if (info) {
      // Don't show toast when there's an info message, the banner will handle it
      // The modern UI banner will display the verification message
    }
  }, [error, info, clearError]);

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Sign up to start your CA Mantra preparation journey"
      type="register"
    >
      <div className="space-y-6">
        {info ? (
          // Show only verification message when email is sent
          <>
            {/* Modern verification message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-green-100 rounded-full p-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-900">
                    Verify Your Email Address
                  </h3>
                  <p className="text-green-700 text-sm leading-relaxed">
                    We've sent a verification link to your email address. Please
                    check your inbox and click the link to activate your
                    account.
                  </p>

                  <div className="mt-4 p-3 bg-green-100 rounded-md">
                    <p className="text-xs text-green-800 font-medium">
                      💡 Tip: Check your spam folder if you don't see the email
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-3 w-full">
                  <button
                    onClick={() => clearInfo()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Continue to Login
                  </button>

                  <Link
                    to="/login"
                    className="text-green-700 hover:text-green-800 text-sm font-medium underline"
                  >
                    Back to Login Page
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Registration Form */}
            <Form {...form}>
              <form
                onSubmit={(e) => {
                  console.log("Raw form submit event triggered"); // Debug log
                  e.preventDefault(); // Prevent default first
                  handleFormSubmit(e); // Call our handler
                }}
                className="mt-8 space-y-6"
                method="POST" // Explicitly set method
                action="#" // Prevent default action
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                        <Input placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="10-digit mobile number"
                          inputMode="numeric"
                          maxLength={10}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="caLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CA Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your CA level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="foundation">Foundation</SelectItem>
                          <SelectItem value="intermediate">
                            Intermediate
                          </SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                        </SelectContent>
                      </Select>
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
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  disabled={isLoading}
                  type="submit"
                  className={`w-full text-white ${GRADIENT_COLORS.PRIMARY_TO_ACCENT} hover:opacity-90`}
                >
                  {isLoading ? "Creating..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default Register;
