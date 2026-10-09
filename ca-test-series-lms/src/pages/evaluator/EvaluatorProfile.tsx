import React, { useState } from "react";
import { Menu, Upload, User, Mail, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/utils/dateUtils";
import {
  useEvaluatorProfile,
  useUpdateEvaluatorProfile,
  useUploadEvaluatorProfilePicture,
} from "@/lib/api/hooks";
import { compressImage, isValidImage } from "@/utils/imageUtils";

const EvaluatorProfile = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useEvaluatorProfile();

  const updateProfileMutation = useUpdateEvaluatorProfile();
  const uploadPictureMutation = useUploadEvaluatorProfilePicture();

  // Local state for editing (would be managed by a form library in production)
  const [editData, setEditData] = useState({
    fullName: "",
    phone: "",
    experience: "",
    bio: "",
    imageUrl: "",
  });

  // Initialize edit data when profile loads
  React.useEffect(() => {
    if (profileData && !isEditing) {
      setEditData({
        fullName: profileData.fullName || "",
        phone: profileData.phone || "",
        experience: profileData.experience || "",
        bio: profileData.bio || "",
        imageUrl: profileData.profilePictureUrl || "",
      });
    }
  }, [profileData, isEditing]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImage(file)) {
      toast({
        title: "Invalid File",
        description:
          "Please select a valid image file (JPEG, PNG, GIF, or WebP).",
        variant: "destructive",
      });
      return;
    }

    try {
      // Compress image to under 300KB
      const compressedFile = await compressImage(file, 300, 0.9);

      await uploadPictureMutation.mutateAsync(compressedFile);

      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        fullName: editData.fullName.trim(),
        phone: editData.phone.trim() || undefined,
        experience: editData.experience.trim() || undefined,
        bio: editData.bio.trim() || undefined,
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="evaluator" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar role="evaluator" />
        <div className="flex-1 p-6">
          <Alert className="max-w-md mx-auto mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load profile data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

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
              <h1 className="text-2xl font-bold text-gray-800">
                Evaluator Profile
              </h1>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                className="mr-2"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
              {isEditing && (
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-48 w-48">
                      <AvatarImage
                        src={
                          profileData.profilePictureUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            profileData.fullName
                          )}&size=192`
                        }
                        alt={profileData.fullName}
                      />
                      <AvatarFallback>
                        {profileData.fullName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <div className="absolute bottom-2 right-2">
                        <Label
                          htmlFor="picture"
                          className="bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 flex items-center justify-center"
                        >
                          {uploadPictureMutation.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Label>
                        <Input
                          id="picture"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadPictureMutation.isPending}
                        />
                      </div>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="text-center">
                      <h2 className="text-2xl font-bold">
                        {profileData.fullName}
                      </h2>
                      <p className="text-gray-500">
                        {profileData.caLevel} -{" "}
                        {profileData.specializations?.join(", ")}
                      </p>
                      <p
                        className={`text-sm mt-2 ${
                          profileData.isActive
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {profileData.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="fullName"
                        value={editData.fullName}
                        onChange={handleInputChange}
                      />
                      <div className="text-sm text-gray-500 mt-2">
                        <p>CA Level: {profileData.caLevel}</p>
                        <p>
                          Specializations:{" "}
                          {profileData.specializations?.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">
                      Contact Information
                    </h3>
                    {!isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 mr-2 text-gray-500" />
                          <span>{profileData.email}</span>
                        </div>
                        <div className="flex items-center">
                          <User className="h-5 w-5 mr-2 text-gray-500" />
                          <span>
                            {profileData.phone || "Phone not provided"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="h-5 w-5 mr-2 text-gray-500" />
                          <span>
                            Experience:{" "}
                            {profileData.experience || "Not specified"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            value={profileData.email}
                            disabled
                          />
                          <p className="text-xs text-gray-500">
                            Email cannot be changed
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={editData.phone}
                            onChange={handleInputChange}
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="experience">
                            Years of Experience
                          </Label>
                          <Input
                            id="experience"
                            name="experience"
                            value={editData.experience}
                            onChange={handleInputChange}
                            placeholder="e.g., 5 years"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">About</h3>
                    {!isEditing ? (
                      <p className="text-gray-700">
                        {profileData.bio ||
                          'No bio provided. Click "Edit Profile" to add your professional bio.'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="bio">Professional Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={editData.bio}
                          onChange={handleInputChange}
                          className="min-h-[150px]"
                          placeholder="Tell us about your professional background, expertise, and teaching experience..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">
                      Evaluation Statistics
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-gray-50">
                        <CardContent className="p-4 text-center">
                          <p className="text-gray-500 text-sm">
                            Total Assigned
                          </p>
                          <p className="text-2xl font-bold">
                            {profileData.stats.assigned}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50">
                        <CardContent className="p-4 text-center">
                          <p className="text-gray-500 text-sm">Pending</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {profileData.stats.pending}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50">
                        <CardContent className="p-4 text-center">
                          <p className="text-gray-500 text-sm">In Progress</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {profileData.stats.inProgress}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50">
                        <CardContent className="p-4 text-center">
                          <p className="text-gray-500 text-sm">Completed</p>
                          <p className="text-2xl font-bold text-green-600">
                            {profileData.stats.completed}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">
                      Account Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Member Since</p>
                        <p>
                          {formatDate(profileData.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email Verified</p>
                        <p
                          className={
                            profileData.emailVerified
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {profileData.emailVerified
                            ? "Verified"
                            : "Not Verified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default EvaluatorProfile;
