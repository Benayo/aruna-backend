const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config(); // For loading environment variables

// Create an Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use CORS middleware to allow requests from different origins
app.use(cors());

// Serve static files from the "public" directory
app.use(express.static("public"));

// Create a transporter object for Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // Set to true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Define the HTML template for the contact email
const contactEmailTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contact Submission</title>
  <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        color: #333;
      }
      .container {
        width: 100%;
        max-width: 600px;
        margin: 30px auto 0;
        border: 1px solid #ddd;
        border-radius: 5px;
        overflow: hidden;
      }
      .header {
        background-color: #2e2e2e;
        padding: 40px;
        text-align: center;
      }
      .header img {
        max-width: 80px; /* Adjusted size */
        height: auto;
        display: block;
        margin: 0 auto;
      }
      .content {
        padding: 20px;
        background-color: #ffffff;
      }
      .content p {
        line-height: 1.6; /* Increased line height */
      }
      .footer {
        background-color: #2e2e2e;
        padding: 20px 10px;
        text-align: center;
        font-size: 14px;
        color: #fff;
      }
      .footer a {
        color: #347856;
        text-decoration: none;
      }

      @media only screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          max-width: 320px; /* Reduced width for mobile screens */
          margin: 10px auto 0;
        }
        .header,
        .footer {
          padding: 15px !important; /* Adjust padding for mobile */
             font-size: 10px !important;
        }
        .content {
          padding: 15px !important; /* Adjust padding for mobile */
        }
        .header img {
          max-width: 40px !important; /* Adjust logo size for mobile */
        }
        .content p {
          font-size: 12px !important; /* Reduce font size on mobile */
        }
      }
    </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dooqhndwu/image/upload/v1725823836/aruna-logo_vqrow5.png" alt="aruna-logo"/>
    </div>
    <div class="content">
      <p><strong>Hello Aruna,</strong></p>
      <p>You have a new contact submission</p>
      <p><strong>Name:</strong> {{name}}</p>
      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Phone:</strong> {{phone}}</p>
      <p><strong>Subject:</strong> {{subject}}</p>
      <p><strong>Message:</strong></p>
      <p>{{message}}</p>
    </div>
    <div class="footer">
      <p>Thank you for your support!</p>
      <p><a href="https://www.arunaip.com">Aruna Investments Partners</a></p>
    </div>
  </div>
</body>
</html>
`;

// Define the HTML template for the auto-reply email
const autoReplyTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thank You</title>
  <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        color: #333;
      }
      .container {
        width: 100%;
        max-width: 600px;
        margin: 30px auto 0;
        border: 1px solid #ddd;
        border-radius: 5px;
        overflow: hidden;
      }
      .header {
        background-color: #2e2e2e;
        padding: 40px;
        text-align: center;
      }
      .header img {
        max-width: 80px; /* Adjusted size */
        height: auto;
        display: block;
        margin: 0 auto;
      }
      .content {
        padding: 20px;
        background-color: #ffffff;
      }
      .content p {
        line-height: 1.6; /* Increased line height */
      }
      .footer {
        background-color: #2e2e2e;
        padding: 20px 10px;
        text-align: center;
        font-size: 14px;
        color: #fff;
      }
      .footer a {
        color: #347856;
        text-decoration: none;
      }

      @media only screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          max-width: 320px; /* Reduced width for mobile screens */
          margin: 10px auto 0;
        }
        .header,
        .footer {
          padding: 15px !important; /* Adjust padding for mobile */
             font-size: 10px !important;
        }
        .content {
          padding: 15px !important; /* Adjust padding for mobile */
        }
        .header img {
          max-width: 40px !important; /* Adjust logo size for mobile */
        }
        .content p {
          font-size: 12px !important; /* Reduce font size on mobile */
        }
      }
    </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dooqhndwu/image/upload/v1725823836/aruna-logo_vqrow5.png" alt="aruna-logo"/>
    </div>
    <div class="content">
      <p><strong>Hello {{name}},</strong></p>
      <p>Thank you for reaching out to us. We have received your message and will get back to you shortly.</p>
      <p><strong>Your message:</strong></p>
      <p>{{message}}</p>
      <p>Best regards,<br>Aruna Investments Partners</p>
    </div>
    <div class="footer">
      <p><a href="https://www.arunaip.com">Aruna Investments Partners</a></p>
    </div>
  </div>
</body>
</html>
`;

// Define a POST endpoint for the contact form
app.post("/send-email", (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // Validate the input
  if (!name || !email || !message) {
    return res.status(400).json({
      status: "Error",
      message: "Name, email, and message are required.",
    });
  }

  // Replace placeholders in the contact email template with actual data
  const contactHtmlTemplate = contactEmailTemplate
    .replace("{{name}}", name || "N/A")
    .replace("{{email}}", email)
    .replace("{{phone}}", phone || "N/A")
    .replace("{{subject}}", subject || "N/A")
    .replace("{{message}}", message);

  const contactMailOptions = {
    from: email,
    to: "info@arunaip.com", // Replace with your recipient email address
    subject: subject || "New Contact Submission",
    html: contactHtmlTemplate,
  };

  // Define the auto-reply email options
  const autoReplyMailOptions = {
    from: "info@arunaip.com", // Use your official email address
    to: email,
    subject: "Thank you for your message",
    html: autoReplyTemplate
      .replace("{{name}}", name || "N/A")
      .replace("{{message}}", message),
  };

  // Send the contact email
  transporter.sendMail(contactMailOptions, (error, info) => {
    if (error) {
      console.error("Error sending contact email:", error);
      return res
        .status(500)
        .json({ status: "Error", message: "Failed to send contact email." });
    }

    // Send the auto-reply email
    transporter.sendMail(autoReplyMailOptions, (error, info) => {
      if (error) {
        console.error("Error sending auto-reply email:", error);
        return res.status(500).json({
          status: "Error",
          message: "Failed to send auto-reply email.",
        });
      }

      console.log("Contact email sent:", info.response);
      console.log("Auto-reply sent:", info.response);
      return res
        .status(200)
        .json({ status: "Success", message: "Emails sent successfully!" });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
