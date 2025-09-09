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

    // Test mode configuration
    const isTestMode = process.env.TEST_CONNECTIONS === 'true';
    const prompt = buildResearchPrompt(topic);
    logger.debug(`Research prompt generated for ${topic.id}`);

    if (isTestMode) {
      logger.debug(`Test mode prompt: ${prompt}`);
      logger.info('Running in TEST_CONNECTIONS mode - minimal tokens and searches');
    } else {
      logger.info('Running in normal research mode');
    }

    const maxTokens = isTestMode ? 500 : 3000;
    const maxSearches = isTestMode ? 1 : 5;

    const response = await deps.anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
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
          max_uses: maxSearches,
        },
      ],
    });

    // Validate response using Zod schema
    const validatedResponse = ClaudeResponseSchema.parse(response);
    logger.success(
      `Response received: ${validatedResponse.usage.input_tokens} input + ${validatedResponse.usage.output_tokens} output tokens`
    );

    // Token usage tracking
    const totalTokens =
      validatedResponse.usage.input_tokens + validatedResponse.usage.output_tokens;
    logger.info(
      `Total tokens used: ${totalTokens} (estimated cost: $${(totalTokens * 0.000003).toFixed(4)})`
    );

    // Log content block analysis
    const textBlocks = validatedResponse.content.filter(block => block.type === 'text');
    const toolBlocks = validatedResponse.content.filter(block => block.type !== 'text');
    logger.debug(`Content blocks: ${textBlocks.length} text, ${toolBlocks.length} tool use`);

    // Extract text content from response (Claude's final research summary)
    const textContent = textBlocks
      .map(block => (block as any).text)
      .filter(text => text && text.trim())
      .join('\n\n');

    const content = textContent || '';

    if (!content) {
      throw new ResearchAutomationError('Empty response from Claude API', 'EMPTY_RESPONSE');
    }

    // Extract sources from the content
    const sources = extractSourcesFromMarkdown(content);

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
 * Builds a research prompt for Claude based on topic configuration
 * @param topic - Research topic with focus areas and search terms
 * @returns Formatted prompt string for Claude API
 */
function buildResearchPrompt(topic: ResearchTopic): string {
  const isTestMode = process.env.TEST_CONNECTIONS === 'true';

  if (isTestMode) {
    return `Search for "MCP (Model Context Protocol)" and provide:
- Brief summary (1-2 sentences)
- One key finding
- Source link

Markdown format only.`;
  }

  const focusAreasText = topic.focusAreas.slice(0, 4).join(', ');
  const searchTermsText = topic.searchTerms.slice(0, 5).join(', ');

  return `Research "${topic.name}" focusing on developments from the last 60 days.

**Focus Areas:** ${focusAreasText}
**Search Terms:** ${searchTermsText}

Requirements:
- Use web search for current information
- Include practical examples where relevant
- Provide source links for all claims
- Output in markdown format only

Structure:
## Executive Summary
[2-3 sentences of key findings]

## Key Developments
- **Tool/Update Name**: Brief description [source link]
- **Tool/Update Name**: Brief description [source link]

## Practical Examples
[Code snippets if relevant]

## Resources
- [Link text](URL) - Description
- [Link text](URL) - Description`;
}

/**
 * Extracts source links from research content using regex pattern matching
 * @param content - Raw research content from Claude
 * @returns Array of extracted source objects with title and URL
 */
function extractSourcesFromMarkdown(
  content: string
): Array<{ title: string; url: string; description?: string }> {
  const sources: Array<{ title: string; url: string; description?: string }> = [];

  // Match markdown links [text](url) and extract more context
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const url = match[2].trim();

    // URL validation
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        // Avoid duplicates
        if (!sources.find(s => s.url === url)) {
          sources.push({
            title,
            url,
            description: `Source from ${parsedUrl.hostname}`,
          });
        }
      }
    } catch {
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

  // Markdown to HTML conversion
  let htmlContent = content
    // Headers
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    // Bold and italic
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Links with improved parsing
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Lists
    .replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> tags in <ul>
  htmlContent = htmlContent.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/gs, '<ul>$&</ul>');

  // Split into paragraphs and clean up
  const paragraphs = htmlContent
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<pre')) {
        return trimmed;
      }
      return `<p>${trimmed}</p>`;
    })
    .join('\n\n');

  // Email template with modern styling
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIRA: ${topic.name}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; 
      line-height: 1.6; 
      color: #1f2937; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px; 
      background-color: #f9fafb;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 24px; 
      text-align: center;
    }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 16px; }
    .content { padding: 32px; }
    h2 { 
      color: #1e40af; 
      border-bottom: 2px solid #e5e7eb; 
      padding-bottom: 8px; 
      margin-top: 32px; 
      margin-bottom: 16px;
    }
    h3 { color: #1e3a8a; margin-top: 24px; margin-bottom: 12px; }
    h4 { color: #312e81; margin-top: 20px; margin-bottom: 10px; }
    pre { 
      background: #f3f4f6; 
      padding: 16px; 
      border-radius: 8px; 
      overflow-x: auto; 
      font-size: 14px;
      border-left: 4px solid #6366f1;
    }
    code { 
      background: #f3f4f6; 
      padding: 2px 6px; 
      border-radius: 4px; 
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; 
      font-size: 14px;
    }
    a { 
      color: #2563eb; 
      text-decoration: none; 
      border-bottom: 1px solid transparent;
      transition: border-color 0.2s;
    }
    a:hover { border-bottom-color: #2563eb; }
    ul { margin: 12px 0; padding-left: 20px; }
    li { margin: 6px 0; }
    p { margin: 12px 0; }
    .footer { 
      margin-top: 32px; 
      padding: 20px; 
      background: #f9fafb; 
      border-radius: 8px; 
      font-size: 14px; 
      color: #6b7280; 
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AIRA: AI Research Automation</h1>
      <p><strong>${topic.name}</strong> | ${date}</p>
    </div>
    
    <div class="content">
      ${paragraphs}
    </div>
    
    <div class="footer">
      <p>Generated by AIRA (AI Research Automation) | Powered by Claude Sonnet 4</p>
      <p>Focus: ${topic.focusAreas.slice(0, 3).join(' • ')}</p>
    </div>
  </div>
</body>
</html>`;
}
