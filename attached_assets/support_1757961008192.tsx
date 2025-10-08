import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { NotificationModal } from "@/components/ui/notification-modal";
import { useAuth } from "@/hooks/use-auth";
import successIcon from "../assets/images/congratulations_icon.png";
import errorIcon from "../assets/images/confirmation_fail_img.png";

interface SupportTicket {
  name: string;
  email: string;
  subject: string;
  message: string;
  userRole?: string;
  userId?: number;
}

export default function Support() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [formData, setFormData] = useState<SupportTicket>({
    name: user?.fullName || "",
    email: user?.email || "",
    subject: "",
    message: ""
  });
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
    icon: successIcon
  });

  // Submit support ticket mutation
  const submitTicketMutation = useMutation({
    mutationFn: async (ticketData: SupportTicket) => {
      return apiRequest("POST", "/api/support/tickets", {
        ...ticketData,
        userRole: user?.role || "GUEST",
        userId: user?.id || null,
        createdAt: new Date().toISOString(),
        status: "OPEN",
        priority: "NORMAL"
      });
    },
    onSuccess: () => {
      setModalConfig({
        type: 'success',
        title: 'Support Ticket Submitted',
        message: 'Your support request has been submitted successfully. Our team will review your ticket and respond within 24 hours.',
        icon: successIcon
      });
      setShowModal(true);
      // Reset form
      setFormData({
        name: user?.fullName || "",
        email: user?.email || "",
        subject: "",
        message: ""
      });
    },
    onError: (error: any) => {
      setModalConfig({
        type: 'error',
        title: 'Submission Failed',
        message: error.message || 'Failed to submit your support ticket. Please try again.',
        icon: errorIcon
      });
      setShowModal(true);
    }
  });

  const handleInputChange = (field: keyof SupportTicket, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setModalConfig({
        type: 'error',
        title: 'Incomplete Form',
        message: 'Please fill in all required fields before submitting your support request.',
        icon: errorIcon
      });
      setShowModal(true);
      return;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setModalConfig({
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
        icon: errorIcon
      });
      setShowModal(true);
      return;
    }

    submitTicketMutation.mutate(formData);
  };

  const handleModalClose = () => {
    setShowModal(false);
    if (modalConfig.type === 'success') {
      // Navigate back to previous page or dashboard
      const userRole = user?.role;
      if (userRole === 'CONSUMER') {
        setLocation('/consumer-home');
      } else if (userRole === 'MERCHANT') {
        setLocation('/dashboard');
      } else if (userRole === 'DRIVER') {
        setLocation('/driver-dashboard');
      } else {
        setLocation('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto px-2 sm:px-4 relative">{/*Responsive container*/}
      {/* Back Arrow */}
      <div className="absolute top-12 left-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="w-6 h-6 p-0 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </Button>
      </div>

      {/* Header */}
      <div className="pt-24 pb-8 text-center">
        <h1 
          className="text-xl font-extrabold mb-2"
          style={{ 
            color: '#000000', 
            fontSize: '20px', 
            fontFamily: 'Montserrat', 
            fontWeight: '800' 
          }}
        >
          Support
        </h1>
      </div>

      {/* Form Container */}
      <div className="px-6 space-y-8">
        {/* Name Field */}
        <div className="space-y-2">
          <Label 
            htmlFor="name"
            className="block text-center font-semibold"
            style={{ 
              color: '#000000', 
              fontSize: '16px', 
              fontFamily: 'Montserrat', 
              fontWeight: '600' 
            }}
          >
            Name
          </Label>
          <div className="relative">
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full h-14 px-5 rounded-[30px] border-0 outline-none text-base font-medium"
              style={{
                outline: '1px #4682B4 solid',
                outlineOffset: '-1px',
                fontFamily: 'Montserrat',
                fontSize: '16px'
              }}
              placeholder=""
            />
            {!formData.name && (
              <div 
                className="absolute left-5 top-4 pointer-events-none"
                style={{ 
                  color: '#B7B7B7', 
                  fontSize: '16px', 
                  fontFamily: 'Montserrat', 
                  fontWeight: '500' 
                }}
              >
                Name
              </div>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label 
            htmlFor="email"
            className="block text-center font-semibold"
            style={{ 
              color: '#000000', 
              fontSize: '16px', 
              fontFamily: 'Montserrat', 
              fontWeight: '600' 
            }}
          >
            Email
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full h-14 px-5 rounded-[30px] border-0 outline-none text-base"
              style={{
                outline: '1px #4682B4 solid',
                outlineOffset: '-1px',
                fontFamily: 'Montserrat',
                fontSize: '16px'
              }}
              placeholder=""
            />
            {!formData.email && (
              <div 
                className="absolute left-5 top-4 pointer-events-none"
                style={{ 
                  color: '#B7B7B7', 
                  fontSize: '16px', 
                  fontFamily: 'Montserrat', 
                  fontWeight: '400' 
                }}
              >
                Email
              </div>
            )}
          </div>
        </div>

        {/* Subject Field */}
        <div className="space-y-2">
          <Label 
            htmlFor="subject"
            className="block text-center font-semibold"
            style={{ 
              color: '#000000', 
              fontSize: '16px', 
              fontFamily: 'Montserrat', 
              fontWeight: '600' 
            }}
          >
            Subject
          </Label>
          <div className="relative">
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="w-full h-14 px-5 rounded-[30px] border-0 outline-none text-base"
              style={{
                outline: '1px #4682B4 solid',
                outlineOffset: '-1px',
                fontFamily: 'Montserrat',
                fontSize: '16px'
              }}
              placeholder=""
            />
            {!formData.subject && (
              <div 
                className="absolute left-5 top-4 pointer-events-none"
                style={{ 
                  color: '#B7B7B7', 
                  fontSize: '16px', 
                  fontFamily: 'Montserrat', 
                  fontWeight: '400' 
                }}
              >
                Subject
              </div>
            )}
          </div>
        </div>

        {/* Message Field */}
        <div className="space-y-2">
          <Label 
            htmlFor="message"
            className="block text-center font-semibold"
            style={{ 
              color: '#000000', 
              fontSize: '16px', 
              fontFamily: 'Montserrat', 
              fontWeight: '600' 
            }}
          >
            Message
          </Label>
          <div className="relative">
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              className="w-full h-44 px-5 py-5 rounded-[30px] border-0 outline-none resize-none text-base"
              style={{
                outline: '1px #4682B4 solid',
                outlineOffset: '-1px',
                fontFamily: 'Montserrat',
                fontSize: '16px'
              }}
              placeholder=""
            />
            {!formData.message && (
              <div 
                className="absolute left-5 top-5 pointer-events-none"
                style={{ 
                  color: '#B7B7B7', 
                  fontSize: '16px', 
                  fontFamily: 'Montserrat', 
                  fontWeight: '400' 
                }}
              >
                Message
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-8 pb-12 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={submitTicketMutation.isPending}
            className="px-14 py-4 rounded-[30px] border-0 text-white text-xl font-medium"
            style={{
              background: '#4682B4',
              fontSize: '22px',
              fontFamily: 'Montserrat',
              fontWeight: '500',
              minWidth: '200px'
            }}
          >
            {submitTicketMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>

      {/* Notification Modal */}
      {showModal && (
        <NotificationModal
          isOpen={showModal}
          onClose={handleModalClose}
          type={modalConfig.type}
          title={modalConfig.title}
          description={modalConfig.message}
        />
      )}
    </div>
  );
}