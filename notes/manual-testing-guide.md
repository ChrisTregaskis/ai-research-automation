# Manual Testing Guide for Research Topics

*Guide for testing each research topic manually using semantic npm scripts*

## Overview

This guide provides instructions for manually testing each research topic using clean, semantic npm scripts. Each day has its own dedicated npm command for easy testing.

## Prerequisites

- ✅ Environment configured (`.env` file with API keys)
- ✅ Dependencies installed (`npm install`)
- ✅ Project built (`npm run build`)
- ✅ Email test passed (`npm run test:email`)

## Quick Test Commands

### Test Specific Research Topics

```bash
# Monday - AI/ML Development Tools & LangChain Ecosystem
npm run research:mon

# Tuesday - React/Next.js & TypeScript Ecosystem  
npm run research:tue

# Wednesday - AWS & Serverless Architecture (SST Focus)
npm run research:wed

# Thursday - DevOps, CI/CD & Development Automation
npm run research:thu

# Friday - VS Code Extensions & Developer Productivity
npm run research:fri
```

### Test Today's Topic (Based on Current Day)
```bash
npm start
```

## Research Topics Reference

| Command | Topic Name | Focus Areas |
|---------|------------|-------------|
| `npm run research:mon` | AI/ML Tools & LangChain | LangChain/LangGraph, AI frameworks, vector databases |
| `npm run research:tue` | React/Next.js & TypeScript | React 19+, Next.js App Router, testing frameworks |
| `npm run research:wed` | AWS & Serverless (SST) | SST framework, Lambda, AWS CDK, serverless APIs |
| `npm run research:thu` | DevOps & CI/CD | GitHub Actions, Docker, Kubernetes, observability |
| `npm run research:fri` | VS Code & Productivity | Extensions, IDE improvements, developer tools |

## Comprehensive Testing Workflow

### 1. Test All Topics (Recommended)

Run each topic systematically to evaluate the complete workflow:

```bash
# Test Monday's AI/ML research
npm run research:mon

# Wait for completion, then test Tuesday
npm run research:tue

# Continue with remaining days
npm run research:wed
npm run research:thu
npm run research:fri
```

### 2. Quick Quality Check

Test a few topics to verify basic functionality:

```bash
# Test your interests first
npm run research:mon  # LangChain focus
npm run research:wed  # AWS/SST focus
```

### 3. Performance Testing

Time each command to compare execution speeds:

```bash
# Time each research topic
time npm run research:mon
time npm run research:tue
time npm run research:wed
time npm run research:thu
time npm run research:fri
```

## Detailed Testing Procedure

### For Each Topic Test:

1. **Run Research Command**
   ```bash
   npm run research:mon  # Replace with desired day
   ```

2. **Monitor Console Output**
   ```bash
   # You should see output like:
   [main] INFO: Day override specified: MON
   [main] INFO: Research topic: AI/ML Development Tools & LangChain Ecosystem
   [research-service] SUCCESS: Research completed for AI/ML Development Tools & LangChain Ecosystem. Found 8 sources.
   [email-service] SUCCESS: Email sent successfully!
   [main] SUCCESS: Research automation completed successfully in 45.2s
   ```

3. **Verify Results**
   - ✅ Check for successful API connection
   - ✅ Verify research execution without errors
   - ✅ Note token usage in logs
   - ✅ Confirm email sending success
   - ✅ Check email inbox for delivery

4. **Quality Assessment**
   - ✅ Review HTML formatting and styling
   - ✅ Test all hyperlinks are clickable and valid
   - ✅ Assess research quality and relevance
   - ✅ Verify sources are recent and authoritative

## Testing Checklist

### Pre-Testing Setup
- [ ] API key configured: `echo $ANTHROPIC_API_KEY` (should not be empty)
- [ ] Project built: `npm run build` (should complete without errors)
- [ ] Email working: `npm run test:email` (should receive test email)

### For Each Research Topic
- [ ] **Monday** (`npm run research:mon`): AI/ML & LangChain research
- [ ] **Tuesday** (`npm run research:tue`): React/Next.js & TypeScript research  
- [ ] **Wednesday** (`npm run research:wed`): AWS & SST research
- [ ] **Thursday** (`npm run research:thu`): DevOps & CI/CD research
- [ ] **Friday** (`npm run research:fri`): VS Code & Productivity research

### Quality Verification (For Each Topic)
- [ ] Command executes without errors
- [ ] Research completes successfully (see SUCCESS logs)
- [ ] Email delivered to inbox
- [ ] Content relevant to topic focus areas
- [ ] Sources are recent and authoritative
- [ ] HTML rendering looks professional
- [ ] All links are functional
- [ ] Token usage reasonable (~2,000-8,000 tokens)

## Sample Test Results Template

