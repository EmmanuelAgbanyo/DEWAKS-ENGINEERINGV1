import nodemailer from "nodemailer";
import { prisma } from "./prisma";

// Initialize Nodemailer transporter with Gmail
const transporter = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
  : null;

interface NotificationData {
  requestNumber: string;
  amount: number;
  purpose: string;
  requesterName: string;
  status: string;
  reviewerName?: string;
  comment?: string;
}

// Get email recipients based on role
async function getEmailsByRole(role: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { role },
    select: { email: true },
  });
  return users.map((u) => u.email);
}

// Send notification using Nodemailer (Gmail)
export async function sendNotification(to: string, subject: string, html: string) {
  if (!transporter) {
    console.warn(`Email not sent (no Gmail credentials): ${subject} -> ${to}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Dewaks Engineering" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent to ${to}: ${subject}`, info.messageId);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
}

// Notification when a new request is created
export async function notifyNewRequest(data: NotificationData, requesterEmail: string) {
  // Notify admins
  const adminEmails = await getEmailsByRole("ADMIN");
  // Also notify managers
  const managerEmails = await getEmailsByRole("MANAGER");

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #0d9488, #0ea5e9); border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 24px;">📋</span>
          </div>
          <h2 style="color: #0d9488; margin: 0;">New Cash Request Submitted</h2>
        </div>
        <p style="color: #374151; text-align: center;">A new cash request requires your review.</p>
        <div style="background: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d9488;">
          <p style="margin: 8px 0;"><strong>Request #:</strong> ${data.requestNumber}</p>
          <p style="margin: 8px 0;"><strong>Amount:</strong> <span style="color: #0d9488; font-size: 18px; font-weight: bold;">GHS ${data.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</span></p>
          <p style="margin: 8px 0;"><strong>Purpose:</strong> ${data.purpose}</p>
          <p style="margin: 8px 0;"><strong>Requested by:</strong> ${data.requesterName}</p>
        </div>
        <div style="text-align: center; margin-top: 25px;">
          <p style="color: #6b7280; font-size: 14px;">Please login to the Dewaks Engineering Cashflow System to review this request.</p>
        </div>
      </div>
    </div>
  `;

  // Send to all admins
  for (const email of adminEmails) {
    await sendNotification(email, `🔔 [Action Required] New Cash Request #${data.requestNumber}`, html);
  }

  // Send to all managers
  for (const email of managerEmails) {
    await sendNotification(email, `🔔 [New Request] Cash Request #${data.requestNumber} - GHS ${data.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`, html);
  }

  // Confirm to requester
  const confirmHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #0d9488, #0ea5e9); border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 24px;">✅</span>
          </div>
          <h2 style="color: #0d9488; margin: 0;">Cash Request Submitted</h2>
        </div>
        <p style="color: #374151; text-align: center;">Your cash request has been submitted successfully.</p>
        <div style="background: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d9488;">
          <p style="margin: 8px 0;"><strong>Request #:</strong> ${data.requestNumber}</p>
          <p style="margin: 8px 0;"><strong>Amount:</strong> <span style="color: #0d9488; font-size: 18px; font-weight: bold;">GHS ${data.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</span></p>
          <p style="margin: 8px 0;"><strong>Purpose:</strong> ${data.purpose}</p>
          <p style="margin: 8px 0;"><strong>Status:</strong> <span style="background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 4px;">Pending Admin Review</span></p>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">You will be notified via email when your request is reviewed.</p>
      </div>
    </div>
  `;

  await sendNotification(requesterEmail, `✅ Cash Request #${data.requestNumber} Submitted Successfully`, confirmHtml);
}

// Notification when admin reviews a request
export async function notifyAdminReview(data: NotificationData, requesterEmail: string, approved: boolean) {
  if (approved) {
    // Notify managers for final approval
    const managerEmails = await getEmailsByRole("MANAGER");

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #f97316); border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px;">⏳</span>
            </div>
            <h2 style="color: #f59e0b; margin: 0;">Cash Request Awaiting Your Approval</h2>
          </div>
          <p style="color: #374151; text-align: center;">A cash request has been approved by Admin and requires your final approval.</p>
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 8px 0;"><strong>Request #:</strong> ${data.requestNumber}</p>
            <p style="margin: 8px 0;"><strong>Amount:</strong> <span style="color: #f59e0b; font-size: 18px; font-weight: bold;">GHS ${data.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</span></p>
            <p style="margin: 8px 0;"><strong>Purpose:</strong> ${data.purpose}</p>
            <p style="margin: 8px 0;"><strong>Requested by:</strong> ${data.requesterName}</p>
            <p style="margin: 8px 0;"><strong>Admin Approved by:</strong> ${data.reviewerName}</p>
            ${data.comment ? `<p style="margin: 8px 0;"><strong>Admin Comment:</strong> ${data.comment}</p>` : ""}
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center;">Please login to review and take final action.</p>
        </div>
      </div>
    `;

    for (const email of managerEmails) {
      await sendNotification(email, `⏳ [Final Approval Required] Cash Request #${data.requestNumber} - GHS ${data.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`, html);
    }

    // Notify requester of admin approval
    const requesterHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #0d9488, #0ea5e9); border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px;">👍</span>
            </div>
            <h2 style="color: #0d9488; margin: 0;">Request Approved by Admin</h2>
          </div>
          <p style="color: #374151; text-align: center;">Good news! Your cash request has been approved by Admin and forwarded to Management.</p>
          <div style="background: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d9488;">
            <p style="margin: 8px 0;"><strong>Request #:</strong> ${data.requestNumber}</p>
            <p style="margin: 8px 0;"><strong>Amount:</strong> <span style="color: #0d9488; font-size: 18px; font-weight: bold;">GHS ${data.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</span></p>
            <p style="margin: 8px 0;"><strong>Status:</strong> <span style="background: #fef3c7; color: #d97706; padding: 2px 8px; border-radius: 4px;">Pending Manager Approval</span></p>
            ${data.comment ? `<p style="margin: 8px 0;"><strong>Admin Comment:</strong> ${data.comment}</p>` : ""}
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center;">You will be notified when the Manager reviews your request.</p>
        </div>
      </div>
    `;

    await sendNotification(requesterEmail, `👍 Request #${data.requestNumber} Approved by Admin`, requesterHtml);
  } else {
    // Notify requester of rejection
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #dc2626, #ef4444); border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px;">❌</span>
            </div>
            <h2 style="color: #dc2626; margin: 0;">Cash Request Rejected</h2>
          </div>
          <p style="color: #374151; text-align: center;">Unfortunately, your cash request has been rejected by Admin.</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 8px 0;"><strong>Request #:</strong> ${data.requestNumber}</p>
            <p style="margin: 8px 0;"><strong>Amount:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">GHS ${data.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</span></p>
            <p style="margin: 8px 0;"><strong>Purpose:</strong> ${data.purpose}</p>
            <p style="margin: 8px 0;"><strong>Rejected by:</strong> ${data.reviewerName}</p>
            ${data.comment ? `<p style="margin: 8px 0;"><strong>Reason:</strong> <span style="color: #dc2626;">${data.comment}</span></p>` : ""}
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center;">If you have questions, please contact your administrator.</p>
        </div>
      </div>
    `;

    await sendNotification(requesterEmail, `❌ Request #${data.requestNumber} Rejected by Admin`, html);
  }
}

// Notification when manager reviews a request
export async function notifyManagerReview(data: NotificationData, requesterEmail: string, approved: boolean) {
  if (approved) {
    // Notify requester of final approval
    const requesterHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #059669, #10b981); border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px;">🎉</span>
            </div>
            <h2 style="color: #059669; margin: 0;">Cash Request Approved!</h2>
          </div>
          <p style="color: #374151; text-align: center;">Great news! Your cash request has been <strong>fully approved</strong> by Management.</p>
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <p style="margin: 8px 0;"><strong>Request #:</strong> ${data.requestNumber}</p>
            <p style="margin: 8px 0;"><strong>Amount:</strong> <span style="color: #059669; font-size: 18px; font-weight: bold;">GHS ${data.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</span></p>
            <p style="margin: 8px 0;"><strong>Purpose:</strong> ${data.purpose}</p>
            <p style="margin: 8px 0;"><strong>Final Status:</strong> <span style="background: #d1fae5; color: #059669; padding: 2px 8px; border-radius: 4px; font-weight: bold;">APPROVED</span></p>
            <p style="margin: 8px 0;"><strong>Approved by:</strong> ${data.reviewerName}</p>
            ${data.comment ? `<p style="margin: 8px 0;"><strong>Comment:</strong> ${data.comment}</p>` : ""}
          </div>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; text-align: center;">
            <p style="color: #15803d; margin: 0; font-weight: 500;">💰 Please proceed to collect your funds from the Finance Department.</p>
          </div>
        </div>
      </div>
    `;

    await sendNotification(requesterEmail, `🎉 [APPROVED] Cash Request #${data.requestNumber} - GHS ${data.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`, requesterHtml);

    // Notify admins of the final approval
    const adminEmails = await getEmailsByRole("ADMIN");
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #059669, #10b981); border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px;">✅</span>
            </div>
            <h2 style="color: #059669; margin: 0;">Request Approved by Manager</h2>
          </div>
          <p style="color: #374151; text-align: center;">A cash request has received final approval from Management.</p>
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <p style="margin: 8px 0;"><strong>Request #:</strong> ${data.requestNumber}</p>
            <p style="margin: 8px 0;"><strong>Amount:</strong> <span style="color: #059669; font-size: 18px; font-weight: bold;">GHS ${data.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</span></p>
            <p style="margin: 8px 0;"><strong>Purpose:</strong> ${data.purpose}</p>
            <p style="margin: 8px 0;"><strong>Requested by:</strong> ${data.requesterName}</p>
            <p style="margin: 8px 0;"><strong>Approved by:</strong> ${data.reviewerName}</p>
            ${data.comment ? `<p style="margin: 8px 0;"><strong>Comment:</strong> ${data.comment}</p>` : ""}
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center;">This request is now ready for disbursement.</p>
        </div>
      </div>
    `;

    for (const email of adminEmails) {
      await sendNotification(email, `✅ Request #${data.requestNumber} Approved by Manager`, adminHtml);
    }
  } else {
    // Notify requester of manager rejection
    const requesterHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #dc2626, #ef4444); border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px;">❌</span>
            </div>
            <h2 style="color: #dc2626; margin: 0;">Cash Request Rejected</h2>
          </div>
          <p style="color: #374151; text-align: center;">Unfortunately, your cash request has been rejected by Management.</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 8px 0;"><strong>Request #:</strong> ${data.requestNumber}</p>
            <p style="margin: 8px 0;"><strong>Amount:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">GHS ${data.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</span></p>
            <p style="margin: 8px 0;"><strong>Purpose:</strong> ${data.purpose}</p>
            <p style="margin: 8px 0;"><strong>Rejected by:</strong> ${data.reviewerName}</p>
            ${data.comment ? `<p style="margin: 8px 0;"><strong>Reason:</strong> <span style="color: #dc2626;">${data.comment}</span></p>` : ""}
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center;">If you have questions about this decision, please contact your manager.</p>
        </div>
      </div>
    `;

    await sendNotification(requesterEmail, `❌ Request #${data.requestNumber} Rejected by Manager`, requesterHtml);

    // Notify admins of the manager rejection
    const adminEmails = await getEmailsByRole("ADMIN");
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #dc2626, #ef4444); border-radius: 12px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px;">❌</span>
            </div>
            <h2 style="color: #dc2626; margin: 0;">Request Rejected by Manager</h2>
          </div>
          <p style="color: #374151; text-align: center;">A cash request has been rejected by Management.</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 8px 0;"><strong>Request #:</strong> ${data.requestNumber}</p>
            <p style="margin: 8px 0;"><strong>Amount:</strong> <span style="color: #dc2626; font-size: 18px; font-weight: bold;">GHS ${data.amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</span></p>
            <p style="margin: 8px 0;"><strong>Purpose:</strong> ${data.purpose}</p>
            <p style="margin: 8px 0;"><strong>Requested by:</strong> ${data.requesterName}</p>
            <p style="margin: 8px 0;"><strong>Rejected by:</strong> ${data.reviewerName}</p>
            ${data.comment ? `<p style="margin: 8px 0;"><strong>Reason:</strong> <span style="color: #dc2626;">${data.comment}</span></p>` : ""}
          </div>
        </div>
      </div>
    `;

    for (const email of adminEmails) {
      await sendNotification(email, `❌ Request #${data.requestNumber} Rejected by Manager`, adminHtml);
    }
  }
}
