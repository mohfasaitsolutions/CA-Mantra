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
import AuthLayout from "@/components/AuthLayout";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/lib/store";
import { useState } from "react";

// Import the new centralized validation system
import { FormSchemas, ToastManager } from "@/lib/validation";
import { useEnhancedForm } from "@/hooks/useValidationNew";
import { GRADIENT_COLORS } from "@/constants/colors";

// Helper function to get role-based redirect path
const getRoleBasedRedirect = (role?: string): string => {
  switch (role?.toUpperCase()) {
    case "ADMIN":
      return "/admin/dashboard";
    case "EVALUATORS":
    case "EVALUATOR":
      return "/evaluator/dashboard";
    case "STUDENTS":
    case "STUDENT":
    default:
      return "/student/dashboard";
  }
};

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, clearError, resendVerification } = useAuthStore();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  // Use the new validation system
  const form = useEnhancedForm(FormSchemas.login, {
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Always prevent default first
    e.stopPropagation(); // Stop event bubbling

    // Get form data directly without React Hook Form's handleSubmit
    const formData = form.getValues();

    // Validate manually using our validation schema
    const validation = FormSchemas.login.safeParse(formData);
    if (!validation.success) {
      // Set form errors manually
      validation.error.errors.forEach((error) => {
        const path = error.path[0] as keyof typeof formData;
        form.setError(path, { message: error.message });
      });
      return;
    }

    try {
      const ok = await login(formData.email, formData.password, redirectTarget);
      if (!ok) {
        const errMsg =
          useAuthStore.getState().error || "Invalid email or password";

        // Detect unverified email message from backend
        if (errMsg.toLowerCase().includes("email not verified")) {
          setPendingEmail(formData.email);
          ToastManager.auth.emailVerificationSent();
        } else {
          ToastManager.auth.loginError(errMsg);
        }
        clearError();
        return; // Don't proceed further - this is important to prevent page reload
      }

      ToastManager.auth.loginSuccess();

      // Prefer explicit redirect target if provided
      if (redirectTarget) {
        navigate(redirectTarget, { replace: true });
      } else {
        // Get user from store and redirect based on role
        const currentUser = useAuthStore.getState().user;
        const roleBasedPath = getRoleBasedRedirect(currentUser?.role);
        navigate(roleBasedPath, { replace: true });
      }
    } catch (error) {
      // Handle any unexpected errors - prevent page reload
      console.error("Login error:", error);
      ToastManager.auth.loginError(
        "An unexpected error occurred. Please try again."
      );
      clearError();
    }
  };

  // const handleGoogleLogin = () => {
  //   ToastManager.info(
  //     "Google authentication will be implemented with backend integration."
  //   );
  // };

  const handleResendVerification = async () => {
    if (!pendingEmail) return;

    try {
      await resendVerification(pendingEmail);
      ToastManager.auth.emailVerificationSent();
    } catch (error) {
      ToastManager.apiError(error, "Failed to resend verification email");
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your CA Mantraaa account"
      type="login"
    >
      <div className="space-y-6">
        {/* Show verification reminder if email is pending */}
        {pendingEmail && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <div className="bg-amber-100 rounded-full p-1">
                  <svg
                    className="w-4 h-4 text-amber-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-amber-800">
                  Email verification required
                </p>
              </div>
              <p className="text-sm text-amber-700">
                Please check your email ({pendingEmail}) and click the
                verification link.
              </p>
              <button
                onClick={handleResendVerification}
                className="text-sm text-amber-800 hover:text-amber-900 underline font-medium"
              >
                Resend verification email
              </button>
            </div>
          </div>
        )}

        {/* Google Login Button */}
        {/* <Button
          onClick={handleGoogleLogin}
          variant="outline"
          className="w-full"
          type="button"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button> */}

        {/* Divider */}
        {/* <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div> */}

        {/* Email/Password Form */}
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-ca-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              disabled={isLoading}
              type="submit"
              className={`w-full text-white ${GRADIENT_COLORS.PRIMARY_TO_ACCENT} hover:opacity-90`}
            >
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
};

export default Login;
