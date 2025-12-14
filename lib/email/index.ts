import { Resend } from "resend";

// Lazy-load Resend client to avoid build errors when API key is missing
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Email configuration - uses environment variables with sensible defaults
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "scribeandstem.com";
const FROM_EMAIL = process.env.EMAIL_FROM || `Stem <hello@${APP_DOMAIN}>`;
const PERSONAL_FROM_EMAIL = process.env.EMAIL_FROM_PERSONAL || `Gabe & Sarah <GabeandSarah@${APP_DOMAIN}>`;
const BASE_URL = process.env.NEXTAUTH_URL || `https://${APP_DOMAIN}`;

export type EmailTemplate =
  | "welcome"
  | "why_29"
  | "tips_week_1"
  | "broadcast"
  | "password_reset"
  | "payment_failed"
  | "vendor_claim_verification"
  | "vendor_claim_approved"
  | "vendor_claim_rejected"
  | "admin_claim_notification"
  | "partner_invite";

interface SendEmailOptions {
  to: string;
  template: EmailTemplate;
  data: {
    name: string;
    unsubscribeToken?: string; // Optional for transactional emails
    subject?: string; // For broadcast emails
    content?: string; // For broadcast emails
    resetUrl?: string; // For password reset emails
    // Vendor claim email fields
    vendorName?: string;
    verifyUrl?: string;
    registrationUrl?: string;
    claimEmail?: string;
    adminNotes?: string;
    // Partner invite email fields
    inviterName?: string;
    acceptUrl?: string;
  };
}

// ============================================================================
// UNSUBSCRIBE FOOTER
// ============================================================================

