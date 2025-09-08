import { z } from 'zod';

// Environment configuration schema
export const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'Anthropic API key is required'),
  EMAIL_USER: z.string().email('Valid email address required'),
  EMAIL_PASS: z.string().min(1, 'Email password is required'),
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.number().default(587),
  EMAIL_RECIPIENTS: z.string().min(1, 'At least one recipient required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Research topic schema
export const ResearchTopicSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  focusAreas: z.array(z.string()),
  searchTerms: z.array(z.string()),
  dayOfWeek: z.number().min(1).max(5), // Monday = 1, Friday = 5
});

// Claude API response schema
export const ClaudeResponseSchema = z.object({
  id: z.string(),
  type: z.literal('message'),
  role: z.literal('assistant'),
  content: z.array(
    z.object({
      type: z.literal('text'),
      text: z.string(),
    })
  ),
  model: z.string(),
  stop_reason: z.string().nullable(),
  stop_sequence: z.string().nullable(),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
  }),
});

// Email configuration schema
export const EmailConfigSchema = z.object({
  from: z.string().email(),
  to: z.array(z.string().email()),
  subject: z.string(),
  html: z.string(),
  text: z.string().optional(),
});

// Research result schema
export const ResearchResultSchema = z.object({
  topic: ResearchTopicSchema,
  content: z.string(),
  htmlContent: z.string(),
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string().url(),
      description: z.string().optional(),
    })
  ),
  generatedAt: z.date(),
  tokenUsage: z.object({
    input: z.number(),
    output: z.number(),
  }),
});

// Error types for better error handling
export const ApiErrorSchema = z.object({
  type: z.enum(['api_error', 'authentication_error', 'rate_limit_error', 'validation_error']),
  message: z.string(),
  code: z.string().optional(),
  statusCode: z.number().optional(),
  retryAfter: z.number().optional(),
});

// Type exports
export type Env = z.infer<typeof EnvSchema>;
export type ResearchTopic = z.infer<typeof ResearchTopicSchema>;
export type ClaudeResponse = z.infer<typeof ClaudeResponseSchema>;
export type EmailConfig = z.infer<typeof EmailConfigSchema>;
export type ResearchResult = z.infer<typeof ResearchResultSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

// Custom error classes
export class ResearchAutomationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'ResearchAutomationError';
  }
}

export class ConfigurationError extends ResearchAutomationError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}
