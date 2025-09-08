import Anthropic from '@anthropic-ai/sdk';
import {
  ResearchTopic,
  ResearchResult,
  ClaudeResponseSchema,
  ResearchAutomationError,
} from '../types/schemas.js';
import { createModuleLogger } from '../utils/logger.js';

const logger = createModuleLogger('research-service');

/**
 * Configuration interface for research service dependencies
 */
export interface ResearchServiceDeps {
  anthropicClient: Anthropic;
}

/**
 * Creates research service dependencies with API key
 * @param apiKey - Anthropic API key for Claude access
 * @returns Configured dependencies for research functions
 */
export function createResearchDeps(apiKey: string): ResearchServiceDeps {
  return {
    anthropicClient: new Anthropic({ apiKey }),
  };
}

/**
 * Conducts AI research on a given topic using Claude's research capabilities
 * @param deps - Service dependencies containing Anthropic client
 * @param topic - Research topic configuration with focus areas and search terms
 * @returns Promise resolving to research result with content and metadata
 */
export async function conductResearch(
  deps: ResearchServiceDeps,
  topic: ResearchTopic
): Promise<ResearchResult> {
  try {
    logger.info(`Starting research for: ${topic.name}`);

    const prompt = buildResearchPrompt(topic);
    logger.debug(`Generated prompt for ${topic.id}`);

    const response = await deps.anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.1, // Lower temperature for more focused, factual research
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      // Enable web search tool for real-time research capabilities
      tools: [
        {
          name: 'web_search',
          type: 'web_search_20250305',
          max_uses: 10, // Allow up to 10 searches for comprehensive research
        },
      ],
    });

    // Validate response using Zod schema
    const validatedResponse = ClaudeResponseSchema.parse(response);
    logger.success(`Received response: ${validatedResponse.usage.output_tokens} tokens`);

    // Log web search usage if available
    if (validatedResponse.usage && 'server_tool_use' in validatedResponse.usage) {
      const toolUsage = validatedResponse.usage.server_tool_use as any;
      if (toolUsage?.web_search_requests) {
        logger.info(`Web searches performed: ${toolUsage.web_search_requests}`);
      }
    }

    const content = validatedResponse.content[0]?.text || '';

    if (!content) {
      throw new ResearchAutomationError('Empty response from Claude API', 'EMPTY_RESPONSE');
    }

    // Extract sources from the content
    const sources = extractSources(content);

    const result: ResearchResult = {
      topic,
      content,
      htmlContent: formatAsHtml(content, topic),
      sources,
      generatedAt: new Date(),
      tokenUsage: {
        input: validatedResponse.usage.input_tokens,
        output: validatedResponse.usage.output_tokens,
      },
    };

    logger.success(`Research completed for ${topic.name}. Found ${sources.length} sources.`);
    return result;
  } catch (error) {
    logger.error(`Research failed for ${topic.name}:`, error);

    if (error instanceof Anthropic.APIError) {
      throw new ResearchAutomationError(
        `Claude API error: ${error.message}`,
        'CLAUDE_API_ERROR',
        error.status,
        error.headers?.['retry-after'] ? Number(error.headers['retry-after']) : undefined
      );
    }

    if (error instanceof ResearchAutomationError) {
      throw error;
    }

    throw new ResearchAutomationError(
      `Unexpected error during research: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'UNEXPECTED_ERROR'
    );
  }
}

/**
 * Builds a comprehensive research prompt for Claude based on topic configuration
 * @param topic - Research topic with focus areas and search terms
 * @returns Formatted prompt string for Claude API
 */
function buildResearchPrompt(topic: ResearchTopic): string {
  const focusAreasText = topic.focusAreas.join(', ');
  const searchTermsText = topic.searchTerms.join(', ');

  return `Please use web search to investigate "${topic.name}" and provide a comprehensive research summary.

RESEARCH FOCUS:
${topic.description}

KEY AREAS TO EXPLORE:
${focusAreasText}

SEARCH TERMS TO PRIORITIZE:
${searchTermsText}

REQUIREMENTS:
1. Use web search to find developments from the last 30-90 days
2. Include practical implementation examples and code snippets where relevant
3. Prioritize tools and updates that are production-ready or in stable beta
4. Provide specific next steps and actionable recommendations
5. Include hyperlinks to all sources (documentation, GitHub repos, official announcements)
6. Ensure all information is current and verified through web search

OUTPUT FORMAT:
Please format your response as an email-ready summary with:

- **Executive Summary** (2-3 sentences highlighting the most important findings)
- **Key Developments** (3-5 major updates or new tools, with brief descriptions)
- **Practical Examples** (code snippets or implementation patterns where relevant)
- **Recommended Actions** (specific next steps for developers)
- **Resources & Links** (all source links organized by category)

Use professional but accessible language suitable for senior software engineers. Ensure all links are clickable hyperlinks with descriptive text.`;
}

/**
 * Extracts source links from research content using regex pattern matching
 * @param content - Raw research content from Claude
 * @returns Array of extracted source objects with title and URL
 */
function extractSources(
  content: string
): Array<{ title: string; url: string; description?: string }> {
  // Basic regex to extract links from markdown-style links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const sources: Array<{ title: string; url: string; description?: string }> = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const title = match[1];
    const url = match[2];

    // Basic URL validation
    try {
      new URL(url);
      sources.push({ title, url });
    } catch {
      // Skip invalid URLs
      logger.warn(`Skipping invalid URL: ${url}`);
    }
  }

  return sources;
}

/**
 * Converts research content to formatted HTML email template
 * @param content - Research content in markdown format
 * @param topic - Research topic for context and styling
 * @returns Complete HTML email string with styling and layout
 */
function formatAsHtml(content: string, topic: ResearchTopic): string {
  const date = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Convert markdown to basic HTML
  let htmlContent = content
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^#\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^##\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^###\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> tags in <ul>
  htmlContent = htmlContent.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');

  // Split into paragraphs
  const paragraphs = htmlContent
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => (p.trim().startsWith('<') ? p : `<p>${p}</p>`))
    .join('\n');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIRA: AI Development Tools Research - ${topic.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h2 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    h3 { color: #1e40af; margin-top: 24px; }
    h4 { color: #1e3a8a; }
    pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-family: 'Fira Code', monospace; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul { margin: 12px 0; }
    li { margin: 6px 0; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 24px; }
    .footer { margin-top: 32px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>AIRA: AI Research Automation</h1>
    <p><strong>${topic.name}</strong> | ${date}</p>
  </div>
  
  ${paragraphs}
  
  <div class="footer">
    <p>Generated by AIRA (AI Research Automation) | Powered by Claude Sonnet 4 with Web Search</p>
    <p>Research focused on: ${topic.focusAreas.slice(0, 3).join(', ')}</p>
  </div>
</body>
</html>`;
}
