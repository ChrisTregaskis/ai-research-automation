import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import {
  EmailConfig,
  ResearchResult,
  StructuredResearch,
  ResearchTopic,
  ResearchAutomationError,
} from '../types/schemas.js';
import { createModuleLogger } from '../utils/logger.js';
import ResearchEmail from '../templates/research-email.js';

const logger = createModuleLogger('email-service');

/**
 * Renders research email using React Email template
 * @param props - Research email properties including topic, research data, and generation date
 * @returns Promise resolving to rendered HTML string
 */
export async function renderResearchEmail(props: {
  topic: ResearchTopic;
  research: StructuredResearch;
  generatedAt: Date;
}): Promise<string> {
  try {
    logger.debug('Rendering React Email template...');

    const html = render(ResearchEmail(props), {
      pretty: false,
      plainText: false,
    });

    logger.success('React Email template rendered successfully');
    return html;
  } catch (error) {
    logger.error('Failed to render React Email template:', error);

    // Fallback to basic HTML template
    logger.warn('Using fallback HTML template due to React Email error');
    return createFallbackHtmlTemplate(props);
  }
}

/**
 * Creates a fallback HTML template when React Email fails
 * @param props - Research email properties
 * @returns Basic HTML email template
 */
function createFallbackHtmlTemplate(props: {
  topic: ResearchTopic;
  research: StructuredResearch;
  generatedAt: Date;
}): string {
  const { topic, research, generatedAt } = props;
  const formattedDate = generatedAt.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Dev Tools Research - ${topic.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e293b; color: white; padding: 24px; text-align: center; border-radius: 8px; }
    .content { padding: 20px 0; }
    h1 { margin: 0; }
    h2 { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
/**
 * Configuration interface for email service setup
 */
/**
 * Configuration interface for email service setup
 */
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AI Dev Tools Research</h1>
      <p>${topic.name} • ${formattedDate}</p>
    </div>
    
    <div class="content">
      <h2>Executive Summary</h2>
      <p>${research.executiveSummary}</p>
      
      <h2>Key Findings</h2>
      ${research.keyFindings
        .map(
          finding => `
        <div class="finding">
          <h3>${finding.title} <span class="badge">${finding.importance.toUpperCase()}</span></h3>
          <p>${finding.description}</p>
        </div>
      `
        )
        .join('')}
      
      <h2>Recommended Resources</h2>
      <ul>
        ${research.recommendedResources
          .map(
            resource => `
          <li><a href="${resource.url}" target="_blank">${resource.name}</a> - ${resource.description}</li>
        `
          )
          .join('')}
      </ul>
      
      <h2>Sources</h2>
      <ul>
        ${research.sources
          .map(
            source => `
          <li><a href="${source.url}" target="_blank">${source.title}</a></li>
        `
          )
          .join('')}
      </ul>
    </div>
</html>`;
}
/**
 * Configuration interface for email service setup
 */
export interface EmailServiceConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  recipients: string[];
}

/**
 * Dependencies interface for email service functions
 */
export interface EmailServiceDeps {
  transporter: nodemailer.Transporter;
  config: EmailServiceConfig;
}

/**
 * Creates email service dependencies with SMTP configuration
 * @param config - Email service configuration including SMTP settings
 * @returns Configured dependencies for email functions
 */
export function createEmailDeps(config: EmailServiceConfig): EmailServiceDeps {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465, // true for 465, false for other ports
    auth: {
      user: config.user,
      pass: config.pass,
    },
    // Additional options for better reliability
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  });

  return { transporter, config };
}

/**
 * Sends research summary email to configured recipients
 * @param deps - Email service dependencies with transporter and configuration
 * @param result - Research result containing content and metadata
 * @returns Promise that resolves when email is successfully sent
 */
export async function sendResearchSummary(
  deps: EmailServiceDeps,
  result: ResearchResult
): Promise<void> {
  try {
    logger.info(`Preparing to send research summary for: ${result.topic.name}`);

    // Verify SMTP connection
    await verifyConnection(deps.transporter);

    // Render the HTML content using React Email
    const htmlContent = await renderResearchEmail({
      topic: result.topic,
      research: result.structuredData,
      generatedAt: result.generatedAt,
    });

    const emailConfig = buildEmailConfig(deps.config, result, htmlContent);

    logger.info(`Sending email to ${emailConfig.to.length} recipients`);

    const info = await deps.transporter.sendMail({
      from: emailConfig.from,
      to: emailConfig.to,
      subject: emailConfig.subject,
      html: emailConfig.html,
      text: extractTextFromHtml(emailConfig.html),
      // Add headers for better deliverability
      headers: {
        'X-Mailer': 'AI Research Automation v1.0',
        'X-Priority': '3',
      },
    });

    logger.success(`Email sent successfully! Message ID: ${info.messageId}`);

    // Log recipient information (without exposing sensitive data)
    const recipientCount = Array.isArray(info.accepted) ? info.accepted.length : 0;
    const rejectedCount = Array.isArray(info.rejected) ? info.rejected.length : 0;

    if (recipientCount > 0) {
      logger.success(`Email delivered to ${recipientCount} recipients`);
    }

    if (rejectedCount > 0) {
      logger.warn(`Email rejected for ${rejectedCount} recipients`);
      throw new ResearchAutomationError(
        `Email rejected for ${rejectedCount} recipients`,
        'EMAIL_DELIVERY_PARTIAL_FAILURE'
      );
    }
  } catch (error) {
    logger.error(`Failed to send research summary:`, error);

    if (error instanceof ResearchAutomationError) {
      throw error;
    }

    // Handle specific nodemailer errors
    if (error && typeof error === 'object' && 'code' in error) {
      const nodeMailerError = error as { code: string; response?: string; responseCode?: number };

      switch (nodeMailerError.code) {
        case 'EAUTH':
          throw new ResearchAutomationError(
            'Email authentication failed. Check your email credentials.',
            'EMAIL_AUTH_ERROR'
          );
        case 'ECONNREFUSED':
          throw new ResearchAutomationError(
            'Could not connect to email server. Check your SMTP settings.',
            'EMAIL_CONNECTION_ERROR'
          );
        case 'ETIMEDOUT':
          throw new ResearchAutomationError(
            'Email sending timed out. The server may be experiencing issues.',
            'EMAIL_TIMEOUT_ERROR'
          );
        default:
          throw new ResearchAutomationError(
            `Email sending failed: ${nodeMailerError.response || nodeMailerError.code}`,
            'EMAIL_SEND_ERROR'
          );
      }
    }

    throw new ResearchAutomationError(
      `Unexpected email error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'EMAIL_UNEXPECTED_ERROR'
    );
  }
}

