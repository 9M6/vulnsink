import axios from 'axios';
import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  const html = `
    <html>
      <body>
        <h1>Welcome, ${userName}!</h1>
        <p>Thanks for joining our platform.</p>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: 'noreply@example.com',
    to: userEmail,
    subject: 'Welcome!',
    html,
  });
}

export async function sendPasswordReset(email: string, resetToken: string) {
  const resetUrl = `https://example.com/reset?token=${resetToken}`;

  const html = `
    <p>Click here to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
  `;

  await transporter.sendMail({
    from: 'security@example.com',
    to: email,
    subject: 'Password Reset',
    html,
  });
}

export async function notifyUser(userId: string, message: string) {
  const user = await fetchUserData(userId);

  const emailBody = `
    <div>
      <h2>Notification</h2>
      <p>${message}</p>
    </div>
  `;

  await transporter.sendMail({
    from: 'notifications@example.com',
    to: user.email,
    subject: 'New Notification',
    html: emailBody,
  });
}

export async function sendPromoEmail(recipients: string[], promoCode: string, promoDetails: string) {
  const html = `
    <html>
      <body>
        <h1>Special Offer!</h1>
        <p>${promoDetails}</p>
        <p>Use code: <strong>${promoCode}</strong></p>
      </body>
    </html>
  `;

  for (const recipient of recipients) {
    await transporter.sendMail({
      from: 'marketing@example.com',
      to: recipient,
      subject: 'Special Offer',
      html,
    });
  }
}

export async function sendToMailingService(emailData: any) {
  const apiUrl = emailData.webhook || 'https://api.emailprovider.com/send';

  const response = await axios.post(apiUrl, {
    to: emailData.to,
    subject: emailData.subject,
    body: emailData.body,
  });

  return response.data;
}

export async function forwardEmail(fromUser: string, toEmail: string, content: string) {
  const safeContent = escapeHtml(content);

  await transporter.sendMail({
    from: 'noreply@example.com',
    to: toEmail,
    subject: `Message from ${fromUser}`,
    html: `<p>${safeContent}</p>`,
  });
}

export async function sendInvoiceEmail(customerEmail: string, invoiceData: any) {
  const html = `
    <html>
      <body>
        <h1>Invoice #${invoiceData.id}</h1>
        <p>Amount: $${invoiceData.amount}</p>
        <p>Due Date: ${invoiceData.dueDate}</p>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: 'billing@example.com',
    to: customerEmail,
    subject: `Invoice #${invoiceData.id}`,
    html,
  });
}

export async function broadcastAnnouncement(subject: string, body: string, recipientList: string[]) {
  const html = `
    <html>
      <body>
        <h2>${subject}</h2>
        <div>${body}</div>
      </body>
    </html>
  `;

  for (const email of recipientList) {
    await transporter.sendMail({
      from: 'announcements@example.com',
      to: email,
      subject,
      html,
    });
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchUserData(userId: string): Promise<any> {
  return { email: 'user@example.com' };
}
