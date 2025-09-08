# AIRA - (AI Research Automation)

A prototype for an automated research system that uses Claude Pro to discover and summarize the latest AI/development tools, frameworks, and best practices. Delivers daily email summaries on a rotating schedule of topics tailored for senior software engineers.

This is built in such a way that we may be able to swap out context and desired consumer. For example, amend research topics based on job role ie. UX Designer. The goal is here was to be as low cost as possible, utilising existing personal Anthropic subscriptions. Another pre requisit would be requiring a GMail account... at least until further iteration includes utilising a dedicated email service.

## Features

- **AI-Powered Research**: Uses Claude Sonnet 4 with Research tool for comprehensive, up-to-date findings
- **Automated Email Summaries**: Professional HTML emails with clickable links and code examples
- **Smart Scheduling**: Monday-Friday rotation covering AI/ML, React, AWS/Serverless, DevOps, and VS Code tools
- **Type-Safe**: Built with TypeScript and Zod for runtime validation
- **GitHub Actions**: Free, reliable automation with version control
- **Budget-Friendly**: Only £18/month (Claude Pro subscription as it is currently)

## Research Schedule

| Day           | Topic                      | Focus Areas                                                  |
| ------------- | -------------------------- | ------------------------------------------------------------ |
| **Monday**    | AI/ML Tools & LangChain    | LangChain/LangGraph updates, AI frameworks, vector databases |
| **Tuesday**   | React/Next.js & TypeScript | React 19+, Next.js App Router, TypeScript tooling, testing   |
| **Wednesday** | AWS & Serverless (SST)     | SST framework, Lambda patterns, AWS CDK, serverless APIs     |
| **Thursday**  | DevOps & CI/CD             | GitHub Actions, Docker, Kubernetes, observability tools      |
| **Friday**    | VS Code & Productivity     | Extensions, IDE improvements, developer workflow tools       |

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **AI Research**: Claude Sonnet 4 via Anthropic API
- **Email**: Nodemailer with SMTP (Gmail recommended)
- **Validation**: Zod schemas for type safety
- **Automation**: GitHub Actions (free tier)
- **Architecture**: Functional composition with SOLID principles

## Quick Start

### 1. Repository Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Required environment variables:

- `ANTHROPIC_API_KEY`: Your Claude API key from [console.anthropic.com](https://console.anthropic.com/)
- `EMAIL_USER`: Your Gmail address
- `EMAIL_PASS`: Gmail app password (not your regular password)
- `EMAIL_RECIPIENTS`: Comma-separated list of recipients

### 3. Test Configuration

```bash
# Test email configuration
npm run test:email

# Run manual research (uses today's topic)
npm start
```

### 4. Setup GitHub Actions

1. **Add Repository Secrets** (Settings → Secrets and variables → Actions):
   - `ANTHROPIC_API_KEY`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `EMAIL_RECIPIENTS`

2. **Enable GitHub Actions**:
   - The workflow will automatically run Monday-Friday at 9 AM UTC
   - Manual triggers available for testing

## Usage

### Manual Execution

```bash
# Run today's research topic
npm start

# Test email configuration
npm run test:email

# Development mode with hot reload
npm run dev
```

### Automated Execution

GitHub Actions automatically runs the research Monday-Friday at 9 AM UTC. Check the Actions tab for execution logs and results.

### CLI Options

```bash
npm start -- --help          # Show help
npm start -- --test-email    # Test email only
```

## Development

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Code quality checks
npm run validate
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

## Monitoring & Debugging

### Success Indicators

- GitHub Actions complete without errors
- Email delivery confirmed in logs
- Recipients receive formatted HTML emails
- Token usage logged for cost tracking

### Common Issues & Solutions

#### 1. Authentication Errors

```bash
# Claude API Error
Error: 401 Unauthorized
```

**Solutions:**

- Verify `ANTHROPIC_API_KEY` in repository secrets
- Check API key hasn't expired at console.anthropic.com
- Ensure sufficient credits in Claude account

#### 2. Email Delivery Failures

```bash
# SMTP Auth Error
Error: EAUTH - Authentication failed
```

**Solutions:**

- Use Gmail app password, not regular password
- Enable 2-factor authentication on Gmail
- Check `EMAIL_USER` and `EMAIL_PASS` in secrets

#### 3. Research Quality Issues

```bash
# Empty or irrelevant results
```

**Solutions:**

- Review research topics in `config/research-topics.ts`
- Adjust search terms for current trends
- Modify prompt templates in research service

### Debug Mode

```bash
# Set debug environment
NODE_ENV=development npm start

# Check configuration
npm run validate
```

## Cost Management

### Current Costs

- **Claude Pro**: £18/month (includes Research feature)
- **GitHub Actions**: Free (2,000 minutes/month)
- **Email**: Free (Gmail SMTP)
- **Total**: £18/month

### Token Usage Optimization

- Uses Claude Sonnet 4 (cost-effective)
- Monitors token usage in logs
- Configurable prompt length
- Research caching (future enhancement)

### Scaling Considerations

- GitHub Actions free tier: 2,000 minutes/month
- Current usage: ~5 minutes/day = 100 minutes/month
- Room for 20x growth before hitting limits

## Customization

### Adding New Research Topics

Edit `config/research-topics.ts`:

```typescript
export const RESEARCH_TOPICS: ResearchTopic[] = [
  {
    id: 'custom-topic',
    name: 'Your Custom Topic',
    description: 'Focus area description',
    focusAreas: ['Area 1', 'Area 2'],
    searchTerms: ['term1', 'term2'],
    dayOfWeek: 6, // Saturday (custom schedule)
  },
  // ... existing topics
];
```

### Customizing Email Templates

Modify the `formatAsHtml` function in `src/services/research-service.ts`:

```typescript
function formatAsHtml(content: string, topic: ResearchTopic): string {
  // Custom styling and layout
  return `
    <!DOCTYPE html>
    <html>
      <!-- Your custom email template -->
    </html>
  `;
}
```
