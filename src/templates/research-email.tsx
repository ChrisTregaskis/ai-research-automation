import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Link,
  Hr,
  CodeBlock,
  dracula,
  Preview,
} from '@react-email/components';
import type { ResearchTopic, StructuredResearch } from '../types/schemas.js';

interface ResearchEmailProps {
  topic: ResearchTopic;
  research: StructuredResearch;
  generatedAt: Date;
}

export const ResearchEmail: React.FC<ResearchEmailProps> = ({ topic, research, generatedAt }) => {
  const formattedDate = generatedAt.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const previewText = `${topic.name} - ${research.executiveSummary.slice(0, 100)}...`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>AI Dev Tools Research</Heading>
            <Text style={headerSubtitle}>
              {topic.name} • {formattedDate}
            </Text>
          </Section>

          {/* Executive Summary */}
          <Section style={section}>
            <Heading style={sectionTitle}>Executive Summary</Heading>
            <Text style={summaryText}>{research.executiveSummary}</Text>
          </Section>

          <Hr style={divider} />

          {/* Key Findings */}
          <Section style={section}>
            <Heading style={sectionTitle}>Key Findings</Heading>
            {research.keyFindings.map((finding, index) => (
              <div key={index} style={findingCard}>
                <div style={findingHeader}>
                  <Heading style={findingTitle}>{finding.title}</Heading>
                  <span style={getPriorityBadge(finding.importance)}>
                    {finding.importance.toUpperCase()}
                  </span>
                </div>
                <Text style={findingDescription}>{finding.description}</Text>
                <div style={findingMeta}>
                  <span style={categoryBadge}>{finding.category}</span>
                  {finding.actionable && <span style={actionableBadge}>Actionable</span>}
                </div>
              </div>
            ))}
          </Section>

          <Hr style={divider} />

          {/* Code Examples */}
          {research.codeExamples && research.codeExamples.length > 0 && (
            <>
              <Section style={section}>
                <Heading style={sectionTitle}>Code Examples</Heading>
                {research.codeExamples.map((example, index) => {
                  // Map language string to PrismLanguage type (fallback to 'typescript' if unknown)
                  const prismLanguage = [
                    'typescript',
                    'javascript',
                    'python',
                    'json',
                    'bash',
                    'tsx',
                    'jsx',
                  ].includes(example.language)
                    ? (example.language as any)
                    : 'typescript';
                  return (
                    <div key={index} style={codeCard}>
                      <Heading style={codeTitle}>{example.title}</Heading>
                      <Text style={codeDescription}>{example.description}</Text>
                      <div style={codeBlock}>
                        <div style={codeLanguage}>{prismLanguage}</div>
                        <CodeBlock code={example.code} language={prismLanguage} theme={dracula} />
                      </div>
                    </div>
                  );
                })}
              </Section>
              <Hr style={divider} />
            </>
          )}

          {/* Recommended Resources */}
          <Section style={section}>
            <Heading style={sectionTitle}>Recommended Resources</Heading>
            {research.recommendedResources.map((resource, index) => (
              <div key={index} style={resourceCard}>
                <div style={resourceHeader}>
                  <Link href={resource.url} style={resourceLink}>
                    {resource.name} →
                  </Link>
                  <span style={getResourceTypeBadge(resource.type)}>{resource.type}</span>
                </div>
                <Text style={resourceDescription}>{resource.description}</Text>
              </div>
            ))}
          </Section>

          <Hr style={divider} />

          {/* Sources */}
          <Section style={section}>
            <Heading style={sectionTitle}>Sources & References</Heading>
            <div style={sourcesList}>
              {research.sources.map((source, index) => (
                <div key={index} style={sourceItem}>
                  <Link href={source.url} style={sourceLink}>
                    {source.title}
                  </Link>
                  <div style={sourceMeta}>
                    <span style={getCredibilityBadge(source.credibility)}>
                      {source.credibility}
                    </span>
                    <span style={getRelevanceBadge(source.relevance)}>
                      {source.relevance} relevance
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Generated by AI Research Automation • Focus areas: {topic.focusAreas.join(', ')}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Helper functions for dynamic badge styles
const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
  const colors = {
    high: '#dc2626',
    medium: '#ea580c',
    low: '#16a34a',
  };

  return {
    ...priorityBadge,
    backgroundColor: colors[priority],
  };
};

const getResourceTypeBadge = (type: string) => ({
  ...typeBadge,
  backgroundColor: getTypeColor(type),
});

const getCredibilityBadge = (credibility: string) => ({
  ...credibilityBadge,
  backgroundColor: getCredibilityColor(credibility),
});

const getRelevanceBadge = (relevance: string) => ({
  ...relevanceBadge,
  backgroundColor: getRelevanceColor(relevance),
});

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    documentation: '#1e40af',
    tutorial: '#7c2d12',
    tool: '#059669',
    article: '#7c3aed',
    video: '#dc2626',
    repository: '#1f2937',
  };
  return colors[type] || '#6b7280';
};

const getCredibilityColor = (credibility: string) => {
  const colors: Record<string, string> = {
    official: '#059669',
    community: '#0891b2',
    blog: '#7c3aed',
    news: '#dc2626',
  };
  return colors[credibility] || '#6b7280';
};

const getRelevanceColor = (relevance: string) => {
  const colors: Record<string, string> = {
    high: '#059669',
    medium: '#ea580c',
    low: '#6b7280',
  };
  return colors[relevance] || '#6b7280';
};

// Styles
const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  margin: '0 auto',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '0',
};

