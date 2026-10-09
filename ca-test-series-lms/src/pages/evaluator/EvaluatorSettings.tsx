import React, { useState } from "react";
import { Menu, Lock, LogOut, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api/client";

const EvaluatorSettings = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { toast } = useToast();

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password should be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    apiClient
      .post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      .then(() => {
        toast({
          title: "Password Updated",
          description: "Your password has been changed successfully",
        });
        setChangePasswordDialog(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to change password";
        toast({
          title: "Change failed",
          description: msg,
          variant: "destructive",
        });
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignOutAllDevices = () => {
    toast({
      title: "Signed Out",
      description: "You have been signed out from all devices",
    });
  };

  const handleToggleAvailability = () => {
    setIsUnavailable(!isUnavailable);
    toast({
      title: isUnavailable ? "Marked as Available" : "Marked as Unavailable",
      description: isUnavailable
        ? "You will now receive new evaluation assignments"
        : "You will not receive new evaluation assignments until you mark yourself as available",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="evaluator" />
      <MobileSidebar
        role="evaluator"
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1">
        <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div>
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-gray-500">
                    Change your account password
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setChangePasswordDialog(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>

              <div className="space-y-2">
                <div>
                  <h3 className="font-medium">Session Management</h3>
                  <p className="text-sm text-gray-500">
                    Sign out from all active sessions
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-2 text-destructive hover:text-destructive"
                  onClick={handleSignOutAllDevices}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out From All Devices
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Availability Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Availability Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div>
                  <h3 className="font-medium">Evaluation Assignment Status</h3>
                  <p className="text-sm text-gray-500">
                    Mark yourself as unavailable to temporarily stop receiving
                    new evaluation assignments
                  </p>
                </div>
                <Button
                  variant={isUnavailable ? "default" : "destructive"}
                  className="mt-2"
                  onClick={handleToggleAvailability}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  {isUnavailable ? "Mark as Available" : "Mark as Unavailable"}
                </Button>
                {isUnavailable && (
                  <p className="text-sm text-red-600 mt-2">
                    You are currently unavailable for new evaluations
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Change Password Dialog */}
      <Dialog
        open={changePasswordDialog}
        onOpenChange={setChangePasswordDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handleInputChange}
                required
              />
              <p className="text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setChangePasswordDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvaluatorSettings;
