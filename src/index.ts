#!/usr/bin/env node

import { config } from 'dotenv';
import { conductResearch, createResearchDeps } from './services/research-service.js';
import {
  sendResearchSummary,
  testEmailConfiguration,
  createEmailDeps,
} from './services/email-service.js';
import { getCurrentTopic } from './config/research-topics.js';
import { EnvSchema, ConfigurationError, ResearchAutomationError } from './types/schemas.js';
import { createModuleLogger } from './utils/logger.js';

// Load environment variables
config();

const logger = createModuleLogger('main');

/**
 * Validates and parses environment variables using Zod schema
 * @returns Validated environment configuration object
 * @throws ConfigurationError if validation fails
 */
async function validateEnvironment() {
  try {
    const env = EnvSchema.parse({
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS,
      EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
      EMAIL_PORT: Number(process.env.EMAIL_PORT) || 587,
      EMAIL_RECIPIENTS: process.env.EMAIL_RECIPIENTS,
      NODE_ENV: process.env.NODE_ENV || 'development',
      SCHEDULE: process.env.SCHEDULE,
    });

    logger.success('Environment validation passed');

    // Log schedule configuration
    if (env.SCHEDULE) {
      logger.info(`Custom schedule configured: ${env.SCHEDULE}`);
    } else {
      logger.info('Using default Monday-Friday schedule');
    }

    return env;
  } catch (error) {
    logger.error('Environment validation failed');
    if (error instanceof Error) {
      logger.error('Details:', error.message);
    }
    throw new ConfigurationError('Invalid environment configuration. Check your .env file.');
  }
}

/**
 * Initializes service dependencies with validated environment configuration
 * @param env - Validated environment configuration
 * @returns Object containing initialized service dependencies
 */
async function initializeServices(env: ReturnType<typeof EnvSchema.parse>) {
  try {
    logger.info('Initializing services...');

    const researchDeps = createResearchDeps(env.ANTHROPIC_API_KEY);

    const emailDeps = createEmailDeps({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
      from: env.EMAIL_USER,
      recipients: env.EMAIL_RECIPIENTS.split(',').map(email => email.trim()),
    });

    logger.success('Services initialized successfully');
    return { researchDeps, emailDeps };
  } catch (error) {
    logger.error('Service initialization failed:', error);
    throw new ConfigurationError('Failed to initialize services');
  }
}

/**
 * Main function that orchestrates the daily research automation workflow
 * Conducts research, formats results, and sends email summary
 */
async function runDailyResearch(): Promise<void> {
  const startTime = Date.now();
  logger.info('Starting AI Research Automation');
  logger.info(`Current time: ${new Date().toLocaleString('en-GB')}`);

  // Check for day override from environment variable
  const dayOverride = process.env.DAY;
  if (dayOverride) {
    logger.info(`Day override specified: ${dayOverride.toUpperCase()}`);
  }

  try {
    // Validate environment and initialize services
    const env = await validateEnvironment();
    const { researchDeps, emailDeps } = await initializeServices(env);

    // Get research topic (with optional day override)
    const topic = getCurrentTopic(dayOverride);
    if (!topic) {
      if (dayOverride) {
        logger.error(`No research topic found for day: ${dayOverride}`);
      } else {
        logger.info('No research scheduled for today (check SCHEDULE env var)');
      }
      return;
    }

    logger.info(`Research topic: ${topic.name}`);
    logger.info(`Focus areas: ${topic.focusAreas.slice(0, 3).join(', ')}...`);

    // Conduct research
    const researchResult = await conductResearch(researchDeps, topic);

    logger.info('Research completed:');
    logger.info(
      `  Token usage: ${researchResult.tokenUsage.input} input + ${researchResult.tokenUsage.output} output`
    );
    logger.info(`  Sources found: ${researchResult.sources.length}`);
    logger.info(`  Content length: ${researchResult.content.length} characters`);

    // Send email summary
    await sendResearchSummary(emailDeps, researchResult);

    const duration = (Date.now() - startTime) / 1000;
    logger.success(`Research automation completed successfully in ${duration.toFixed(1)}s`);

    // Log summary for monitoring
    logger.info('\\nSession Summary:');
    logger.info(`  Topic: ${topic.name}`);
    logger.info(`  Duration: ${duration.toFixed(1)}s`);
    logger.info(
      `  Tokens used: ${researchResult.tokenUsage.input + researchResult.tokenUsage.output}`
    );
    logger.info(`  Email sent: YES`);
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    logger.error(`Research automation failed after ${duration.toFixed(1)}s`);

    if (error instanceof ResearchAutomationError) {
      logger.error(`Error Type: ${error.code}`);
      logger.error(`Message: ${error.message}`);

      if (error.statusCode) {
        logger.error(`Status Code: ${error.statusCode}`);
      }

      if (error.retryAfter) {
        logger.error(`Retry After: ${error.retryAfter} seconds`);
      }
    } else if (error instanceof Error) {
      logger.error(`Unexpected Error: ${error.message}`);
      logger.error(`Stack Trace:`, error.stack);
    } else {
      logger.error('Unknown error occurred:', error);
    }

    // Exit with error code for CI/CD monitoring
    process.exit(1);
  }
}

/**
 * Handles CLI arguments and routes to appropriate functionality
 * Supports test mode and help commands
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--test-email')) {
    logger.info('Running email configuration test...');
    try {
      const env = await validateEnvironment();
      const { emailDeps } = await initializeServices(env);
      const success = await testEmailConfiguration(emailDeps);

      if (success) {
        logger.success('Email test completed successfully');
        process.exit(0);
      } else {
        logger.error('Email test failed');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Email test failed with error:', error);
      process.exit(1);
    }
    return;
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
AI Research Automation

Usage:
  npm start                 Run daily research automation (based on current day)
  npm run research:mon      Run Monday's research (AI/ML & LangChain)
  npm run research:tue      Run Tuesday's research (React/Next.js)
  npm run research:wed      Run Wednesday's research (AWS & SST)
  npm run research:thu      Run Thursday's research (DevOps & CI/CD)
  npm run research:fri      Run Friday's research (VS Code & Productivity)
  npm run test:email        Test email configuration
  npm run dev              Run in development mode

Research Topics:
  research:mon             AI/ML Development Tools & LangChain Ecosystem
  research:tue             React/Next.js & TypeScript Ecosystem  
  research:wed             AWS & Serverless Architecture (SST Focus)
  research:thu             DevOps, CI/CD & Development Automation
  research:fri             VS Code Extensions & Developer Productivity

Environment Variables Required:
  ANTHROPIC_API_KEY        Your Claude API key
  EMAIL_USER              Gmail address for sending
  EMAIL_PASS              Gmail app password
  EMAIL_RECIPIENTS        Comma-separated list of recipient emails
  EMAIL_HOST              SMTP host (default: smtp.gmail.com)
  EMAIL_PORT              SMTP port (default: 587)
  SCHEDULE                Comma-separated days (optional): mon,thu

Examples:
  npm start                        # Run today's research
  npm run research:mon             # Test Monday's AI/ML research
  npm run test:email               # Test email configuration
  SCHEDULE=mon,thu npm start       # Run with custom schedule
    `);
    return;
  }

  await runDailyResearch();
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('Application failed to start:', error);
    process.exit(1);
  });
}
