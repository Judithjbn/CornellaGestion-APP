import nodemailer from 'nodemailer';
import { FormField } from '@shared/schema';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'sitetive@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

export async function sendFormSubmissionEmail(formTitle: string, formData: Record<string, any>, formFields: FormField[]) {
  try {
    const emailContent = formFields
      .map(field => {
        const value = formData[field.id];
        return `${field.label}: ${value}`;
      })
      .join('\n');

    const mailOptions = {
      from: '"Formularios Sitetive" <sitetive@gmail.com>',
      to: 'sitetive@gmail.com',
      subject: formTitle,
      text: `Se ha recibido un nuevo envío del formulario "${formTitle}":\n\n${emailContent}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}