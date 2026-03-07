
import sgMail from '@sendgrid/mail';
import path from 'path';
import fs from 'fs';

// Initialize SendGrid

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendStoryEmail(customerEmail, childName, bookId) {
  const pdfPath = path.join("output", `${bookId}.pdf`);

  try {
    // 1. Convert PDF to Base64 (Mandatory for API)
    const attachmentData = fs.readFileSync(pdfPath).toString("base64");

    const msg = {
      to: customerEmail,
      from: 'juniorbillionaire@gmail.com', // Must be the email you verified in Step 3
      subject: `✨ Your Magical Storybook for ${childName} is ready!`,
      html: `<strong>Hi!</strong><br><br>Your custom storybook for ${childName} is attached as a PDF.`,
      attachments: [
        {
          content: attachmentData,
          filename: `${childName}_Storybook.pdf`,
          type: 'application/pdf', 
          disposition: 'attachment',
        },
      ],
    };

    console.log(`📨 Sending PDF via SendGrid to ${customerEmail}...`);
    await sgMail.send(msg);
    console.log("✅ SUCCESS: Email delivered!");
    return true;
  } catch (error) {
    console.error("❌ SendGrid Failed:", error.message);
    return false;
  }
}

// import { Resend } from 'resend';
// import path from 'path';
// import fs from 'fs';

// // Initialize Resend
// const resend = new Resend(process.env.RESEND_API_KEY);

// export async function sendStoryEmail(customerEmail, childName, bookId) {
//   const pdfPath = path.join("output", `${bookId}.pdf`);

//   try {
//     // Read the file as a Buffer (Resend handles the encoding for you)
//     const pdfBuffer = fs.readFileSync(pdfPath);

//     const { data, error } = await resend.emails.send({
//       from: 'Storybooks <team@yourdomain.com>', // MUST be your verified domain
//       to: [customerEmail],
//       subject: `✨ Your Magical Storybook for ${childName} is ready!`,
//       html: `<strong>Hi!</strong><br><br>Your custom storybook for <strong>${childName}</strong> is attached as a PDF.`,
//       attachments: [
//         {
//           content: pdfBuffer,
//           filename: `${childName}_Storybook.pdf`,
//         },
//       ],
//     });

//     if (error) {
//       throw new Error(error.message);
//     }

//     console.log(`📨 Sending PDF via Resend to ${customerEmail}...`);
//     console.log("✅ SUCCESS: Email delivered!", data.id);
//     return true;

//   } catch (error) {
//     console.error("❌ Resend Failed:", error.message);
//     return false;
//   }
// }

// // //using  nodemailer 567 port
// // import nodemailer from "nodemailer";
// // import path from "path";
// // import fs from "fs";

// // // ✅ Gmail SMTP via port 587 (works on Railway)
// // const transporter = nodemailer.createTransport({
// //   host: "smtp.gmail.com",
// //   port: 587,
// //   secure: false, // STARTTLS (NOT SSL — Railway blocks 465)
// //   auth: {
// //     user: process.env.GMAIL_USER,       // your Gmail address e.g. yourname@gmail.com
// //     pass: process.env.GMAIL_APP_PASS,   // Gmail App Password (NOT your regular password)
// //   },
// // });

// // export async function sendStoryEmail(customerEmail, childName, bookId) {
// //   const pdfPath = path.join("output", `${bookId}.pdf`);

// //   // ✅ Check PDF exists before sending
// //   if (!fs.existsSync(pdfPath)) {
// //     console.error("❌ PDF not found at:", pdfPath);
// //     return false;
// //   }

// //   try {
// //     const info = await transporter.sendMail({
// //       from: `"Jr. Billionaire 📖" <${process.env.GMAIL_USER}>`,
// //       to: customerEmail,
// //       subject: `✨ Your Magical Storybook for ${childName} is Ready!`,
// //       html: `
// //         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #fff8f8; border-radius: 16px;">
// //           <h1 style="color: #E11D2E;">📖 Your Storybook is Here!</h1>
// //           <p style="font-size: 16px; color: #334155;">Hi there!</p>
// //           <p style="font-size: 16px; color: #334155;">
// //             Your personalized storybook for <strong>${childName}</strong> is ready! 🎉
// //             Find it attached as a PDF below.
// //           </p>
// //           <p style="font-size: 16px; color: #334155;">
// //             We hope <strong>${childName}</strong> loves their magical adventure! ✨
// //           </p>
// //           <br/>
// //           <p style="font-size: 13px; color: #94a3b8;">
// //             — The Jr. Billionaire Team 💛
// //           </p>
// //         </div>
// //       `,
// //       attachments: [
// //         {
// //           filename: `${childName}_Storybook.pdf`,
// //           path: pdfPath,
// //           contentType: "application/pdf",
// //         },
// //       ],
// //     });

// //     console.log(`✅ Email sent to ${customerEmail} | Message ID: ${info.messageId}`);
// //     return true;

// //   } catch (error) {
// //     console.error("❌ Email sending failed:", error.message);
// //     return false;
// //   }
// // }
