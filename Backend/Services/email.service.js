


// import sgMail from '@sendgrid/mail';
// import path from 'path';
// import fs from 'fs';

// // Initialize SendGrid

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// export async function sendStoryEmail(customerEmail, childName, bookId) {
//   const pdfPath = path.join("output", `${bookId}.pdf`);

//   try {
//     // 1. Convert PDF to Base64 (Mandatory for API)
//     const attachmentData = fs.readFileSync(pdfPath).toString("base64");

//     const msg = {
//       to: customerEmail,
//       from: 'rohitjagawat45@gmail.com', // Must be the email you verified in Step 3
//       subject: `✨ Your Magical Storybook for ${childName} is ready!`,
//       html: `<strong>Hi!</strong><br><br>Your custom storybook for ${childName} is attached as a PDF.`,
//       attachments: [
//         {
//           content: attachmentData,
//           filename: `${childName}_Storybook.pdf`,
//           type: 'application/pdf', 
//           disposition: 'attachment',
//         },
//       ],
//     };

//     console.log(`📨 Sending PDF via SendGrid to ${customerEmail}...`);
//     await sgMail.send(msg);
//     console.log("✅ SUCCESS: Email delivered!");
//     return true;
//   } catch (error) {
//     console.error("❌ SendGrid Failed:", error.message);
//     return false;
//   }
// }



import postmark from "postmark";
import path from "path";
import fs from "fs";

const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN);

export async function sendStoryEmail(customerEmail, childName, bookId) {
  const pdfPath = path.join("output", `${bookId}.pdf`);

  try {
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`File not found: ${pdfPath}`);
    }

    const pdfBase64 = fs.readFileSync(pdfPath).toString("base64");

    console.log(`📨 Sending storybook to ${customerEmail}...`);

    await client.sendEmail({
      "From": "team@bluqq.com", // MUST match your screenshot exactly
      "To": customerEmail,
      "Subject": `✨ Your Magical Storybook for ${childName} is ready!`,
      "HtmlBody": `<strong>Hi!</strong><br><br>The custom storybook for <strong>${childName}</strong> is attached.`,
      "Attachments": [
        {
          "Name": `${childName}_Storybook.pdf`,
          "Content": pdfBase64,
          "ContentType": "application/pdf"
        }
      ]
    });

    console.log("✅ SUCCESS: PDF delivered!");
    return true;
  } catch (error) {
    console.error("❌ Postmark Error:", error.message);
    return false;
  }
}