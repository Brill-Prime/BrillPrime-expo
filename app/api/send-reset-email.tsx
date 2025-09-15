
// Email service for sending password reset emails
// This would typically be implemented on your backend server

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export async function sendResetEmail(emailData: EmailData) {
  try {
    // Replace with your preferred email service
    // Examples: SendGrid, AWS SES, Nodemailer, etc.
    
    // Example using SendGrid API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: emailData.to }],
            subject: emailData.subject,
          }
        ],
        from: { email: 'noreply@brillprime.com', name: 'BrillPrime' },
        content: [
          {
            type: 'text/html',
            value: emailData.html,
          }
        ],
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      throw new Error('Failed to send email');
    }
    
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

// Alternative: Using EmailJS for client-side email sending
export async function sendEmailViaEmailJS(emailData: EmailData) {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_USER_ID,
        template_params: {
          to_email: emailData.to,
          subject: emailData.subject,
          html_content: emailData.html,
        },
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      throw new Error('Failed to send email via EmailJS');
    }
  } catch (error) {
    console.error('EmailJS error:', error);
    return { success: false, error: error.message };
  }
}
