const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { supabase, isConfigured } = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so the static frontend (on another port or domain) can call the API
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Nodemailer transporter using SMTP settings from .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587/other
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper: Check if email configuration is complete
function isEmailConfigured() {
  return process.env.EMAIL_USER && process.env.EMAIL_PASS;
}

// Endpoint 1: Handle simple "Get In Touch" messages from the home page
app.post('/api/connect', async (req, res) => {
  const { from_name, reply_to, message } = req.body;
  const submitted_at = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  if (!from_name || !reply_to || !message) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  let dbId = 'N/A';

  // 1. Save to Supabase database if configured
  if (isConfigured) {
    try {
      const { data, error } = await supabase
        .from('connect_submissions')
        .insert([{ from_name, reply_to, message, submitted_at }])
        .select();

      if (error) {
        console.error('Supabase database insert error:', error.message);
        return res.status(500).json({ error: 'Failed to save submission to Supabase.' });
      }

      if (data && data[0]) {
        dbId = data[0].id;
        console.log(`Saved connect lead ID to Supabase: ${dbId}`);
      }
    } catch (dbErr) {
      console.error('Supabase connection failed:', dbErr);
      return res.status(500).json({ error: 'Database connection failed.' });
    }
  } else {
    console.warn('Supabase not configured in .env. Skipping database insert.');
  }

  // 2. Send email notification to you
  if (isEmailConfigured()) {
    const ownerMailOptions = {
      from: `"${from_name} via Portfolio" <${process.env.EMAIL_USER}>`,
      to: process.env.TO_EMAIL || 'paved2307@gmail.com',
      replyTo: reply_to,
      subject: `📬 Portfolio: New Message from ${from_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #c9a84c; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
          <div style="background-color: #0a0706; padding: 24px; text-align: center; border-bottom: 2px solid #c9a84c;">
            <h2 style="color: #f5f0e8; margin: 0; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 1px;">New Portfolio Contact</h2>
          </div>
          <div style="padding: 24px; background-color: #f5f0e8; color: #1a1020; line-height: 1.6;">
            <p style="margin-top: 0; font-size: 15px;">You have received a new general contact form message:</p>
            <p><strong>Name:</strong> ${from_name}</p>
            <p><strong>Email:</strong> <a href="mailto:${reply_to}" style="color: #c9a84c; text-decoration: none; font-weight: bold;">${reply_to}</a></p>
            <p><strong>Date/Time:</strong> ${submitted_at}</p>
            <p><strong>Lead Ref:</strong> Supabase ID #${dbId}</p>
            <hr style="border: 0; border-top: 1px solid #c8bfb0; margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; border-left: 4px solid #c9a84c; font-style: italic; line-height: 1.5;">
              "${message.replace(/\n/g, '<br>')}"
            </div>
          </div>
          <div style="background-color: #1a1512; padding: 12px; text-align: center; color: #b8af9f; font-size: 12px; border-top: 1px solid #c9a84c;">
            © 2026 Patel Ved Portfolio Server
          </div>
        </div>
      `
    };

    transporter.sendMail(ownerMailOptions, (mailErr, info) => {
      if (mailErr) {
        console.error('Mail delivery failed:', mailErr);
        return res.status(200).json({ status: 'ok', message: 'Saved to Supabase, but email delivery failed.' });
      }
      console.log('Email sent successfully:', info.response);
      return res.status(200).json({ status: 'ok', message: 'Submission saved and email delivered successfully.' });
    });
  } else {
    console.warn('Mail credentials not set in .env. Email skipped.');
    return res.status(200).json({ status: 'ok', message: 'Saved to Supabase (Email skipped due to missing SMTP credentials).' });
  }
});

