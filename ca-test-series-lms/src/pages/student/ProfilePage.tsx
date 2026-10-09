import React, { useState, useRef, useEffect } from "react";
import { Menu, Save, User, Mail, Camera, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { useToast } from "@/hooks/use-toast";
import { indianStates } from "@/data/indianLocations";
import { useAuthStore } from "@/lib/store";
import {
  useStudentProfile,
  useUpdateStudentProfile,
  useUploadStudentProfilePicture,
} from "@/lib/api/hooks";
import {
  compressImage,
  isValidImageFile,
  formatFileSize,
} from "@/utils/imageCompression";
import { UPLOAD_CONFIGS } from "@/constants/uploadLimits";
import { formatMonthYear } from "@/utils/dateUtils";

const ProfilePage = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use React Query hooks for profile management
  const { data: profile, error: profileError } = useStudentProfile();
  const updateProfileMutation = useUpdateStudentProfile();
  const uploadProfilePictureMutation = useUploadStudentProfilePicture();

  // Keep auth store for user data access
  const { user } = useAuthStore();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    caLevel: "FOUNDATION",
    phone: "",
    city: "",
    state: "",
    country: "India",
    street: "",
    pincode: "",
    profileImage: "",
  });

  // Parse address into street, city, state, pincode (improved parsing logic)
  const parseAddress = (address: string) => {
    console.log("Parsing address:", address);

    if (!address || typeof address !== "string") {
      console.log("No valid address provided");
      return { street: "", city: "", state: "", pincode: "" };
    }

    // Try to extract pincode (6 digits at the end)
    const pincodeMatch = address.match(/(\d{6})$/);
    const pincode = pincodeMatch ? pincodeMatch[1] : "";

    // Remove pincode and any preceding dash/hyphen from address
    let remainingAddress = address;
    if (pincode) {
      remainingAddress = address.replace(/\s*[-–—]\s*\d{6}$/, "").trim();
    }

    // Split by comma and clean up parts
    const parts = remainingAddress
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    console.log("Address parts after splitting by comma:", parts);

    if (parts.length === 0) {
      const result = { street: "", city: "", state: "", pincode };
      console.log("No parts found, returning:", result);
      return result;
    }

    // More flexible parsing based on number of parts
    let street = "";
    let city = "";
    let state = "";

    if (parts.length === 1) {
      // Only one part - check if it matches a known state
      const matchedState = indianStates.find(
        (s) => s.label.toLowerCase() === parts[0].toLowerCase()
      );

      if (matchedState) {
        state = matchedState.label;
      } else {
        // Assume it's a city if it's not a known state
        city = parts[0];
      }
    } else if (parts.length === 2) {
      // Two parts - check which one is a state
      const firstIsState = indianStates.find(
        (s) => s.label.toLowerCase() === parts[0].toLowerCase()
      );
      const secondIsState = indianStates.find(
        (s) => s.label.toLowerCase() === parts[1].toLowerCase()
      );

      if (secondIsState) {
        // Normal order: city, state
        city = parts[0];
        state = secondIsState.label;
      } else if (firstIsState) {
        // Reverse order: state, city
        state = firstIsState.label;
        city = parts[1];
      } else {
        // Neither is a known state, assume normal order
        city = parts[0];
        state = parts[1];
      }
    } else if (parts.length === 3) {
      // Three parts - check the last two for state
      const secondIsState = indianStates.find(
        (s) => s.label.toLowerCase() === parts[1].toLowerCase()
      );
      const thirdIsState = indianStates.find(
        (s) => s.label.toLowerCase() === parts[2].toLowerCase()
      );

      if (thirdIsState) {
        // Normal order: street, city, state
        street = parts[0];
        city = parts[1];
        state = thirdIsState.label;
      } else if (secondIsState) {
        // Different order: street, state, city or street, state, area
        street = parts[0];
        state = secondIsState.label;
        city = parts[2];
      } else {
        // No known state found, use original logic
        street = parts[0];
        city = parts[1];
        state = parts[2];
      }
    } else {
      // More than 3 parts - try to find the state in the last few parts
      let stateIndex = -1;
      let matchedStateData = null;

      // Check last 3 parts for state names
      for (let i = Math.max(0, parts.length - 3); i < parts.length; i++) {
        const potentialState = indianStates.find(
          (s) => s.label.toLowerCase() === parts[i].toLowerCase()
        );
        if (potentialState) {
          stateIndex = i;
          matchedStateData = potentialState;
          break;
        }
      }

      if (matchedStateData && stateIndex >= 0) {
        // Found a state, organize accordingly
        const beforeState = parts.slice(0, stateIndex);
        const afterState = parts.slice(stateIndex + 1);

        street =
          beforeState.length > 1 ? beforeState.slice(0, -1).join(", ") : "";
        city =
          beforeState.length > 0
            ? beforeState[beforeState.length - 1]
            : afterState[0] || "";
        state = matchedStateData.label;
      } else {
        // No state found, use original logic
        street = parts.slice(0, -2).join(", ");
        city = parts[parts.length - 2];
        state = parts[parts.length - 1];
      }
    }

    const result = {
      street: street || "",
      city: city || "",
      state: state || "",
      pincode: pincode || "",
    };

    console.log("Final parsed address result:", result);
    return result;
  };

  // Populate form data when profile is loaded
  useEffect(() => {
    console.log("Profile data received:", profile);

    if (profile) {
      console.log("Profile address fields:", {
        address: profile.address,
        street: profile.street,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
      });

      // Use separate address fields if available, otherwise fall back to parsing
      let addressComponents;
      if (profile.street || profile.city || profile.state || profile.pincode) {
        // Use the separate fields directly
        addressComponents = {
          street: profile.street || "",
          city: profile.city || "",
          state: profile.state || "",
          pincode: profile.pincode || "",
        };
        console.log("Using separate address fields:", addressComponents);
      } else {
        // Fall back to parsing the combined address for backward compatibility
        addressComponents = profile.address
          ? parseAddress(profile.address)
          : { street: "", city: "", state: "", pincode: "" };
        console.log(
          "Parsed address components from combined field:",
          addressComponents
        );
      }

      // Validate that the state matches one of our dropdown options
      if (addressComponents.state) {
        const matchingState = indianStates.find(
          (s) => s.label.toLowerCase() === addressComponents.state.toLowerCase()
        );
        console.log("Matching state found in dropdown:", matchingState);
        if (!matchingState) {
          console.warn(
            "State doesn't match any dropdown option:",
            addressComponents.state
          );
        }
      }

      // Check for profile image from multiple sources
      const profileImage =
        profile.profilePictureUrl || // From student profile API
        user?.profileImage || // From auth store meta
        user?.meta?.profileImage || // From auth store meta (alternative)
        "";

      console.log("Profile image sources:", {
        profilePictureUrl: profile.profilePictureUrl,
        userProfileImage: user?.profileImage,
        userMetaProfileImage: user?.meta?.profileImage,
        finalProfileImage: profileImage,
      });

      const newUserData = {
        name: profile.fullName || "",
        email: profile.email || "",
        caLevel: profile.caLevel || "FOUNDATION",
        phone: profile.mobile || profile.phone || "",
        city: addressComponents.city || "",
        state: addressComponents.state || "",
        country: "India",
        street: addressComponents.street || "",
        pincode: addressComponents.pincode || "",
        profileImage,
      };

      console.log("Setting userData to:", newUserData);
      console.log("State being set:", newUserData.state);
      setUserData(newUserData);
    }
  }, [profile, user]); // Add user to dependencies to react to auth store changes

  // Debug effect to monitor userData changes
  useEffect(() => {
    console.log("userData changed:", userData);
    console.log("Current state value:", userData.state);
    if (userData.state) {
      const stateExists = indianStates.find((s) => s.label === userData.state);
      console.log(
        "State exists in dropdown options:",
        !!stateExists,
        stateExists
      );
    }
  }, [userData]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Construct address more carefully to avoid empty parts for backward compatibility
    const addressComponents = [];

    // Add street if it exists
    if (userData.street?.trim()) {
      addressComponents.push(userData.street.trim());
    }

    // Add city if it exists
    if (userData.city?.trim()) {
      addressComponents.push(userData.city.trim());
    }

    // Add state if it exists
    if (userData.state?.trim()) {
      addressComponents.push(userData.state.trim());
    }

    // Construct the main address part for backward compatibility
    let fullAddress = "";
    if (addressComponents.length > 0) {
      fullAddress = addressComponents.join(", ");

      // Add pincode with dash if it exists
      if (userData.pincode?.trim()) {
        fullAddress += ` - ${userData.pincode.trim()}`;
      }
    } else if (userData.pincode?.trim()) {
      // If only pincode exists, just use that
      fullAddress = userData.pincode.trim();
    }

    console.log("Address construction:", {
      street: userData.street,
      city: userData.city,
      state: userData.state,
      pincode: userData.pincode,
      addressComponents,
      fullAddress,
    });

    try {
      const updatePayload = {
        fullName: userData.name,
        caLevel: userData.caLevel,
        mobile: userData.phone,
        address: fullAddress, // Keep for backward compatibility
        street: userData.street?.trim() || "",
        city: userData.city?.trim() || "",
        state: userData.state?.trim() || "",
        pincode: userData.pincode?.trim() || "",
      };

      console.log("Sending update payload:", updatePayload);

      await updateProfileMutation.mutateAsync(updatePayload);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (err) {
      console.error("Profile update error:", err);
      toast({
        title: "Update failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setUserData((prev) => ({
      ...prev,
      [name]: value,
      // Reset city when state changes
      ...(name === "state" && { city: "" }),
    }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isValidImageFile(file)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid image file (JPEG, PNG, GIF, WebP).",
        variant: "destructive",
      });
      return;
    }

    // Check initial file size
    const profileConfig = UPLOAD_CONFIGS.PROFILE_PICTURE;
    if (file.size > profileConfig.maxSizeInBytes) {
      toast({
        title: "File Too Large",
        description: `File size (${formatFileSize(file.size)}) exceeds ${profileConfig.maxSizeInMB
          }MB limit. It will be compressed automatically.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Compress the image to fit backend size limit (400KB for safety with 500KB backend limit)
      const compressedFile = await compressImage(file, {
        maxSizeKB: 400, // Backend limit is 500KB, use 400KB for safety margin
        maxWidth: 600, // Better quality for profile pictures with higher limit
        maxHeight: 600,
        quality: 0.85, // Higher quality since we have more space
        format: "jpeg",
      });

      console.log(`Original size: ${formatFileSize(file.size)}`);
      console.log(`Compressed size: ${formatFileSize(compressedFile.size)}`);

      // Upload the compressed file directly using the student API
      try {
        const result = await uploadProfilePictureMutation.mutateAsync(
          compressedFile
        );

        // Update local state immediately
        setUserData((prev) => ({
          ...prev,
          profileImage: result.profilePictureUrl,
        }));

        toast({
          title: "Photo Updated",
          description: `Your profile photo has been updated successfully. (${formatFileSize(
            compressedFile.size
          )})`,
        });
      } catch (error) {
        console.error("Profile image upload error:", error);
        toast({
          title: "Photo Upload Failed",
          description: "We could not save your photo. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Image compression error:", error);
      toast({
        title: "Compression Failed",
        description:
          "Could not process the image. Please try a different file.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Helper function to format member since date
  const formatMemberSince = (createdAt: string | Date | undefined) => {
    return formatMonthYear(createdAt || "");
  };

  // City is free-text to allow localities like "Vijay Nagar" not present in the dataset

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role="student" />
      <MobileSidebar
        role="student"
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
              <h1 className="text-2xl font-bold text-gray-800">
                Profile Settings
              </h1>
            </div>
          </div>
        </header>

        <main className="p-6">
          {profileError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">
                Failed to load profile data. Please refresh the page to try
                again.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={userData.name}
                            onChange={handleProfileChange}
                            className="w-full pl-10 p-2 border rounded"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={userData.email}
                            onChange={handleProfileChange}
                            className="w-full pl-10 p-2 border rounded bg-gray-100"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="caLevel"
                          className="text-sm font-medium"
                        >
                          CA Level
                        </label>
                        <Select
                          value={userData.caLevel}
                          onValueChange={(value) =>
                            handleSelectChange("caLevel", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FOUNDATION">
                              Foundation
                            </SelectItem>
                            <SelectItem value="INTERMEDIATE">
                              Intermediate
                            </SelectItem>
                            <SelectItem value="FINAL">Final</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">
                          Phone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={userData.phone}
                          onChange={handleProfileChange}
                          className="w-full p-2 border rounded"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="country"
                          className="text-sm font-medium"
                        >
                          Country
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            id="country"
                            name="country"
                            value={userData.country}
                            className="w-full pl-10 p-2 border rounded bg-gray-100"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="state" className="text-sm font-medium">
                          State
                        </label>
                        <Select
                          value={userData.state}
                          onValueChange={(value) => {
                            console.log(
                              "State select value changed to:",
                              value
                            );
                            handleSelectChange("state", value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent>
                            {indianStates.map((state) => (
                              <SelectItem key={state.value} value={state.label}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label htmlFor="city" className="text-sm font-medium">
                          City
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={userData.city}
                          onChange={handleProfileChange}
                          placeholder="Enter your city"
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="street" className="text-sm font-medium">
                          Street/House Number
                        </label>
                        <input
                          type="text"
                          id="street"
                          name="street"
                          value={userData.street}
                          onChange={handleProfileChange}
                          className="w-full p-2 border rounded"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="pincode"
                          className="text-sm font-medium"
                        >
                          Pincode
                        </label>
                        <input
                          type="text"
                          id="pincode"
                          name="pincode"
                          maxLength={6}
                          value={userData.pincode}
                          onChange={handleProfileChange}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="flex items-center"
                      disabled={updateProfileMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {updateProfileMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Profile Photo and Account Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Profile Photo</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    <img
                      src={userData.profileImage || "/placeholder.svg"}
                      alt={userData.name}
                      className="w-full h-full rounded-full object-cover border-2 border-ca-primary"
                    />
                    <button
                      onClick={triggerFileInput}
                      disabled={
                        isUploadingImage ||
                        uploadProfilePictureMutation.isPending
                      }
                      className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isUploadingImage ||
                        uploadProfilePictureMutation.isPending ? (
                        <Loader2 className="text-white h-6 w-6 animate-spin" />
                      ) : (
                        <Camera className="text-white h-6 w-6" />
                      )}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerFileInput}
                    disabled={
                      isUploadingImage || uploadProfilePictureMutation.isPending
                    }
                  >
                    {isUploadingImage ||
                      uploadProfilePictureMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isUploadingImage ? "Compressing..." : "Uploading..."}
                      </>
                    ) : (
                      "Upload New Photo"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Account Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Account Type</p>
                      <p className="font-medium">Student</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">CA Level</p>
                      <p className="font-medium">
                        {profile?.caLevel || userData.caLevel}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium">
                        {formatMemberSince(profile?.createdAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Tests Completed</p>
                      <p className="font-medium">
                        {profile?.stats?.completedTests || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
