import { useState } from "react";
import { ArrowLeft, Save, MapPin, Phone, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { NotificationModal } from "@/components/ui/notification-modal";
import { LoadingButton } from "@/components/ui/loading-button";
import { ImagePicker } from "@/components/ui/image-picker";
import accountCircleIcon from "../assets/images/account_circle.svg";
import cameraIcon from "../assets/images/camera_icon.png";

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  bio: string;
  profilePicture?: File | null;
}

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara"
];

export default function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    country: user?.country || "Nigeria",
    bio: user?.bio || "",
    profilePicture: null,
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      // Simulate API call with profile picture handling
      if (data.profilePicture) {
        // In a real app, you would upload the image to a storage service
        // For now, we'll create a data URL for preview
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onload = () => {
            const imageUrl = reader.result as string;
            setTimeout(() => resolve({ success: true, imageUrl }), 1500);
          };
          reader.readAsDataURL(data.profilePicture);
        });
      } else {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ success: true }), 1500);
        });
      }
    },
    onSuccess: (result: any) => {
      // Update user in auth context with new profile data
      const updatedProfile: any = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        bio: formData.bio,
      };

      if (result.imageUrl) {
        updatedProfile.profilePicture = result.imageUrl;
      }

      updateUser(updatedProfile);
      setShowSuccessModal(true);
    },
    onError: (error: any) => {
      setErrorMessage(error.message || "Failed to update profile. Please try again.");
      setShowErrorModal(true);
    },
  });

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };



  return (
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto min-h-screen bg-white px-2 sm:px-4">{/*Responsive container*/}
      {/* Header */}
      <div className="flex items-center justify-between p-6 pt-12 border-b border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/profile")}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--brill-primary)]" />
        </Button>
        <h1 className="text-lg font-bold text-[var(--brill-primary)]">Edit Profile</h1>
        <div className="w-9"></div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-8">
        {/* Profile Picture */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div 
              className="w-24 h-24 rounded-full mx-auto mb-2 cursor-pointer transition-transform duration-200 hover:scale-105 overflow-hidden bg-gray-100 flex items-center justify-center"
              onClick={() => document.getElementById('profile-image-input')?.click()}
            >
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <img 
                  src={accountCircleIcon} 
                  alt="Default Profile" 
                  className="w-full h-full object-cover"
                />
              )}
              {/* Camera Icon */}
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-[var(--brill-secondary)] rounded-full flex items-center justify-center border-2 border-white shadow-md">
                <img src={cameraIcon} alt="Camera" className="h-3 w-3" />
              </div>
            </div>
            <input
              id="profile-image-input"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData(prev => ({ ...prev, profilePicture: file }));
                }
              }}
              className="hidden"
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="mb-6">
            <div className="text-center mb-2">
              <Label htmlFor="fullName" className="text-[var(--brill-text)] text-lg font-bold">
                Full Name
              </Label>
            </div>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-4 rounded-3xl border-gray-300 focus:ring-2 focus:ring-[var(--brill-primary)] focus:border-[var(--brill-primary)] text-base"
              required
            />
          </div>

          <div className="mb-6">
            <div className="text-center mb-2">
              <Label htmlFor="email" className="text-[var(--brill-text)] text-lg font-bold">
                Email
              </Label>
            </div>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-4 rounded-3xl border-gray-300 focus:ring-2 focus:ring-[var(--brill-primary)] focus:border-[var(--brill-primary)] text-base"
              required
            />
          </div>

          <div className="mb-6">
            <div className="text-center mb-2">
              <Label htmlFor="phone" className="text-[var(--brill-text)] text-lg font-bold">
                Number
              </Label>
            </div>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="+234 801 234 5678"
              className="w-full px-4 py-4 rounded-3xl border-gray-300 focus:ring-2 focus:ring-[var(--brill-primary)] focus:border-[var(--brill-primary)] text-base"
              required
            />
          </div>

          <div className="mb-8">
            <div className="text-center mb-2">
              <Label htmlFor="address" className="text-[var(--brill-text)] text-lg font-bold">
                Location
              </Label>
            </div>
            <Input
              id="address"
              value={`${formData.city}${formData.state ? ', ' + formData.state : ''}`}
              onChange={(e) => {
                const parts = e.target.value.split(',');
                handleInputChange("city", parts[0]?.trim() || '');
                handleInputChange("state", parts[1]?.trim() || '');
              }}
              placeholder="Jahi, Abuja"
              className="w-full px-4 py-4 rounded-3xl border-gray-300 focus:ring-2 focus:ring-[var(--brill-primary)] focus:border-[var(--brill-primary)] text-base"
              required
            />
          </div>


        </div>

        <div className="flex justify-center mb-8">
          <LoadingButton
            type="submit"
            loading={updateProfileMutation.isPending}
            className="w-48 bg-[var(--brill-secondary)] text-white py-4 px-4 rounded-3xl font-medium hover:bg-[var(--brill-active)] transition duration-200 text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </LoadingButton>
        </div>
      </form>

      {/* Success Modal */}
      <NotificationModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="Profile Updated!"
        description="Your profile has been successfully updated."
        actionText="Continue"
        onAction={() => setLocation("/profile")}
      />

      {/* Error Modal */}
      <NotificationModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="Update Failed"
        description={errorMessage}
        actionText="Try Again"
        onAction={() => setShowErrorModal(false)}
      />
    </div>
  );
}