function getUnsubscribeFooter(unsubscribeToken: string) {
  const unsubscribeUrl = `${BASE_URL}/unsubscribe?token=${unsubscribeToken}`;
  return `
    <tr>
      <td style="padding: 20px 40px; background-color: #f5f3f0; border-top: 1px solid #e8e4df;">
        <p style="margin: 0; font-size: 11px; color: #9a8d7f; text-align: center; line-height: 1.6;">
          You're receiving this because you signed up for wedding planning tips from Stem.<br>
          <a href="${unsubscribeUrl}" style="color: #8b7355; text-decoration: underline;">Unsubscribe</a> · 
          <a href="${BASE_URL}" style="color: #8b7355; text-decoration: none;">scribeandstem.com</a>
        </p>
      </td>
    </tr>
  `;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

function getWelcomeEmail(name: string, unsubscribeToken: string) {
  const firstName = name.split(" ")[0] || name;
  
  return {
    subject: `Welcome to Stem, ${firstName}! 💍`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #faf9f7; color: #5c5147;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e8e4df; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 1px; background-color: #c9b99a; margin: 0 auto 20px;"></div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #5c5147;">
                STEM
              </h1>
              <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9a8d7f;">
                Wedding Planner
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 300; color: #5c5147; text-align: center;">
                Welcome, ${firstName}!
              </h2>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                Congratulations on your engagement! We're so excited you've chosen Stem to help plan your special day.
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                Your planner is ready and waiting. Here's what you can do right now:
              </p>
              
              <ul style="margin: 0 0 30px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #6b6157;">
                <li>Set your wedding date to unlock your personalized timeline</li>
                <li>Invite your partner to plan together</li>
                <li>Start tracking your budget</li>
                <li>Begin your guest list</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${BASE_URL}/planner" style="display: inline-block; padding: 16px 32px; background-color: #8b7355; color: #ffffff; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                  Open Your Planner
                </a>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #9a8d7f; text-align: center;">
                Questions? Just reply to this email — we read every message.
              </p>
            </td>
          </tr>
          
          ${getUnsubscribeFooter(unsubscribeToken)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

function getWhy29Email(name: string, unsubscribeToken: string) {
  const firstName = name.split(" ")[0] || name;
  
  return {
    subject: "Why we charge $29 (and why it saves you money)",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #faf9f7; color: #5c5147;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e8e4df; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 1px; background-color: #c9b99a; margin: 0 auto 20px;"></div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #5c5147;">
                STEM
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 24px; font-size: 22px; font-weight: 300; color: #5c5147; text-align: center; line-height: 1.4;">
                Hey ${firstName} — a quick note about pricing
              </h2>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #6b6157;">
                You might be wondering why we charge a one-time $29 fee for the Complete plan when other wedding apps are "free."
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #6b6157;">
                Here's the truth: those "free" apps aren't really free.
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #6b6157;">
                <strong style="color: #5c5147;">They make money by:</strong>
              </p>
              
              <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #6b6157;">
                <li>Selling your data to vendors who then spam you</li>
                <li>Showing you ads for services you didn't ask for</li>
                <li>Charging monthly fees that add up over your engagement ($10/month × 12 months = $120+)</li>
                <li>Upselling premium features one by one</li>
              </ul>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #6b6157;">
                <strong style="color: #5c5147;">With Stem's $29 Complete plan, you get:</strong>
              </p>
              
              <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #6b6157;">
                <li>Every feature, unlocked forever</li>
                <li>Zero ads, ever</li>
                <li>Your data stays private — we never sell it</li>
                <li>No monthly fees creeping up on you</li>
                <li>Access for both you and your partner</li>
              </ul>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #6b6157;">
                Think of it this way: $29 is about the cost of one dinner out. And you'll use Stem for 12-18 months of planning.
              </p>
              
              <div style="background-color: #faf9f7; padding: 24px; margin: 30px 0; border-left: 3px solid #c9b99a;">
                <p style="margin: 0; font-size: 16px; line-height: 1.7; color: #6b6157; font-style: italic;">
                  "We built Stem because we're planning our own wedding and got tired of the chaos. The $29 keeps us independent — no investors pushing us to sell your info."
                </p>
                <p style="margin: 12px 0 0; font-size: 14px; color: #9a8d7f;">
                  — Sarah & Gabe, founders
                </p>
              </div>
              
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.7; color: #6b6157;">
                Of course, the free plan works great for many couples. No pressure at all — use whatever works for you.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${BASE_URL}/choose-plan" style="display: inline-block; padding: 16px 32px; background-color: #8b7355; color: #ffffff; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                  View Plans
                </a>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #9a8d7f; text-align: center;">
                Happy planning! 💍
              </p>
            </td>
          </tr>
          
          ${getUnsubscribeFooter(unsubscribeToken)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

function getTipsWeek1Email(name: string, unsubscribeToken: string) {
  const firstName = name.split(" ")[0] || name;
  
  return {
    subject: "Your first week with Stem — 3 quick wins",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #faf9f7; color: #5c5147;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e8e4df; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 1px; background-color: #c9b99a; margin: 0 auto 20px;"></div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #5c5147;">
                STEM
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 24px; font-size: 22px; font-weight: 300; color: #5c5147; text-align: center; line-height: 1.4;">
                3 quick wins for your first week
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: #6b6157;">
                Hey ${firstName}! Here are three things successful couples do in their first week with Stem:
              </p>
              
              <!-- Tip 1 -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px; font-size: 16px; color: #5c5147;">
                  1. Set your wedding date (even if it's approximate)
                </h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #6b6157;">
                  This unlocks your personalized timeline and shows you exactly what to focus on each month. Don't have an exact date yet? Pick a target month — you can always adjust later.
                </p>
              </div>
              
              <!-- Tip 2 -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px; font-size: 16px; color: #5c5147;">
                  2. Invite your partner
                </h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #6b6157;">
                  Planning is better together. Add them from the settings menu — they'll get their own login and can edit everything in real time.
                </p>
              </div>
              
              <!-- Tip 3 -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px; font-size: 16px; color: #5c5147;">
                  3. Add your first 5 budget items
                </h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #6b6157;">
                  Start with the big ones: venue, catering, photography, attire, and flowers. Even rough estimates help you see the full picture early.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${BASE_URL}/planner" style="display: inline-block; padding: 16px 32px; background-color: #8b7355; color: #ffffff; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                  Open Your Planner
                </a>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #9a8d7f; text-align: center;">
                Questions? Just reply — we're here to help.
              </p>
            </td>
          </tr>
          
          ${getUnsubscribeFooter(unsubscribeToken)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

function getBroadcastEmail(_name: string, unsubscribeToken: string, subject: string, content: string) {
  // Note: name parameter preserved for interface consistency but not used in broadcast template
  return {
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #faf9f7; color: #5c5147;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e8e4df; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 1px; background-color: #c9b99a; margin: 0 auto 20px;"></div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #5c5147;">
                STEM
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
              
              <div style="font-size: 16px; line-height: 1.7; color: #6b6157;">
                ${content.split('\n').map(p => `<p style="margin: 0 0 16px;">${p}</p>`).join('')}
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${BASE_URL}/planner" style="display: inline-block; padding: 16px 32px; background-color: #8b7355; color: #ffffff; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                  Open Your Planner
                </a>
              </div>
              
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #9a8d7f; text-align: center;">
                — Sarah & Gabe
              </p>
            </td>
          </tr>
          
          ${getUnsubscribeFooter(unsubscribeToken)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

// ============================================================================
// PASSWORD RESET EMAIL
// ============================================================================

function getPasswordResetEmail(name: string, resetUrl: string) {
  const firstName = name.split(" ")[0] || name;

  return {
    subject: "Reset your Stem password",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #faf9f7; color: #5c5147;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e8e4df; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 1px; background-color: #c9b99a; margin: 0 auto 20px;"></div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #5c5147;">
                STEM
              </h1>
              <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9a8d7f;">
                Wedding Planner
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 300; color: #5c5147; text-align: center;">
                Reset Your Password
              </h2>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                Hi ${firstName},
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background-color: #8b7355; color: #ffffff; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                  Reset Password
                </a>
              </div>

              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #9a8d7f;">
                This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
              </p>

              <p style="margin: 30px 0 0; font-size: 12px; line-height: 1.6; color: #9a8d7f; border-top: 1px solid #e8e4df; padding-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #8b7355; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

// ============================================================================
// PAYMENT FAILED EMAIL
// ============================================================================

function getPaymentFailedEmail(name: string) {
  const firstName = name.split(" ")[0] || name;

  return {
    subject: "Action needed: Your Stem payment failed",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #faf9f7; color: #5c5147;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e8e4df; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 1px; background-color: #c9b99a; margin: 0 auto 20px;"></div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #5c5147;">
                STEM
              </h1>
              <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9a8d7f;">
                Wedding Planner
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 300; color: #5c5147; text-align: center;">
                Payment Issue
              </h2>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                Hi ${firstName},
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                We weren't able to process your payment for your Stem subscription. This can happen if your card expired or there were insufficient funds.
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                To keep your planner access uninterrupted, please update your payment method:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${BASE_URL}/planner/settings" style="display: inline-block; padding: 16px 32px; background-color: #8b7355; color: #ffffff; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                  Update Payment Method
                </a>
              </div>

              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #9a8d7f;">
                If you have any questions, just reply to this email — we're here to help.
              </p>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #9a8d7f; text-align: center;">
                — The Stem Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

// ============================================================================
// VENDOR CLAIM EMAILS
// ============================================================================

function getVendorClaimVerificationEmail(vendorName: string, verifyUrl: string) {
  return {
    subject: `Verify your claim for ${vendorName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #faf9f7; color: #5c5147;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e8e4df; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 1px; background-color: #c9b99a; margin: 0 auto 20px;"></div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #5c5147;">
                STEM
              </h1>
              <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9a8d7f;">
                Vendor Portal
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 300; color: #5c5147; text-align: center;">
                Verify Your Business Claim
              </h2>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                You've requested to claim the business profile for <strong>${vendorName}</strong> on Stem.
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                Click the button below to verify your email address. Once verified, our team will review your claim and you'll receive a follow-up email within 1-2 business days.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="display: inline-block; padding: 16px 32px; background-color: #8b7355; color: #ffffff; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                  Verify Email
                </a>
              </div>

              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #9a8d7f;">
                This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.
              </p>

              <p style="margin: 30px 0 0; font-size: 12px; line-height: 1.6; color: #9a8d7f; border-top: 1px solid #e8e4df; padding-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verifyUrl}" style="color: #8b7355; word-break: break-all;">${verifyUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

function getVendorClaimApprovedEmail(vendorName: string, registrationUrl: string) {
  return {
    subject: `Your claim for ${vendorName} has been approved!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #faf9f7; color: #5c5147;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e8e4df; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 1px; background-color: #c9b99a; margin: 0 auto 20px;"></div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #5c5147;">
                STEM
              </h1>
              <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9a8d7f;">
                Vendor Portal
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 300; color: #5c5147; text-align: center;">
                Claim Approved!
              </h2>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                Great news! Your claim for <strong>${vendorName}</strong> has been approved.
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                Click the button below to complete your registration and gain access to your vendor dashboard:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${registrationUrl}" style="display: inline-block; padding: 16px 32px; background-color: #8b7355; color: #ffffff; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                  Complete Registration
                </a>
              </div>

              <div style="background-color: #faf9f7; padding: 20px; margin: 24px 0; border-left: 3px solid #c9b99a;">
                <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #5c5147;">
                  What you can do once registered:
                </p>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #6b6157;">
                  <li>Update your business profile and photos</li>
                  <li>Respond to questions from couples</li>
                  <li>Get discovered by engaged couples planning their weddings</li>
                  <li>Share posts and inspiration on Stem</li>
                </ul>
              </div>

              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #9a8d7f;">
                This registration link will expire in 7 days. If you have any questions, just reply to this email.
              </p>

              <p style="margin: 30px 0 0; font-size: 12px; line-height: 1.6; color: #9a8d7f; border-top: 1px solid #e8e4df; padding-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${registrationUrl}" style="color: #8b7355; word-break: break-all;">${registrationUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

function getVendorClaimRejectedEmail(vendorName: string, adminNotes?: string) {
  return {
    subject: `Update on your claim for ${vendorName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #faf9f7; color: #5c5147;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e8e4df; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 1px; background-color: #c9b99a; margin: 0 auto 20px;"></div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #5c5147;">
                STEM
              </h1>
              <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9a8d7f;">
                Vendor Portal
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 300; color: #5c5147; text-align: center;">
                Claim Not Approved
              </h2>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                Thank you for your interest in claiming <strong>${vendorName}</strong> on Stem.
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                After reviewing your request, we were unable to approve your claim at this time.
              </p>

              ${adminNotes ? `
              <div style="background-color: #faf9f7; padding: 20px; margin: 24px 0; border-left: 3px solid #c9b99a;">
                <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #5c5147;">
                  Reason:
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b6157;">
                  ${adminNotes}
                </p>
              </div>
              ` : ''}

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                If you believe this was a mistake, or if you have additional documentation to verify your ownership of this business, please reply to this email and we'll be happy to review again.
              </p>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #9a8d7f; text-align: center;">
                — The Stem Team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

function getAdminClaimNotificationEmail(vendorName: string, claimEmail: string) {
  const adminUrl = `${BASE_URL}/admin/vendors?tab=claims`;

  return {
    subject: `New vendor claim: ${vendorName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #faf9f7; color: #5c5147;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e8e4df; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 1px; background-color: #c9b99a; margin: 0 auto 20px;"></div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #5c5147;">
                STEM ADMIN
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 300; color: #5c5147; text-align: center;">
                New Vendor Claim
              </h2>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                A new vendor claim has been submitted and verified:
              </p>

              <div style="background-color: #faf9f7; padding: 20px; margin: 24px 0; border-left: 3px solid #c9b99a;">
                <p style="margin: 0 0 8px; font-size: 14px; color: #9a8d7f;">Business</p>
                <p style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #5c5147;">${vendorName}</p>

                <p style="margin: 0 0 8px; font-size: 14px; color: #9a8d7f;">Claimant Email</p>
                <p style="margin: 0; font-size: 16px; color: #5c5147;">${claimEmail}</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${adminUrl}" style="display: inline-block; padding: 16px 32px; background-color: #8b7355; color: #ffffff; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                  Review Claim
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

// ============================================================================
// PARTNER INVITE EMAIL
// ============================================================================

function getPartnerInviteEmail(inviterName: string, acceptUrl: string) {
  return {
    subject: `${inviterName} invited you to plan your wedding on Stem`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #faf9f7; color: #5c5147;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e8e4df; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 1px; background-color: #c9b99a; margin: 0 auto 20px;"></div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #5c5147;">
                STEM
              </h1>
              <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #9a8d7f;">
                Wedding Planner
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 300; color: #5c5147; text-align: center;">
                You're Invited to Plan Together
              </h2>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                <strong>${inviterName}</strong> has invited you to join them on Stem to plan your wedding together.
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #6b6157;">
                With a shared account, you can both:
              </p>

              <ul style="margin: 0 0 30px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #6b6157;">
                <li>Track budget and expenses together</li>
                <li>Manage your guest list in real-time</li>
                <li>Coordinate with vendors as a team</li>
                <li>Share inspiration and make decisions</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" style="display: inline-block; padding: 16px 32px; background-color: #8b7355; color: #ffffff; text-decoration: none; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                  Accept Invitation
                </a>
              </div>

              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #9a8d7f;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>

              <p style="margin: 30px 0 0; font-size: 12px; line-height: 1.6; color: #9a8d7f; border-top: 1px solid #e8e4df; padding-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${acceptUrl}" style="color: #8b7355; word-break: break-all;">${acceptUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

// ============================================================================
// SEND EMAIL FUNCTION
// ============================================================================

export async function sendEmail({ to, template, data }: SendEmailOptions) {
  let emailContent: { subject: string; html: string };

  switch (template) {
    case "welcome":
      emailContent = getWelcomeEmail(data.name, data.unsubscribeToken || "");
      break;
    case "why_29":
      emailContent = getWhy29Email(data.name, data.unsubscribeToken || "");
      break;
    case "tips_week_1":
      emailContent = getTipsWeek1Email(data.name, data.unsubscribeToken || "");
      break;
    case "broadcast":
      if (!data.subject || !data.content) {
        return { success: false, error: "Subject and content required for broadcast" };
      }
      emailContent = getBroadcastEmail(data.name, data.unsubscribeToken || "", data.subject, data.content);
      break;
    case "password_reset":
      if (!data.resetUrl) {
        return { success: false, error: "Reset URL required for password reset" };
      }
      emailContent = getPasswordResetEmail(data.name, data.resetUrl);
      break;
    case "payment_failed":
      emailContent = getPaymentFailedEmail(data.name);
      break;
    case "vendor_claim_verification":
      if (!data.vendorName || !data.verifyUrl) {
        return { success: false, error: "Vendor name and verify URL required" };
      }
      emailContent = getVendorClaimVerificationEmail(data.vendorName, data.verifyUrl);
      break;
    case "vendor_claim_approved":
      if (!data.vendorName || !data.registrationUrl) {
        return { success: false, error: "Vendor name and registration URL required" };
      }
      emailContent = getVendorClaimApprovedEmail(data.vendorName, data.registrationUrl);
      break;
    case "vendor_claim_rejected":
      if (!data.vendorName) {
        return { success: false, error: "Vendor name required" };
      }
      emailContent = getVendorClaimRejectedEmail(data.vendorName, data.adminNotes);
      break;
    case "admin_claim_notification":
      if (!data.vendorName || !data.claimEmail) {
        return { success: false, error: "Vendor name and claim email required" };
      }
      emailContent = getAdminClaimNotificationEmail(data.vendorName, data.claimEmail);
      break;
    case "partner_invite":
      if (!data.inviterName || !data.acceptUrl) {
        return { success: false, error: "Inviter name and accept URL required" };
      }
      emailContent = getPartnerInviteEmail(data.inviterName, data.acceptUrl);
      break;
    default:
      return { success: false, error: "Unknown template" };
  }

  const client = getResendClient();
  if (!client) {
    console.warn("RESEND_API_KEY not set, skipping email send");
    return { success: false, error: "Email not configured" };
  }

  try {
    // Transactional emails don't need unsubscribe headers
    const isTransactional =
      template === "password_reset" ||
      template === "payment_failed" ||
      template === "vendor_claim_verification" ||
      template === "vendor_claim_approved" ||
      template === "vendor_claim_rejected" ||
      template === "admin_claim_notification" ||
      template === "partner_invite";

    const emailOptions: Parameters<typeof client.emails.send>[0] = {
      from: FROM_EMAIL,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    // Only add unsubscribe header for marketing/promotional emails
    if (!isTransactional && data.unsubscribeToken) {
      emailOptions.headers = {
        "List-Unsubscribe": `<${BASE_URL}/unsubscribe?token=${data.unsubscribeToken}>`,
      };
    }

    const result = await client.emails.send(emailOptions);

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// DIRECT EMAIL (Admin use - from GabeandSarah@aisleboard.com)
// ============================================================================

interface SendDirectEmailOptions {
  to: string;
  subject: string;
  content: string;
  replyTo?: string;
}

export async function sendDirectEmail({ to, subject, content, replyTo }: SendDirectEmailOptions) {
  const client = getResendClient();
  if (!client) {
    console.warn("RESEND_API_KEY not set, skipping email send");
    return { success: false, error: "Email not configured" };
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #faf9f7; color: #5c5147;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e8e4df; max-width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 1px; background-color: #c9b99a; margin: 0 auto 20px;"></div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #5c5147;">
                AISLE
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              <div style="font-size: 16px; line-height: 1.7; color: #6b6157;">
                ${content.split('\n').map(p => p.trim() ? `<p style="margin: 0 0 16px;">${p}</p>` : '').join('')}
              </div>
              
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #9a8d7f;">
                — Gabe & Sarah<br>
                <a href="${BASE_URL}" style="color: #8b7355;">scribeandstem.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const result = await client.emails.send({
      from: PERSONAL_FROM_EMAIL,
      to,
      subject,
      html,
      replyTo: replyTo || "GabeandSarah@scribeandstem.com",
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("Failed to send direct email:", error);
    return { success: false, error: String(error) };
  }
}

// ============================================================================
// EMAIL SEQUENCE SCHEDULING
// ============================================================================

export const EMAIL_SEQUENCE = {
  welcome: { delayHours: 0 },
  why_29: { delayHours: 1 },
  tips_week_1: { delayHours: 24 * 3 }, // 3 days later
} as const;

export function getScheduledTime(emailType: keyof typeof EMAIL_SEQUENCE): Date {
  const delay = EMAIL_SEQUENCE[emailType].delayHours;
  return new Date(Date.now() + delay * 60 * 60 * 1000);
}
