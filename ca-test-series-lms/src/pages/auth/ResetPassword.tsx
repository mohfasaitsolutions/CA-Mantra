import React, { useState, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PasswordInput } from "@/components/ui/password-input";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const disabled =
    !token ||
    !password ||
    password.length < 6 ||
    password !== confirm ||
    loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    try {
      setLoading(true);
      await authApi.resetPassword(token, password);
      toast({
        title: "Password updated",
        description: "You can now login with your new password.",
      });
      navigate("/login");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr?.response?.data?.message || "Invalid or expired link";
      toast({
        title: "Reset failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Missing token. Please request a new reset link.
              </p>
              <Link
                to="/forgot-password"
                className="text-primary hover:underline text-sm"
              >
                Back to Forgot Password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <PasswordInput
                  placeholder="Enter new password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm Password
                </label>
                <PasswordInput
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center justify-end">
                <Link
                  to="/login"
                  className="text-primary hover:underline text-sm"
                >
                  Back to login
                </Link>
              </div>
              <Button type="submit" disabled={disabled} className="w-full">
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
