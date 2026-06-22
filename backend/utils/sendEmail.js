const nodemailer = require("nodemailer");

// Reusable HTML email template
function createEmailTemplate({ title, content, status }) {
  // Determine status badge color
  let badgeColor = "#ff9933"; // Saffron for default/assigned
  if (status === "Approved" || status === "Resolved") {
    badgeColor = "#138808"; // Green
  } else if (status === "Complaint Submitted" || status === "Assigned") {
    badgeColor = "#ff9933"; // Saffron
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: #f5f5f5;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header-gradient {
          background: linear-gradient(to right, #ff9933 0%, #ffffff 40%, #ffffff 60%, #138808 100%);
          padding: 25px 20px;
          text-align: center;
        }
        .header-title {
          color: white;
          font-size: 32px;
          font-weight: bold;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          margin: 0;
          letter-spacing: 1px;
        }
        .content-wrapper {
          padding: 30px;
        }
        .content-text {
          color: #333333;
          font-size: 16px;
          line-height: 1.6;
        }
        .status-badge {
          display: inline-block;
          padding: 10px 24px;
          border-radius: 25px;
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        .status-container {
          text-align: center;
          margin-bottom: 30px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header-gradient">
          <h1 class="header-title">URBANRESOLVE</h1>
        </div>
        <div class="content-wrapper">
          ${status ? `<div class="status-container"><span class="status-badge" style="background-color: ${badgeColor};">${status}</span></div>` : ''}
          ${content}
        </div>
        <div class="footer">
          <p>© 2026 URBANRESOLVE. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendEmail(options) {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: "Urban Resolve <adityak14856@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.text || options.message, // Fallback to plain text
    html: options.html,
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
}

async function sendCitizenAccountApprovedEmail(citizen) {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Hello ${citizen.name},</h2>
    <p class="content-text">Great news! Your Urban Resolve citizen account has been approved!</p>
    <p class="content-text">You can now log in and raise complaints.</p>
    <p class="content-text">Best regards,<br>Urban Resolve Team</p>
  `;

  await sendEmail({
    email: citizen.email,
    subject: "Urban Resolve - Your Account is Approved!",
    text: `Hello ${citizen.name},\n\nGreat news! Your Urban Resolve citizen account has been approved! You can now log in and raise complaints.\n\nBest regards,\nUrban Resolve Team`,
    html: createEmailTemplate({
      title: "Account Approved",
      content,
      status: "Approved"
    }),
  });
}

async function sendStaffAccountApprovedEmail(staff) {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Hello ${staff.name},</h2>
    <p class="content-text">Great news! Your Urban Resolve staff account has been approved!</p>
    <p class="content-text">You can now log in and manage complaints.</p>
    <p class="content-text"><strong>Designation:</strong> ${staff.designation || "Not specified"}</p>
    <p class="content-text"><strong>Assigned Cities:</strong> ${staff.assignedCities?.join(", ") || "Not specified"}</p>
    <p class="content-text">Best regards,<br>Urban Resolve Team</p>
  `;

  await sendEmail({
    email: staff.email,
    subject: "Urban Resolve - Your Staff Account is Approved!",
    text: `Hello ${staff.name},\n\nGreat news! Your Urban Resolve staff account has been approved! You can now log in and manage complaints.\n\nDesignation: ${staff.designation || "Not specified"}\nAssigned Cities: ${staff.assignedCities?.join(", ") || "Not specified"}\n\nBest regards,\nUrban Resolve Team`,
    html: createEmailTemplate({
      title: "Staff Account Approved",
      content,
      status: "Approved"
    }),
  });
}

async function sendComplaintRaisedEmail(complaint, citizen) {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Hello ${citizen.name},</h2>
    <p class="content-text">Your complaint has been registered successfully!</p>
    <div style="margin-top: 20px; padding: 18px; background-color: #f8f9fa; border-radius: 8px;">
      <p style="margin: 10px 0;"><strong>Complaint ID:</strong> ${complaint._id}</p>
      <p style="margin: 10px 0;"><strong>Complaint category:</strong> ${complaint.category}</p>
      <p style="margin: 10px 0;"><strong>Location:</strong> ${complaint.location?.city || "Not specified"}, ${complaint.location?.district || "Not specified"}</p>
      <p style="margin: 10px 0;"><strong>Address:</strong> ${complaint.location?.address || complaint.address || "Not specified"}</p>
      <p style="margin: 10px 0;"><strong>Description:</strong> ${complaint.description}</p>
    </div>
    <p class="content-text" style="margin-top: 25px;">If you did not raise this complaint, please contact support.</p>
    <p class="content-text">Best regards,<br>Urban Resolve Team</p>
  `;

  await sendEmail({
    email: citizen.email,
    subject: "Urban Resolve - Your Complaint is Raised!",
    text: `Hello ${citizen.name},\n\nYour complaint has been registered successfully!\n\nComplaint Details:\n- Complaint ID: ${complaint._id}\n- Category: ${complaint.category}\n- Description: ${complaint.description}\n- Location: ${complaint.location?.address || "Not specified"}\n\nWe will keep you updated on the progress.\n\nBest regards,\nUrban Resolve Team`,
    html: createEmailTemplate({
      title: "Complaint Raised",
      content,
      status: "Complaint Submitted"
    }),
  });
}

async function sendComplaintAssignedEmail(complaint, staff, citizen) {
  // Send email to staff
  const staffContent = `
    <h2 style="color: #333333; margin-top: 0;">Hello ${staff.name},</h2>
    <p class="content-text">A new complaint has been assigned to you!</p>
    <div style="margin-top: 20px; padding: 18px; background-color: #f8f9fa; border-radius: 8px;">
      <p style="margin: 10px 0;"><strong>Complaint ID:</strong> ${complaint._id}</p>
      <p style="margin: 10px 0;"><strong>Complaint category:</strong> ${complaint.category}</p>
      <p style="margin: 10px 0;"><strong>Location:</strong> ${complaint.location?.city || "Not specified"}, ${complaint.location?.district || "Not specified"}</p>
      <p style="margin: 10px 0;"><strong>Address:</strong> ${complaint.location?.address || complaint.address || "Not specified"}</p>
      <p style="margin: 10px 0;"><strong>Description:</strong> ${complaint.description}</p>
      <p style="margin: 10px 0;"><strong>Citizen:</strong> ${citizen.name}</p>
    </div>
    <p class="content-text">Please resolve the complaint at the earliest.</p>
    <p class="content-text">Best regards,<br>Urban Resolve Team</p>
  `;

  await sendEmail({
    email: staff.email,
    subject: "Urban Resolve - New Complaint Assigned!",
    text: `Hello ${staff.name},\n\nA new complaint has been assigned to you!\n\nComplaint Details:\n- Complaint ID: ${complaint._id}\n- Category: ${complaint.category}\n- Description: ${complaint.description}\n- Location: ${complaint.location?.address || "Not specified"}\n- Citizen: ${citizen.name}\n\nPlease resolve the complaint at the earliest.\n\nBest regards,\nUrban Resolve Team`,
    html: createEmailTemplate({
      title: "New Complaint Assigned",
      content: staffContent,
      status: "Assigned"
    }),
  });

  // Send email to citizen
  const citizenContent = `
    <h2 style="color: #333333; margin-top: 0;">Hello ${citizen.name},</h2>
    <p class="content-text">Your complaint has been assigned to a staff member for resolution!</p>
    <div style="margin-top: 20px; padding: 18px; background-color: #f8f9fa; border-radius: 8px;">
      <p style="margin: 10px 0;"><strong>Complaint ID:</strong> ${complaint._id}</p>
      <p style="margin: 10px 0;"><strong>Complaint category:</strong> ${complaint.category}</p>
    </div>
    <p class="content-text">We will notify you when the complaint is resolved.</p>
    <p class="content-text">Best regards,<br>Urban Resolve Team</p>
  `;

  await sendEmail({
    email: citizen.email,
    subject: "Urban Resolve - Complaint Assigned!",
    text: `Hello ${citizen.name},\n\nYour complaint has been assigned to a staff member for resolution!\n\nComplaint Details:\n- Complaint ID: ${complaint._id}\n- Category: ${complaint.category}\n\nWe will notify you when the complaint is resolved.\n\nBest regards,\nUrban Resolve Team`,
    html: createEmailTemplate({
      title: "Complaint Assigned",
      content: citizenContent,
      status: "Assigned"
    }),
  });
}

async function sendComplaintResolvedEmail(complaint, citizen) {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Hello ${citizen.name},</h2>
    <p class="content-text">Great news! Your complaint has been resolved!</p>
    <div style="margin-top: 20px; padding: 18px; background-color: #f8f9fa; border-radius: 8px;">
      <p style="margin: 10px 0;"><strong>Complaint ID:</strong> ${complaint._id}</p>
      <p style="margin: 10px 0;"><strong>Complaint category:</strong> ${complaint.category}</p>
      <p style="margin: 10px 0;"><strong>Resolved At:</strong> ${new Date().toLocaleString()}</p>
    </div>
    <p class="content-text">Thank you for using Urban Resolve!</p>
    <p class="content-text">Best regards,<br>Urban Resolve Team</p>
  `;

  await sendEmail({
    email: citizen.email,
    subject: "Urban Resolve - Complaint Resolved!",
    text: `Hello ${citizen.name},\n\nGreat news! Your complaint has been resolved!\n\nComplaint Details:\n- Complaint ID: ${complaint._id}\n- Category: ${complaint.category}\n- Resolved At: ${new Date().toLocaleString()}\n\nThank you for using Urban Resolve!\n\nBest regards,\nUrban Resolve Team`,
    html: createEmailTemplate({
      title: "Complaint Resolved",
      content,
      status: "Resolved"
    }),
  });
}

async function sendPasswordResetEmail(email, otp) {
  const content = `
    <h2 style="color: #333333; margin-top: 0;">Hello,</h2>
    <p class="content-text">Your OTP for resetting your Urban Resolve password is:</p>
    <p style="font-size: 36px; font-weight: bold; color: #138808; text-align: center; margin: 25px 0; letter-spacing: 6px;">${otp}</p>
    <p class="content-text">This OTP is valid for 10 minutes only.</p>
    <p class="content-text">Best regards,<br>Urban Resolve Team</p>
  `;

  await sendEmail({
    email,
    subject: "Urban Resolve - Password Reset OTP",
    text: `Your OTP for resetting your Urban Resolve password is: ${otp}\n\nThis OTP is valid for 10 minutes only.\n\nBest regards,\nUrban Resolve Team`,
    html: createEmailTemplate({
      title: "Password Reset OTP",
      content,
    }),
  });
}

module.exports = {
  sendEmail,
  sendCitizenAccountApprovedEmail,
  sendStaffAccountApprovedEmail,
  sendComplaintRaisedEmail,
  sendComplaintAssignedEmail,
  sendComplaintResolvedEmail,
  sendPasswordResetEmail,
};
