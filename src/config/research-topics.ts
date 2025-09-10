import { ResearchTopic } from '../types/schemas.js';

export const RESEARCH_TOPICS: ResearchTopic[] = [
  {
    id: 'ai-tools',
    name: 'AI Development Tools & LangChain Ecosystem',
    description: 'Latest AI tools, LangChain/LangGraph updates, and development frameworks',
    focusAreas: [
      'LangChain and LangGraph framework updates',
      'AI development tools and SDKs',
      'AI agent frameworks and orchestration',
      'Vector databases and RAG implementations',
      'AI debugging and monitoring tools',
      'Model Context Protocols (MCP) for AI',
    ],
    searchTerms: [
      'LangChain updates 2025',
      'LangGraph new features',
      'AI development tools',
      'vector database tools',
      'RAG implementation frameworks',
      'AI agent development',
      'Model Context Protocols AI',
    ],
    dayOfWeek: 1,
  },
  {
    id: 'devops-automation',
    name: 'DevOps, CI/CD & Development Automation',
    description: 'DevOps tools, CI/CD improvements, and development automation',
    focusAreas: [
      'GitHub Actions and CI/CD improvements',
      'Docker and containerization tools',
      'Kubernetes development tools',
      'Infrastructure monitoring and observability',
      'Development environment automation',
      'Security and compliance tools',
    ],
    searchTerms: [
      'GitHub Actions new features',
      'Docker development tools',
      'Kubernetes developer experience',
      'observability tools 2025',
      'development automation',
      'DevSecOps tools',
    ],
    dayOfWeek: 2,
  },
  {
    id: 'aws-serverless',
    name: 'AWS & Serverless Architecture (SST Focus)',
    description: 'AWS services, serverless patterns, and SST (Serverless Stack) updates',
    focusAreas: [
      'SST (Serverless Stack) framework updates',
      'AWS Lambda and serverless patterns',
      'AWS CDK and infrastructure as code',
      'API Gateway and serverless APIs',
      'DynamoDB and serverless databases',
      'AWS AI/ML services integration',
    ],
    searchTerms: [
      'SST Serverless Stack updates',
      'AWS Lambda new features',
      'AWS CDK patterns',
      'serverless architecture 2025',
      'AWS API Gateway improvements',
      'DynamoDB best practices',
    ],
    dayOfWeek: 3,
  },
  {
    id: 'react-ecosystem',
    name: 'React/Next.js & TypeScript Ecosystem',
    description: 'React, Next.js, TypeScript tools and best practices',
    focusAreas: [
      'React 19+ features and tools',
      'Next.js App Router and server components',
      'TypeScript tooling improvements',
      'State management solutions',
      'Testing frameworks (Vitest, Playwright)',
      'Performance optimization tools',
      'Model Context Protocols (MCP) for React/TypeScript',
    ],
    searchTerms: [
      'React 19 new features',
      'Next.js App Router tools',
      'TypeScript development tools',
      'Vitest testing updates',
      'Playwright automation',
      'React performance tools',
      'Model Context Protocols React TypeScript',
    ],
    dayOfWeek: 4,
  },
  {
    id: 'vscode-productivity',
    name: 'VS Code Extensions & Developer Productivity',
    description: 'VS Code extensions, IDE improvements, and developer productivity tools',
    focusAreas: [
      'VS Code extensions for AI development',
      'Code quality and formatting tools',
      'Git and version control enhancements',
      'API development and testing tools',
      'Code generation and AI assistance',
      'Developer workflow optimization',
      'Model Context Protocols (MCP) for VS Code',
    ],
    searchTerms: [
      'VS Code AI extensions',
      'Prettier and ESLint updates',
      'Git productivity tools',
      'API testing tools',
      'code generation tools',
      'developer productivity 2025',
      'Model Context Protocols VS Code',
    ],
    dayOfWeek: 5,
  },
];

/**
 * Checks if research should run today based on SCHEDULE environment variable
 * @returns boolean indicating if research should run
 */
export function shouldRunToday(): boolean {
  const scheduleEnv = process.env.SCHEDULE?.toLowerCase();

  if (!scheduleEnv) {
    // Default: Monday through Friday
    const today = new Date().getDay();
    return today >= 1 && today <= 5;
  }

  // Parse SCHEDULE env var: "mon,thu" or "monday,thursday"
  const allowedDays = scheduleEnv.split(',').map(day => day.trim());
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Map current day to abbreviations
  const dayAbbreviations: Record<number, string[]> = {
    1: ['mon', 'monday'],
    2: ['tue', 'tuesday'],
    3: ['wed', 'wednesday'],
    4: ['thu', 'thursday'],
    5: ['fri', 'friday'],
  };

  const todayAbbrs = dayAbbreviations[dayOfWeek] || [];
  return allowedDays.some(day => todayAbbrs.includes(day));
}

/**
 * Day abbreviation mapping for CLI arguments
 */
const DAY_ABBREVIATIONS: Record<string, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
};

/**
 * Gets research topic by day of week number
 * @param dayOfWeek - Day of week (1=Monday, 5=Friday)
 * @returns Research topic or null if not found
 */
export const getTopicByDay = (dayOfWeek: number): ResearchTopic | null => {
  return RESEARCH_TOPICS.find(topic => topic.dayOfWeek === dayOfWeek) || null;
};

/**
 * Gets research topic by day abbreviation
 * @param dayAbbr - Day abbreviation (mon, tue, wed, thu, fri)
 * @returns Research topic or null if not found
 */
export const getTopicByDayAbbr = (dayAbbr: string): ResearchTopic | null => {
  const dayNumber = DAY_ABBREVIATIONS[dayAbbr.toLowerCase()];
  return dayNumber ? getTopicByDay(dayNumber) : null;
};

/**
 * Enhanced getCurrentTopic that respects scheduling configuration
 */
export const getCurrentTopic = (dayOverride?: string): ResearchTopic | null => {
  // If day override provided, ignore scheduling constraints
  if (dayOverride) {
    return getTopicByDayAbbr(dayOverride);
  }

  // Check if we should run today
  if (!shouldRunToday()) {
    console.info('Research not scheduled for today based on SCHEDULE environment variable');
    return null;
  }

  const today = new Date();
  const dayOfWeek = today.getDay();

  // Handle weekends - default to Monday's topic
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return getTopicByDay(1);
  }

  return getTopicByDay(dayOfWeek);
};