// Endpoint 2: Handle detailed "Project Request / Hire Me" form submissions
app.post('/api/hire', async (req, res) => {
  const { from_name, reply_to, phone, company, project_title, reference_link, project_type, budget, timeline, contact_method, message } = req.body;
  const submitted_at = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  if (!from_name || !reply_to || !phone || !project_title || !project_type || !budget || !timeline || !contact_method || !message) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  let dbId = 'N/A';

  // 1. Save to Supabase database if configured
  if (isConfigured) {
    try {
      const { data, error } = await supabase
        .from('project_requests')
        .insert([{
          from_name,
          reply_to,
          phone,
          company: company || '',
          project_title,
          reference_link: reference_link || '',
          project_type,
          budget,
          timeline,
          contact_method,
          message,
          submitted_at
        }])
        .select();

      if (error) {
        console.error('Supabase project request insert error:', error.message);
        return res.status(500).json({ error: 'Failed to save project request to Supabase.' });
      }

      if (data && data[0]) {
        dbId = data[0].id;
        console.log(`Saved project request lead ID to Supabase: ${dbId}`);
      }
    } catch (dbErr) {
      console.error('Supabase connection failed:', dbErr);
      return res.status(500).json({ error: 'Database connection failed.' });
    }
  } else {
    console.warn('Supabase not configured in .env. Skipping database insert.');
  }

  // 2. Send emails
  if (isEmailConfigured()) {
    // Standardize phone for WhatsApp links
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const isMeeting = project_type === "Google Meet Booking";
    const meetLink = "https://meet.google.com/paved2307-meet";

    // A. CREATIVE ALERT EMAIL TO YOU (Patel Ved) - Premium Dark Gold Theme
    const ownerMailOptions = {
      from: `"${from_name} via Portfolio" <${process.env.EMAIL_USER}>`,
      to: process.env.TO_EMAIL || 'paved2307@gmail.com',
      replyTo: reply_to,
      subject: isMeeting 
        ? `📅 Google Meet Consultation Scheduled: "${project_title}" with ${from_name}`
        : `💼 New Project Brief: "${project_title}" from ${from_name}`,
      html: `
        <div style="background-color: #0d0a08; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #14110f; border: 1px solid #c9a84c; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #1f1a16 0%, #0d0a08 100%); padding: 30px 24px; text-align: center; border-bottom: 1px solid #2d261e; position: relative;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #c9a84c; font-weight: 700; margin-bottom: 8px;">
                ${isMeeting ? 'Meeting Scheduled' : 'New Project Inbound'}
              </div>
              <h1 style="color: #f5f0e8; font-size: 26px; font-family: 'Playfair Display', Georgia, serif; font-weight: normal; margin: 0; line-height: 1.3;">
                ${project_title}
              </h1>
              <p style="color: #a89e90; font-size: 13px; margin: 8px 0 0 0;">Submitted by <strong>${from_name}</strong></p>
            </div>
 
            <!-- Stats/Specs Dashboard Grid -->
            <div style="padding: 24px; background-color: #1a1613; border-bottom: 1px solid #2d261e;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 50%; padding: 8px; vertical-align: top;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #c9a84c; font-weight: bold; letter-spacing: 1px;">
                      ${isMeeting ? 'Meeting Type' : 'Project Type'}
                    </div>
                    <div style="color: #f5f0e8; font-size: 15px; margin-top: 4px; font-weight: 600;">${project_type}</div>
                  </td>
                  <td style="width: 50%; padding: 8px; vertical-align: top;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #c9a84c; font-weight: bold; letter-spacing: 1px;">
                      ${isMeeting ? 'Meet Room Link' : 'Budget Range'}
                    </div>
                    <div style="color: #f5f0e8; font-size: 14px; margin-top: 4px; font-weight: 600;">
                      ${isMeeting ? `<a href="${meetLink}" target="_blank" style="color: #c9a84c; text-decoration: underline;">Google Meet Room</a>` : budget}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50%; padding: 8px; vertical-align: top; padding-top: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #c9a84c; font-weight: bold; letter-spacing: 1px;">
                      ${isMeeting ? 'Date & Time' : 'Timeline'}
                    </div>
                    <div style="color: #f5f0e8; font-size: 15px; margin-top: 4px; font-weight: 600;">${timeline}</div>
                  </td>
                  <td style="width: 50%; padding: 8px; vertical-align: top; padding-top: 16px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #c9a84c; font-weight: bold; letter-spacing: 1px;">Contact Preference</div>
                    <div style="color: #f5f0e8; font-size: 15px; margin-top: 4px; font-weight: 600;">${contact_method}</div>
                  </td>
                </tr>
              </table>
            </div>
 
            <!-- Client Info Cards -->
            <div style="padding: 24px; color: #e5dec9; line-height: 1.7; font-size: 14px;">
              <h3 style="color: #c9a84c; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #2d261e; padding-bottom: 6px;">Client Profile</h3>
              <p style="margin: 6px 0;"><strong>Company/Org:</strong> ${company || 'Individual / None'}</p>
              <p style="margin: 6px 0;"><strong>Email:</strong> <a href="mailto:${reply_to}" style="color: #c9a84c; text-decoration: none;">${reply_to}</a></p>
              <p style="margin: 6px 0;"><strong>Phone:</strong> ${phone}</p>
              <p style="margin: 6px 0;"><strong>Reference URL:</strong> ${reference_link ? `<a href="${reference_link}" target="_blank" style="color: #c9a84c; text-decoration: underline;">${reference_link}</a>` : '<em>None provided</em>'}</p>
              <p style="margin: 6px 0;"><strong>Supabase Record ID:</strong> #${dbId}</p>
 
              <h3 style="color: #c9a84c; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #2d261e; padding-bottom: 6px;">
                ${isMeeting ? 'Discussion Brief & Questions' : 'Project Scope'}
              </h3>
              <div style="background-color: #1a1613; padding: 18px; border-radius: 8px; border-left: 3px solid #c9a84c; color: #f5f0e8; font-style: italic; line-height: 1.6; font-size: 14px;">
                "${message.replace(/\n/g, '<br>')}"
              </div>
 
              <!-- Quick Action Response Buttons -->
              <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #2d261e;">
                <p style="font-size: 12px; color: #a89e90; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Quick Response Actions</p>
                <a href="mailto:${reply_to}?subject=Re: Meeting Schedule: ${encodeURIComponent(project_title)}" 
                   style="display: inline-block; background-color: #c9a84c; color: #14110f; padding: 12px 20px; font-size: 13px; font-weight: bold; border-radius: 8px; text-decoration: none; margin: 5px; text-transform: uppercase; letter-spacing: 1px;">
                  📨 Reply via Email
                </a>
                <a href="https://wa.me/${cleanPhone}" 
                   style="display: inline-block; background-color: #25d366; color: #ffffff; padding: 12px 20px; font-size: 13px; font-weight: bold; border-radius: 8px; text-decoration: none; margin: 5px; text-transform: uppercase; letter-spacing: 1px;">
                  💬 Chat on WhatsApp
                </a>
              </div>
            </div>
 
            <!-- Footer -->
            <div style="background-color: #0d0a08; padding: 16px; text-align: center; font-size: 11px; color: #6b6358; border-top: 1px solid #2d261e;">
              Lead generated via Patel Ved Portfolio Server. Timestamp: ${submitted_at}
            </div>
          </div>
        </div>
      `
    };
 
    // B. CREATIVE AUTO-RESPONSE EMAIL TO THE CLIENT (Requester) - Minimal Editorial Layout
    const clientMailOptions = {
      from: `"Patel Ved" <${process.env.EMAIL_USER}>`,
      to: reply_to,
      subject: isMeeting 
        ? `📅 Meeting Scheduled: Patel Ved + ${from_name}`
        : `Your project brief has been received, ${from_name}!`,
      html: `
        <div style="background-color: #f7f5f2; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0dbd3; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(45,38,30,0.06);">
            
            <!-- Branding Header -->
            <div style="background-color: #0f0d0b; padding: 36px 24px; text-align: center; border-bottom: 3px solid #c9a84c;">
              <h1 style="color: #f7f5f2; margin: 0; font-family: 'Playfair Display', Georgia, serif; font-weight: normal; font-size: 32px; letter-spacing: 2px;">
                Ved<span style="color:#c9a84c;">.</span>
              </h1>
              <div style="color: #b8af9f; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px; font-family: monospace;">UI/UX DESIGNER & DEVELOPER</div>
            </div>
 
            <!-- Main Body -->
            <div style="padding: 36px 30px; color: #2d261e; line-height: 1.7; font-size: 15px;">
              <p style="font-size: 17px; font-weight: 600; margin-top: 0; color: #0f0d0b;">Hello ${from_name},</p>
              
              ${isMeeting ? `
                <p>Thank you for scheduling a meeting consultation. I look forward to connecting with you and discussing how we can work together to bring your ideas to life.</p>
                <p>Here are the scheduled details for our upcoming conversation:</p>
                
                <!-- Meeting Receipt Card -->
                <div style="background-color: #f7f5f2; border: 1px solid #e0dbd3; border-radius: 8px; padding: 20px; margin: 24px 0;">
                  <h3 style="color: #0f0d0b; margin-top: 0; margin-bottom: 12px; font-family: 'Playfair Display', Georgia, serif; font-size: 18px; border-bottom: 1px solid #e0dbd3; padding-bottom: 8px;">
                    Google Meet Consultation
                  </h3>
                  <table style="width: 100%; font-size: 14.5px;">
                    <tr><td style="padding: 4px 0; font-weight: 600; color: #6b6358; width: 40%;">Service Interest:</td><td style="padding: 4px 0; color: #0f0d0b;">${project_title.replace('Google Meet: ', '')}</td></tr>
                    <tr><td style="padding: 4px 0; font-weight: 600; color: #6b6358;">Date & Time Slot:</td><td style="padding: 4px 0; color: #0f0d0b; font-weight: bold;">${timeline}</td></tr>
                    <tr><td style="padding: 4px 0; font-weight: 600; color: #6b6358;">Google Meet Link:</td><td style="padding: 4px 0; color: #c9a84c;"><a href="${meetLink}" target="_blank" style="color: #c9a84c; text-decoration: underline; font-weight: bold;">Join Google Meet Room</a></td></tr>
                    <tr><td style="padding: 4px 0; font-weight: 600; color: #6b6358;">Meeting Password:</td><td style="padding: 4px 0; color: #0f0d0b;">None (Direct Room Join)</td></tr>
                  </table>
                </div>
                
                <p style="background-color: #fff9e6; border: 1px solid #ffe8b3; border-radius: 6px; padding: 12px; font-size: 14px; color: #8a6d1c; margin: 20px 0;">
                  💡 <b>Please save this email:</b> Simply click the link above at the scheduled time to join the Google Meet call directly.
                </p>
              ` : `
                <p>Thank you for submitting your project request. I am excited about the opportunity to potentially collaborate and build a clean, impactful digital experience together.</p>
                <p>I have received your project details and am currently reviewing your requirements. Here is a summary of the project brief we recorded:</p>
                
                <!-- Project Receipt card -->
                <div style="background-color: #f7f5f2; border: 1px solid #e0dbd3; border-radius: 8px; padding: 20px; margin: 24px 0;">
                  <h3 style="color: #0f0d0b; margin-top: 0; margin-bottom: 12px; font-family: 'Playfair Display', Georgia, serif; font-size: 18px; border-bottom: 1px solid #e0dbd3; padding-bottom: 8px;">
                    Brief: "${project_title}"
                  </h3>
                  <table style="width: 100%; font-size: 14.5px;">
                    <tr><td style="padding: 4px 0; font-weight: 600; color: #6b6358; width: 40%;">Project Type:</td><td style="padding: 4px 0; color: #0f0d0b;">${project_type}</td></tr>
                    <tr><td style="padding: 4px 0; font-weight: 600; color: #6b6358;">Timeline:</td><td style="padding: 4px 0; color: #0f0d0b;">${timeline}</td></tr>
                    <tr><td style="padding: 4px 0; font-weight: 600; color: #6b6358;">Budget Range:</td><td style="padding: 4px 0; color: #0f0d0b;">${budget}</td></tr>
                    <tr><td style="padding: 4px 0; font-weight: 600; color: #6b6358;">Contact Method:</td><td style="padding: 4px 0; color: #0f0d0b; font-weight: 600;">${contact_method}</td></tr>
                  </table>
                </div>
                
                <p>I will review the scope of work and reach out to you via your preferred method (<b>${contact_method}</b>) within the next **24 hours** to schedule a kick-off call.</p>
              `}
 
              <!-- Call to Actions -->
              <p style="margin-bottom: 8px;">In the meantime, feel free to explore my latest creations:</p>
              <div style="margin-top: 15px; margin-bottom: 30px;">
                <a href="https://www.linkedin.com/in/patel-ved-327a55326/" style="display: inline-block; color: #c9a84c; text-decoration: none; font-weight: bold; margin-right: 18px; font-size: 14px;">LinkedIn &rarr;</a>
                <a href="https://www.behance.net/patelved6" style="display: inline-block; color: #c9a84c; text-decoration: none; font-weight: bold; margin-right: 18px; font-size: 14px;">Behance &rarr;</a>
                <a href="https://wa.me/919979809442" style="display: inline-block; color: #c9a84c; text-decoration: none; font-weight: bold; font-size: 14px;">WhatsApp Chat &rarr;</a>
              </div>
 
              <!-- Sign Off -->
              <div style="border-top: 1px solid #e0dbd3; padding-top: 20px; font-size: 14.5px;">
                <p style="margin: 0; font-weight: 600; color: #0f0d0b;">Warm regards,</p>
                <p style="margin: 4px 0 0 0; font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-style: italic; color: #c9a84c; font-weight: bold;">Patel Ved Alpeshkumar</p>
                <p style="margin: 2px 0 0 0; color: #6b6358; font-size: 12px;">UI/UX Designer & Frontend Developer | paved2307@gmail.com</p>
              </div>

            </div>

            <!-- Header Footer -->
            <div style="background-color: #0f0d0b; padding: 20px; text-align: center; font-size: 11px; color: #6b6358;">
              This is an automated confirmation of your submission at paved2307@gmail.com.
            </div>
          </div>
        </div>
      `
    };

    // Send emails
    transporter.sendMail(ownerMailOptions, (ownerMailErr) => {
      if (ownerMailErr) console.error('Alert email delivery failed:', ownerMailErr);
    });

    transporter.sendMail(clientMailOptions, (clientMailErr) => {
      if (clientMailErr) console.error('Client auto-response delivery failed:', clientMailErr);
    });

    return res.status(200).json({ status: 'ok', message: 'Request submitted successfully. Emails are being processed.' });
  } else {
    console.warn('Mail credentials not set in .env. Emails skipped.');
    return res.status(200).json({ status: 'ok', message: 'Saved to Supabase (Email skipped due to missing SMTP credentials).' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