const header = {
  backgroundColor: '#1e293b',
  borderRadius: '8px 8px 0 0',
  padding: '32px',
  textAlign: 'center' as const,
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const headerSubtitle = {
  color: '#cbd5e1',
  fontSize: '16px',
  margin: '0',
};

const section = {
  padding: '24px 32px',
};

const sectionTitle = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const summaryText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
};

const findingCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  marginBottom: '16px',
  padding: '16px',
};

const findingHeader = {
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '8px',
};

const findingTitle = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const priorityBadge = {
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: '600',
  padding: '2px 6px',
  textTransform: 'uppercase' as const,
};

const findingDescription = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px 0',
};

const findingMeta = {
  display: 'flex',
  gap: '8px',
};

const categoryBadge = {
  backgroundColor: '#3b82f6',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: '500',
  padding: '2px 6px',
  textTransform: 'capitalize' as const,
};

const actionableBadge = {
  backgroundColor: '#10b981',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: '500',
  padding: '2px 6px',
};

const codeCard = {
  marginBottom: '24px',
};

const codeTitle = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const codeDescription = {
  color: '#4b5563',
  fontSize: '14px',
  margin: '0 0 12px 0',
};

const codeBlock = {
  backgroundColor: '#1e293b',
  borderRadius: '6px',
  overflow: 'hidden',
};

const codeLanguage = {
  backgroundColor: '#334155',
  color: '#cbd5e1',
  fontSize: '12px',
  fontWeight: '500',
  padding: '8px 12px',
};

const resourceCard = {
  borderBottom: '1px solid #e2e8f0',
  marginBottom: '16px',
  paddingBottom: '16px',
};

const resourceHeader = {
  alignItems: 'center',
  display: 'flex',
  gap: '12px',
  marginBottom: '8px',
};

const resourceLink = {
  color: '#3b82f6',
  fontSize: '16px',
  fontWeight: '500',
  textDecoration: 'none',
};

const typeBadge = {
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: '500',
  padding: '2px 6px',
  textTransform: 'capitalize' as const,
};

const resourceDescription = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
};

const sourcesList = {
  display: 'block',
};

const sourceItem = {
  marginBottom: '12px',
  paddingBottom: '12px',
  borderBottom: '1px solid #f1f5f9',
};

const sourceLink = {
  color: '#3b82f6',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  display: 'block',
  marginBottom: '4px',
};

const sourceMeta = {
  display: 'flex',
  gap: '8px',
};

const credibilityBadge = {
  borderRadius: '3px',
  color: '#ffffff',
  fontSize: '9px',
  fontWeight: '500',
  padding: '2px 4px',
  textTransform: 'capitalize' as const,
};

const relevanceBadge = {
  borderRadius: '3px',
  color: '#ffffff',
  fontSize: '9px',
  fontWeight: '500',
  padding: '2px 4px',
};

const divider = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '0',
};

const footer = {
  backgroundColor: '#f8fafc',
  borderRadius: '0 0 8px 8px',
  padding: '24px 32px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
};

export default ResearchEmail;
