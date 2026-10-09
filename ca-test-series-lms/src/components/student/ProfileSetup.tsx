import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { User, Phone } from "lucide-react";
import { indianStates } from "@/data/indianLocations";
import { useAuthStore } from "@/lib/store";
// import { usersApi } from "@/lib/api/users";

const profileSetupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  mobile: z
    .string()
    .length(10, { message: "Mobile number must be exactly 10 digits" })
    .regex(/^\d{10}$/, { message: "Mobile number must contain only digits" }),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  street: z.string().min(2, { message: "Street/House number is required" }),
  pincode: z
    .string()
    .length(6, { message: "Pincode must be exactly 6 digits" })
    .regex(/^\d{6}$/, { message: "Pincode must contain only digits" }),
  caLevel: z.string().min(1, { message: "Please select your CA level" }),
  // otp: z.string().optional(),
});

type ProfileSetupFormValues = z.infer<typeof profileSetupSchema>;

interface ProfileSetupProps {
  isOpen: boolean;
  onComplete: () => void;
}

const ProfileSetup = ({ isOpen, onComplete }: ProfileSetupProps) => {
  // const [showOtpVerification, setShowOtpVerification] = useState(false);
  // const [isMobileVerified, setIsMobileVerified] = useState(false);
  // const [isOtpSending, setIsOtpSending] = useState(false);
  // const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  // const [otpSent, setOtpSent] = useState(false);
  // const [resendTimer, setResendTimer] = useState(0);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCaLevel, setSelectedCaLevel] = useState("");
  // const otpInputRef = useRef<HTMLInputElement | null>(null);
  // const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { user, updateProfile } = useAuthStore();

  const form = useForm<ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      name: user?.name || "",
      mobile: user?.mobile || "",
      city: user?.city || "",
      state: user?.state || "",
      street: user?.street || "",
      pincode: user?.pincode || "",
      caLevel: user?.caLevel || "",
      // otp: "",
    },
  });

  // Function to parse address into components
  const parseAddress = (address: string) => {
    if (!address) return { street: "", city: "", state: "", pincode: "" };

    // Try to extract pincode (6 digits at the end)
    const pincodeMatch = address.match(/(\d{6})$/);
    const pincode = pincodeMatch ? pincodeMatch[1] : "";

    // Remove pincode and dash from address
    const remaining = address.replace(/\s*-\s*\d{6}$/, "").trim();

    // Split by comma and work backwards
    const parts = remaining
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (parts.length === 0) {
      return { street: "", city: "", state: "", pincode };
    }

    // Work backwards: last part is likely state, second last is city
    const state = parts[parts.length - 1] || "";
    const city = parts.length > 1 ? parts[parts.length - 2] : "";

    // Everything else is street/house info
    const streetParts = parts.slice(0, Math.max(0, parts.length - 2));
    const street = streetParts.join(", ");

    return { street, city, state, pincode };
  };

  // Start resend timer
  // const startResendTimer = () => {
  //   setResendTimer(30);
  //   timerRef.current = setInterval(() => {
  //     setResendTimer((prev) => {
  //       if (prev <= 1) {
  //         if (timerRef.current) {
  //           clearInterval(timerRef.current);
  //           timerRef.current = null;
  //         }
  //         return 0;
  //       }
  //       return prev - 1;
  //     });
  //   }, 1000);
  // };

  // Clean up timer on unmount
  // useEffect(() => {
  //   return () => {
  //     if (timerRef.current) {
  //       clearInterval(timerRef.current);
  //     }
  //   };
  // }, []);

  // Restore OTP pending state (in case component remounts after profile update)
  // useEffect(() => {
  //   if (!isMobileVerified && sessionStorage.getItem("otp-pending") === "1") {
  //     setShowOtpVerification(true);
  //     setOtpSent(true);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // Persist OTP pending flag
  // useEffect(() => {
  //   if (showOtpVerification && !isMobileVerified) {
  //     sessionStorage.setItem("otp-pending", "1");
  //   } else {
  //     sessionStorage.removeItem("otp-pending");
  //   }
  // }, [showOtpVerification, isMobileVerified]);

  // Pre-load cities if user has state
  useEffect(() => {
    if (!user) return;

    // Parse address if it exists
    let addressComponents = { street: "", city: "", state: "", pincode: "" };
    if (user.address) {
      addressComponents = parseAddress(user.address);
      console.log("Address parsing result:", addressComponents);
      console.log("Original address:", user.address);
    }

    // Update form fields from user
    form.reset({
      name: user.name || "",
      mobile: user.mobile || "",
      city: addressComponents.city || user.city || "",
      state: addressComponents.state || user.state || "",
      street: addressComponents.street || user.street || "",
      pincode: addressComponents.pincode || user.pincode || "",
      caLevel: user.caLevel || "",
      // otp: "",
    });

    if (addressComponents.state || user.state) {
      const stateToSet = addressComponents.state || user.state || "";
      setSelectedState(stateToSet);
      handleStateChange(stateToSet);

      // Explicitly set city value after state is set
      if (addressComponents.city) {
        form.setValue("city", addressComponents.city);
      }
    }

    if (user.caLevel) {
      // Normalize CA level to title case for display
      const normalizedCaLevel =
        user.caLevel.charAt(0).toUpperCase() +
        user.caLevel.slice(1).toLowerCase();
      setSelectedCaLevel(normalizedCaLevel);
      form.setValue("caLevel", normalizedCaLevel);
    }

    // Check if mobile is verified from backend
    // const userWithMobileVerified = user as typeof user & {
    //   mobileVerified?: boolean;
    // };
    // if (user.mobile && userWithMobileVerified.mobileVerified) {
    //   setIsMobileVerified(true);
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    form.setValue("state", state);
    form.setValue("city", ""); // Reset city when state changes
  };

  // const handleSendOtp = async () => {
  //   const mobile = form.getValues("mobile");
  //   console.log("Sending OTP for mobile:", mobile);

  //   if (mobile.length < 10) {
  //     toast({
  //       title: "Invalid Mobile Number",
  //       description: "Please enter a valid mobile number.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setIsOtpSending(true);
  //   try {
  //     console.log("Updating profile with mobile (lightweight):", mobile);
  //     // Light-weight mobile update: directly call API to avoid store-wide loading state flicker
  //     try {
  //       await usersApi.updateMe({ mobile });
  //     } catch (e) {
  //       // fallback to store update if direct call fails
  //       await updateProfile({ mobile });
  //     }
  //     console.log("Profile updated successfully");

  //     console.log("Sending OTP request...");
  //     // Then send OTP
  //     const response = await usersApi.sendMobileOtp();
  //     console.log("OTP response:", response);

  //     setShowOtpVerification(true);
  //     setOtpSent(true);
  //     startResendTimer();
  //     console.log("showOtpVerification set to true");
  //     toast({
  //       title: "OTP Sent",
  //       description:
  //         response.message ||
  //         "Verification code has been sent to your mobile number. Use 123456 for testing.",
  //     });
  //   } catch (error) {
  //     console.error("Failed to send OTP:", error);
  //     const apiError = error as {
  //       response?: { data?: { message?: string } };
  //       message?: string;
  //     };
  //     console.error(
  //       "Error details:",
  //       apiError.response?.data || apiError.message
  //     );
  //     toast({
  //       title: "Error",
  //       description: `Failed to send OTP: ${
  //         apiError.response?.data?.message ||
  //         apiError.message ||
  //         "Unknown error"
  //       }. Please try again.`,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsOtpSending(false);
  //   }
  // };

  // const handleResendOtp = async () => {
  //   setIsOtpSending(true);
  //   try {
  //     const response = await usersApi.sendMobileOtp();
  //     startResendTimer();
  //     toast({
  //       title: "OTP Resent",
  //       description:
  //         response.message ||
  //         "New verification code has been sent to your mobile number.",
  //     });
  //   } catch (error) {
  //     console.error("Failed to resend OTP:", error);
  //     const apiError = error as {
  //       response?: { data?: { message?: string } };
  //       message?: string;
  //     };
  //     toast({
  //       title: "Error",
  //       description: `Failed to resend OTP: ${
  //         apiError.response?.data?.message ||
  //         apiError.message ||
  //         "Unknown error"
  //       }. Please try again.`,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsOtpSending(false);
  //   }
  // };

  // Autofocus OTP input when box becomes visible
  // useEffect(() => {
  //   if (showOtpVerification && otpInputRef.current) {
  //     otpInputRef.current.focus();
  //   }
  // }, [showOtpVerification]);

  // const handleVerifyOtp = async () => {
  //   const otpValue = form.getValues("otp") || "";
  //   if (otpValue.length !== 6) {
  //     toast({
  //       title: "Invalid OTP",
  //       description: "Please enter a valid 6-digit OTP.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setIsOtpVerifying(true);
  //   try {
  //     const response = await usersApi.verifyMobileOtp({ otp: otpValue });

  //     // If the API call succeeds (no error thrown), consider it successful
  //     // The API returns {"message":"Mobile number verified successfully"} on success
  //     setIsMobileVerified(true);
  //     setShowOtpVerification(false);
  //     setOtpSent(false);
  //     if (timerRef.current) {
  //       clearInterval(timerRef.current);
  //       timerRef.current = null;
  //     }
  //     setResendTimer(0);
  //     form.setValue("otp", ""); // Clear the OTP input
  //     toast({
  //       title: "Mobile Verified",
  //       description:
  //         response.message ||
  //         "Your mobile number has been verified successfully.",
  //     });
  //   } catch (error) {
  //     console.error("Failed to verify OTP:", error);
  //     const apiError = error as {
  //       response?: { data?: { message?: string } };
  //       message?: string;
  //     };
  //     toast({
  //       title: "Invalid OTP",
  //       description:
  //         apiError.response?.data?.message || "Please enter the correct OTP.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsOtpVerifying(false);
  //   }
  // };

  const onSubmit = async (data: ProfileSetupFormValues) => {
    try {
      // Concatenate address fields
      const fullAddress = `${data.street}, ${data.city}, ${data.state} - ${data.pincode}`;

      await updateProfile({
        fullName: data.name,
        mobile: data.mobile,
        mobileVerified: true, // Auto-verify mobile on profile submission
        state: data.state,
        city: data.city,
        street: data.street,
        pincode: data.pincode,
        address: fullAddress,
        caLevel: data.caLevel.toUpperCase(),
      });
      toast({
        title: "Profile Setup Complete",
        description: "Your profile has been updated successfully.",
      });
      onComplete();
    } catch (e) {
      console.error("Failed to update profile:", e);
      const apiError = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast({
        title: "Update Failed",
        description:
          apiError.response?.data?.message || "Could not update profile",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-2xl [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Complete Your Profile
            </DialogTitle>
            <p className="text-center text-gray-600 mt-2">
              Please complete your profile to get started with your CA
              preparation journey.
            </p>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    className="pl-10"
                    {...form.register("name")}
                  />
                </div>
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="caLevel">CA Level *</Label>
                <Select
                  onValueChange={(value) => {
                    setSelectedCaLevel(value);
                    form.setValue("caLevel", value);
                  }}
                  value={selectedCaLevel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your CA level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Foundation">Foundation</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Final">Final</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.caLevel && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.caLevel.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  className="pl-10"
                  maxLength={10}
                  {...form.register("mobile")}
                />
              </div>
              {form.formState.errors.mobile && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.mobile.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select onValueChange={handleStateChange} value={selectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map((state) => (
                      <SelectItem key={state.value} value={state.label}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.state && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.state.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Enter your city"
                  {...form.register("city")}
                />
                {form.formState.errors.city && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.city.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="street">Street/House Number *</Label>
                <Input
                  id="street"
                  placeholder="Enter house number and street"
                  {...form.register("street")}
                />
                {form.formState.errors.street && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.street.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                  {...form.register("pincode")}
                />
                {form.formState.errors.pincode && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.pincode.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                size="lg"
                className="w-full md:w-auto"
              >
                Complete Profile Setup
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileSetup;
