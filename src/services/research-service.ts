import Anthropic from '@anthropic-ai/sdk';
import {
  ResearchTopic,
  ResearchResult,
  StructuredResearch,
  StructuredResearchSchema,
  ClaudeResponseSchema,
  ResearchAutomationError,
} from '../types/schemas.js';
import { createModuleLogger } from '../utils/logger.js';
import { clearTerminalLine, loadingAnimation } from '../utils/terminal-animation.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const isTestMode = process.env.TEST_CONNECTIONS === 'true';
  logger.info(`Starting research ${isTestMode ? 'in TEST_MODE' : `for: ${topic.name}`}`);

  const prompt = buildStructuredResearchPrompt(topic);

  if (isTestMode) {
    logger.info('Running in TEST_CONNECTIONS mode - minimal tokens and searches');
  }

  // Track claude query load time
  const llmLoadTime = Date.now();
  const loadingSpinner = loadingAnimation('Conducting research with Claude AI...');

  const maxTokens = isTestMode ? 4000 : 8000;
  const maxSearches = isTestMode ? 1 : 5; // KEEP in mind, more searches may yield better results BUT costs loads more

  const clearState = () => {
    clearInterval(loadingSpinner);
    clearTerminalLine();
  };

  try {
    const response = await deps.anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      tools: [
        {
          name: 'web_search',
          type: 'web_search_20250305',
          max_uses: maxSearches,
        },
      ],
    });

    // Clean up terminal state
    clearState();

    if (response) {
      // Write Claude response to last-llm-response file for logging/debugging
      const fs = await import('fs/promises');
      const logFilePath = path.resolve(__dirname, '../../notes/anthropic-logs/last-llm-response');
      try {
        await fs.writeFile(logFilePath, JSON.stringify(response, null, 2), 'utf8');
      } catch (fileErr) {
        logger.warn('Failed to write Claude response to last-llm-response file:', fileErr);
      }
      const llmDuration = Date.now() - llmLoadTime;
      logger.info(`Claude response received in ${llmDuration}ms`);
    }

    // Validate response using Zod schema
    const validatedResponse = ClaudeResponseSchema.parse(response);
    logger.success(
      `Response received: ${validatedResponse.usage.input_tokens} input + ${validatedResponse.usage.output_tokens} output tokens`
    );

    // Extract and parse structured research data
    const textBlocks = validatedResponse.content.filter(block => block.type === 'text');
    const rawContent = textBlocks
      .map(block => (block as any).text)
      .filter(text => text && text.trim())
      .join('\n\n');

    if (!rawContent) {
      throw new ResearchAutomationError('Empty response from Claude API', 'EMPTY_RESPONSE');
    }

    // Parse structured data from Claude's response
    const structuredData = parseStructuredResponse(rawContent);

    const result: ResearchResult = {
      topic,
      structuredData,
      htmlContent: '', // Will be rendered by email service
      generatedAt: new Date(),
      tokenUsage: {
        input: validatedResponse.usage.input_tokens,
        output: validatedResponse.usage.output_tokens,
      },
    };

    logger.success(
      `Research completed for ${topic.name}. ` +
        `Found ${structuredData.keyFindings.length} findings, ` +
        `${structuredData.recommendedResources.length} resources, ` +
        `${structuredData.sources.length} sources.`
    );

    return result;
  } catch (error) {
    logger.error(`Research failed ${isTestMode ? 'in TEST_MODE' : ` for ${topic.name}:`}`, error);

    // Clean up terminal state
    clearState();

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
 * Builds a structured research prompt for Claude
 * @param topic - Research topic with focus areas and search terms
 * @returns Formatted prompt requesting structured JSON response
 */
function buildStructuredResearchPrompt(topic: ResearchTopic): string {
  const isTestMode = process.env.TEST_CONNECTIONS === 'true';

  if (isTestMode) {
    return `Research new industry updates related "MCP (Model Context Protocol)", pay close attention to new MCP Servers available or emerging trends. Then return a JSON object with this exact structure:

{
  "executiveSummary": "Brief 1-2 sentence summary",
  "keyFindings": [
    {
      "title": "Finding title",
      "description": "Brief description",
      "category": "tool",
      "importance": "high",
      "actionable": true
    }
  ],
  "recommendedResources": [
    {
      "name": "Resource name",
      "url": "https://example.com",
      "description": "Brief description",
      "type": "documentation"
    }
  ],
  "codeExamples": [],
  "sources": [
    {
      "title": "Source title",
      "url": "https://example.com",
      "credibility": "official",
      "relevance": "high"
    }
  ]
}

Important:
- Return ONLY valid, complete JSON, with no truncation or missing brackets.
- Wrap your output in triple backticks with a json tag, like this:
\`\`\`
\`\`\`json
{ ...your JSON here... }
\`\`\`
\`\`\`
- Do not include any other text, explanation, or formatting.`;
  }

  const focusAreasText = topic.focusAreas.slice(0, 4).join(', ');
  const searchTermsText = topic.searchTerms.slice(0, 5).join(', ');

  return `Research "${topic.name}" focusing on developments from the last 60 days.

**Focus Areas:** ${focusAreasText}
**Search Terms:** ${searchTermsText}

Use web search to find current information and return ONLY a JSON object with this exact structure:

{
  "executiveSummary": "2-3 sentences summarizing the key findings and trends",
  "keyFindings": [
    {
      "title": "Name of tool/framework/technique",
      "description": "Detailed description of what it is and why it matters",
      "category": "tool" | "framework" | "technique" | "update" | "trend",
      "importance": "high" | "medium" | "low",
      "actionable": true | false
    }
  ],
  "recommendedResources": [
    {
      "name": "Resource name",
      "url": "https://actual-working-url.com",
      "description": "What this resource provides",
      "type": "documentation" | "tutorial" | "tool" | "article" | "video" | "repository"
    }
  ],
  "codeExamples": [
    {
      "title": "Example title",
      "language": "typescript",
      "code": "// Actual working code example",
      "description": "What this code demonstrates"
    }
  ],
  "sources": [
    {
      "title": "Source title from web search",
      "url": "https://actual-source-url.com",
      "credibility": "official" | "community" | "blog" | "news",
      "relevance": "high" | "medium" | "low"
    }
  ]
}

Requirements:
- Include 3-5 key findings
- Include 3-6 recommended resources with working URLs
- Include 1-2 practical code examples if relevant
- Include all sources from web search

Important:
- Return ONLY valid, complete JSON, with no truncation or missing brackets.
- Wrap your output in triple backticks with a json tag, like this:
\`\`\`
\`\`\`json
{ ...your JSON here... }
\`\`\`
\`\`\`
- Do not include any other text, explanation, or formatting.`;
}

/**
 * Parses structured research response from Claude
 * @param rawContent - Raw text response from Claude API
 * @returns Validated structured research data
 */
function parseStructuredResponse(rawContent: string): StructuredResearch {
  try {
    // Claude might return the JSON wrapped in markdown code blocks or extra text
    let jsonContent = rawContent.trim();

    // Extract JSON from code blocks if present
    const jsonMatch = jsonContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    // Remove any leading/trailing text that isn't JSON
    const jsonStart = jsonContent.indexOf('{');
    const jsonEnd = jsonContent.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonContent = jsonContent.slice(jsonStart, jsonEnd + 1);
    }

    const parsedData = JSON.parse(jsonContent);

    // Validate and transform the data using Zod
    const validatedData = StructuredResearchSchema.parse(parsedData);

    logger.debug('Successfully parsed structured research data');
    return validatedData;
  } catch (error) {
    logger.error('Failed to parse structured response:', error);
    logger.debug('Raw content:', rawContent);

    // Return fallback structured data
    return createFallbackStructuredData(rawContent);
  }
}

/**
 * Creates fallback structured data when parsing fails
 * @param rawContent - Original raw content from Claude
 * @returns Basic structured research data
 */
function createFallbackStructuredData(rawContent: string): StructuredResearch {
  logger.warn('Using fallback structured data due to parsing failure');

  // Extract any URLs from the content as sources
  const urlRegex = /https?:\/\/[^\s)]+/g;
  const urls = rawContent.match(urlRegex) || [];

  return {
    executiveSummary:
      'Research data was received but could not be parsed into the expected structure. Please review the raw content.',
    keyFindings: [
      {
        title: 'Parsing Error',
        description:
          'The research response could not be structured automatically. Manual review may be required.',
        category: 'update' as const,
        importance: 'medium' as const,
        actionable: false,
      },
    ],
    recommendedResources: urls.slice(0, 3).map((url, index) => ({
      name: `Resource ${index + 1}`,
      url,
      description: 'Extracted from research content',
      type: 'article' as const,
    })),
    codeExamples: [],
    sources: urls.slice(0, 5).map((url, index) => ({
      title: `Source ${index + 1}`,
      url,
      credibility: 'community' as const,
      relevance: 'medium' as const,
    })),
  };
}
