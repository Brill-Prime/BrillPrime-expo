
import { useState } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const toast = ({ title, description, variant = 'default' }: Toast) => {
  console.log(`Toast [${variant}]: ${title}${description ? ` - ${description}` : ''}`);
  
  // Simple browser notification for now
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: description });
  }
};

export const useToast = () => {
  return { toast };
};