/**
 * Verifies SMTP connection is working correctly
 * @param transporter - Nodemailer transporter instance
 * @returns Promise that resolves when connection is verified
 */
async function verifyConnection(transporter: nodemailer.Transporter): Promise<void> {
  try {
    await transporter.verify();
    logger.success('SMTP connection verified successfully');
  } catch (error) {
    logger.error('SMTP connection verification failed:', error);
    throw new ResearchAutomationError(
      'Could not verify SMTP connection. Check your email configuration.',
      'EMAIL_CONNECTION_VERIFICATION_ERROR'
    );
  }
}

/**
 * Builds email configuration from research result and service config
 * @param config - Email service configuration
 * @param result - Research result with content and metadata
 * @param htmlContent - Rendered HTML content for the email
 * @returns Email configuration object ready for sending
 */
function buildEmailConfig(
  config: EmailServiceConfig,
  result: ResearchResult,
  htmlContent: string
): EmailConfig {
  const date = result.generatedAt.toLocaleDateString('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const dayNumber = result.generatedAt.getDay();
  const subject = `Day ${dayNumber} AI Dev Tools Update - ${result.topic.name} - ${date}`;

  return {
    from: config.from,
    to: config.recipients,
    subject,
    html: htmlContent,
  };
}

/**
 * Converts HTML content to plain text for email clients that don't support HTML
 * @param html - HTML content string
 * @returns Plain text version of the content
 */
function extractTextFromHtml(html: string): string {
  // Basic HTML to text conversion for email clients that don't support HTML
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n/g, '\n\n') // Clean up extra whitespace
    .trim();
}

/**
 * Tests email configuration by sending a test message to the first recipient
 * @param deps - Email service dependencies
 * @returns Promise resolving to true if test succeeds, false otherwise
 */
export async function testEmailConfiguration(deps: EmailServiceDeps): Promise<boolean> {
  try {
    await verifyConnection(deps.transporter);

    // Send a test email
    const testEmail = {
      from: deps.config.from,
      to: [deps.config.recipients[0]], // Send to first recipient only
      subject: 'AI Research Automation - Test Email',
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email from your AI Research Automation system.</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>SMTP Host: ${deps.config.host}</li>
          <li>Port: ${deps.config.port}</li>
          <li>From: ${deps.config.from}</li>
        </ul>
        <p>If you received this email, your configuration is working correctly!</p>
      `,
    };

    await deps.transporter.sendMail(testEmail);
    logger.success('Test email sent successfully');
    return true;
  } catch (error) {
    logger.error('Test email failed:', error);
    return false;
  }
}