```markdown
# Research Topic Test Results

## Test Summary
- **Date**: [Test Date]
- **Topics Tested**: All 5 topics
- **Total Tests**: 5/5 completed

## Individual Topic Results

### Monday AI/ML - `npm run research:mon`
- ✅ **Status**: Success
- **Duration**: 42.1s
- **Tokens**: 3,245 input + 4,892 output = 8,137 total
- **Sources**: 7 found
- **Quality**: 5/5 - Excellent LangChain updates found
- **Notes**: Found recent LangGraph improvements, vector DB comparisons

### Tuesday React - `npm run research:tue` 
- ✅ **Status**: Success  
- **Duration**: 38.7s
- **Tokens**: 2,891 input + 4,234 output = 7,125 total
- **Sources**: 6 found
- **Quality**: 4/5 - Good coverage of React 19 features
- **Notes**: Strong focus on App Router patterns

### Wednesday AWS - `npm run research:wed`
- ✅ **Status**: Success
- **Duration**: 44.3s
- **Tokens**: 3,156 input + 4,567 output = 7,723 total
- **Sources**: 8 found
- **Quality**: 5/5 - Excellent SST framework coverage
- **Notes**: Current serverless patterns, AWS CDK updates

### Thursday DevOps - `npm run research:thu`
- ✅ **Status**: Success
- **Duration**: 41.8s
- **Tokens**: 2,987 input + 4,321 output = 7,308 total
- **Sources**: 7 found
- **Quality**: 4/5 - Good CI/CD tool coverage
- **Notes**: GitHub Actions improvements, Docker tools

### Friday VS Code - `npm run research:fri`
- ✅ **Status**: Success
- **Duration**: 39.2s
- **Tokens**: 2,754 input + 4,123 output = 6,877 total
- **Sources**: 6 found
- **Quality**: 4/5 - Solid productivity tools coverage
- **Notes**: AI-powered extensions, workflow improvements

## Overall Assessment
- **Pass Rate**: 5/5 (100%)
- **Average Duration**: 41.2s
- **Average Tokens**: 7,434
- **Average Sources**: 6.8
- **Cost Estimate**: ~$0.045 per research session
- **Recommendations**: All topics working well, ready for automation
```

## Troubleshooting

### Common Issues & Solutions

**Command not found**
```bash
npm ERR! missing script: research:mon
```
**Solution**: Ensure you've rebuilt the project and check package.json:
```bash
npm run build
cat package.json | grep research:
```

**Research fails with API error**
```bash
[research-service] ERROR: Claude API error: 401 Unauthorized
```
**Solutions**:
- Check API key: `echo $ANTHROPIC_API_KEY`
- Verify account has credits at console.anthropic.com
- Ensure API key has correct permissions

**Email not delivered**
```bash
[email-service] ERROR: EAUTH - Authentication failed
```
**Solutions**:
- Use Gmail app password, not regular password
- Enable 2-factor authentication on Gmail account
- Check EMAIL_USER and EMAIL_PASS in `.env`

**Day override not working**
```bash
[main] INFO: No research topic scheduled for today (weekend)
```
**Solutions**:
- Ensure you're using the npm script: `npm run research:mon`
- Check the DAY environment variable is being set correctly
- Rebuild if you've made changes: `npm run build`

## Advanced Testing Scenarios

### Batch Testing All Topics
```bash
#!/bin/bash
# Create a script to test all topics sequentially
echo "Testing all research topics..."

for day in mon tue wed thu fri; do
  echo "Testing $day..."
  npm run "research:$day"
  echo "Completed $day. Waiting 30 seconds..."
  sleep 30
done

echo "All topics tested!"
```

### Cost Analysis Testing
```bash
# Monitor token usage across all topics
echo "Topic,Tokens,Cost" > research_costs.csv

for day in mon tue wed thu fri; do
  echo "Testing $day for cost analysis..."
  npm run "research:$day" 2>&1 | grep "Token usage" >> costs_temp.txt
done
```

### Quality Comparison Testing
```bash
# Test same topic multiple times for consistency
npm run research:mon
sleep 60
npm run research:mon
# Compare results for consistency
```

## Benefits of npm Script Approach

### ✅ **Semantic & Clear**
```bash
npm run research:mon  # Immediately clear what this does
```

### ✅ **Easy to Extend**
```bash
# Future enhancements can be added to package.json:
"research:mon:dev": "NODE_ENV=development DAY=mon node dist/index.js",
"research:mon:verbose": "DEBUG=true DAY=mon node dist/index.js"
```

### ✅ **IDE Integration**
Most IDEs show npm scripts in their UI, making them easy to run with a click.

### ✅ **Self-Documenting**
```bash
npm run  # Shows all available scripts including research commands
```

### ✅ **Consistent Environment**
Each script ensures the DAY environment variable is set correctly.

## All Available Commands

```bash
# Research commands
npm run research:mon      # Monday: AI/ML & LangChain
npm run research:tue      # Tuesday: React/Next.js
npm run research:wed      # Wednesday: AWS & SST
npm run research:thu      # Thursday: DevOps & CI/CD
npm run research:fri      # Friday: VS Code & Productivity

# Utility commands  
npm start                 # Today's topic (auto-detect)
npm run test:email        # Test email configuration
npm run build             # Build TypeScript
npm run dev               # Development mode
npm run validate          # Type-check + lint + format
```

---

*The npm script approach makes testing much more intuitive and maintainable! 🚀*