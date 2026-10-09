import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useToast } from "@/hooks/use-toast";

// Two modes: request reset (email) OR reset (token + password)
const requestSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const resetSchema = z
  .object({
    token: z.string().min(10, { message: "Invalid or missing token" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Please confirm your new password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RequestValues = z.infer<typeof requestSchema>;
type ResetValues = z.infer<typeof resetSchema>;

const ForgotPassword = () => {
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token") || "";
  const isResetMode = !!token;

  const form = useForm<RequestValues | ResetValues>({
    resolver: zodResolver(isResetMode ? resetSchema : requestSchema),
    defaultValues: isResetMode
      ? { token, password: "", confirmPassword: "" }
      : { email: "" },
  });

  const onSubmit = async (data: RequestValues | ResetValues) => {
    try {
      if (isResetMode) {
        const d = data as ResetValues;
        await authApi.resetPassword(d.token, d.password);
        toast({
          title: "Password Reset",
          description: "Your password has been updated. You can now login.",
        });
        setTimeout(() => {
          window.location.replace("/login");
        }, 1200);
      } else {
        const d = data as RequestValues;
        await authApi.forgotPassword(d.email);
        toast({
          title: "Email Sent",
          description: "Check your email for reset instructions.",
        });
      }
    } catch (e: unknown) {
      let message = "Request failed";
      if (typeof e === "object" && e !== null && "response" in e) {
        const err = e as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        message = err.response?.data?.message || err.message || message;
      } else if (e instanceof Error) {
        message = e.message;
      }
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <Link
            to="/login"
            className="flex items-center text-ca-primary hover:text-ca-primary/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>

          <div className="mt-6 text-center">
            <h2 className="text-2xl font-bold">
              {isResetMode ? "Reset Password" : "Forgot Password"}
            </h2>
            <p className="mt-2 text-gray-600">
              {isResetMode
                ? "Set a new password for your account."
                : "Enter your email to receive a reset link."}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-8 space-y-6"
          >
            {!isResetMode && (
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
            )}
            {isResetMode && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="New password"
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
                          placeholder="Confirm password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div>
              <Button
                type="submit"
                className="w-full bg-ca-primary hover:bg-ca-primary/90"
              >
                {isResetMode ? "Reset Password" : "Send Reset Link"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ForgotPassword;
