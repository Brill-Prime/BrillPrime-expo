import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BiometricAuth } from "@/components/ui/biometric-auth";
import { NotificationModal } from "@/components/ui/notification-modal";
import congratulationsIcon from "../assets/images/congratulations_icon.png";
import confirmationFailImg from "../assets/images/confirmation_fail_img.png";

export default function BiometricSetup() {
  const [, setLocation] = useLocation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [biometricType, setBiometricType] = useState<string>("");

  const handleBiometricSuccess = (type: 'fingerprint' | 'face') => {
    setBiometricType(type === 'fingerprint' ? 'Fingerprint' : 'Face ID');
    setShowSuccessModal(true);
  };

  const handleBiometricError = (error: string) => {
    setErrorMessage(error);
    setShowErrorModal(true);
  };

  const handleSkipBiometric = () => {
    setLocation("/dashboard");
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setLocation("/dashboard");
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 pt-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/profile")}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--brill-text)]" />
        </Button>
        <h1 className="text-lg font-bold text-[var(--brill-text)]">
          Biometric Setup
        </h1>
        <div className="w-9"></div>
      </div>

      {/* Biometric Authentication Component */}
      <div className="px-6 py-8">
        <BiometricAuth
          onSuccess={handleBiometricSuccess}
          onError={handleBiometricError}
          onCancel={handleSkipBiometric}
        />
      </div>

      {/* Success Modal */}
      <NotificationModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        type="success"
        title="Biometric Setup Complete!"
        message={`${biometricType} authentication has been successfully enabled for your account. You can now use it to sign in quickly and securely.`}
        imageSrc={congratulationsIcon}
        buttonText="Continue"
      />

      {/* Error Modal */}
      <NotificationModal
        isOpen={showErrorModal}
        onClose={handleErrorModalClose}
        type="error"
        title="Setup Failed"
        message={errorMessage}
        imageSrc={confirmationFailImg}
        buttonText="Try Again"
      />
    </div>
  );
}