# API Cost Analysis for AIRA (AI Research Automation)

*Analysis conducted: September 2025*

## Overview

Analysis of API pricing options for daily AI research automation workflow that processes ~6,000 tokens per day (2,500 input + 3,500 output tokens) **plus web search costs**.

## Daily Cost Comparison (Updated with Web Search)

| Provider | Model | Daily Cost | Monthly Cost | Yearly Cost | Notes |
|----------|-------|------------|--------------|-------------|-------|
| **Google Gemini** | **2.5 Flash** | **$0.001** | **$0.03** | **$0.31** | ⭐ **FREE TIER COVERS USE CASE** |
| OpenAI | GPT-4.1 Mini | $0.002 | $0.05 | $0.62 | Very cost-effective |
| Anthropic | Haiku 3.5 | $0.005 | $0.11 | $1.25 | Budget Claude option |
| OpenAI | GPT-4.1 | $0.021 | $0.45 | $5.16 | Good balance |
| Google Gemini | 2.5 Pro | $0.046 | $1.00 | $11.38 | Premium Gemini |
| **Anthropic** | **Sonnet 4 + Web Search** | **$0.070** | **$1.54** | **$17.50** | **🎯 CHOSEN OPTION** |
| Anthropic | Opus 4.1 | $0.300 | $6.60 | $75.00 | Highest capability |

## Web Search Cost Impact

### **Claude Sonnet 4 with Web Search (AIRA Implementation)**
- **Token costs**: $0.060/day (original estimate)
- **Web search costs**: $0.010/day (1 search per day × $10 per 1,000 searches)
- **Total daily cost**: $0.070
- **Annual cost**: ~£13.50 (approximately $17.50)

### **Search Usage Pattern**
- **Daily searches**: 1 research session = 1-10 searches
- **Average searches**: ~3-5 searches per research session
- **Monthly searches**: ~100 searches (22 working days × 4.5 searches)
- **Annual searches**: ~1,125 searches (250 working days × 4.5 searches)

## Key Findings

### Free Tier Analysis
- **🏆 Google Gemini**: 15 requests/minute free tier - completely covers our 1 request/day workflow
- **❌ Anthropic Claude**: No meaningful free tier + $10 per 1,000 web searches
- **⚠️ OpenAI**: $5 free credits for new accounts (~200-500 requests), then pay-per-use

### Token Usage Estimates
- **Daily usage**: 6,000 tokens (2,500 input + 3,500 output)
- **Monthly usage**: 132,000 tokens (22 working days)
- **Annual usage**: 1.5M tokens (250 working days)

### Pricing Models (per million tokens + web search)
- **Anthropic Claude Sonnet 4**: $3 input / $15 output + $10 per 1,000 web searches
- **Google Gemini 2.5 Flash**: $0.075 input / $0.30 output (includes web search)
- **OpenAI GPT-4.1**: $1.25 input / $5.00 output (web search varies by plan)

## Decision Matrix

### Option 1: Google Gemini 2.5 Flash ⭐ 
- **Cost**: FREE (covered by generous free tier)
- **Quality**: Very good for research tasks
- **Web Search**: Included at no extra cost
- **Risk**: Low - easy to migrate if needed
- **Best for**: Testing, budget-conscious projects

### Option 2: Anthropic Claude Sonnet 4 + Web Search 🎯
- **Cost**: ~£13.50/year (approx $17.50 USD)
- **Quality**: Excellent research capabilities with web search
- **Web Search**: Real-time with citations ($10 per 1,000 searches)
- **Risk**: Low cost, predictable, high quality
- **Best for**: High-quality research output, comprehensive web search

### Option 3: Multi-Model Approach
- **Cost**: FREE for daily use + pay-per-use for complex topics
- **Quality**: Best of both worlds
- **Risk**: Additional complexity
- **Best for**: Cost optimization with quality fallback

## Final Decision: Claude Sonnet 4 + Web Search

**Rationale:**
- High-quality research output with real-time web search justifies the cost
- £15 credit provides substantial testing runway (covers ~850 research sessions)
- Already implemented and tested
- Web search tool specifically designed for research use cases
- Manageable risk at ~£13.50/year
- **AIRA** benefits from real-time, cited sources

## Web Search Cost Optimization Strategies

### Search Efficiency
- **max_uses**: Set to 10 searches per research session (reasonable for comprehensive research)
- **Targeted prompts**: Clear, specific research requirements reduce unnecessary searches
- **Progressive searches**: Claude uses earlier results to inform subsequent queries

### Cost Monitoring
- Track web search usage via API response: `server_tool_use.web_search_requests`
- Monitor daily search counts with our logging system
- Set up alerts if usage exceeds expected patterns (>10 searches per session)

### Budget Management
- **Expected monthly searches**: ~100 searches = $1.00 in search costs
- **Annual search budget**: ~1,125 searches = $11.25 in search costs
- **Total annual cost**: £13.50 (tokens + searches)

## Updated Cost Optimization Strategies

### Prompt Engineering
- Clear research requirements minimize unnecessary searches
- Structured output format reduces parsing overhead
- Specific date ranges (last 30-90 days) focus searches effectively

### Monitoring & Analytics
- Track web search usage patterns across different topics
- Monitor search success rates and quality scores
- Adjust max_uses based on topic complexity

### Quality vs Cost Balance
- **High-value topics**: Allow more searches (max_uses: 10)
- **Routine topics**: Limit searches (max_uses: 5)
- **Emergency research**: Increase limits as needed

## Implementation Notes

### Current AIRA Setup
- Repository configured for Claude Sonnet 4 with web search
- Environment variable: `ANTHROPIC_API_KEY`
- Web search tool enabled with max_uses: 10
- Real-time search logging and usage tracking

### Testing Results Summary
- Tuesday's research topic executed successfully
- Web search functionality now properly enabled
- Expected high-quality, current research results with citations
- Token + search costs within budget expectations

### Budget Tracking
- Expected monthly cost: £1-2 (tokens + searches)
- Annual budget: £13-15 (total cost including web search)
- Break-even vs manual research: Immediate (time savings + real-time data)

---

*Note: Prices based on September 2025 API pricing. Web search costs $10 per 1,000 searches. Always verify current rates on provider websites.*

## AIRA Brand Integration

**AIRA (AI Research Automation)** now includes:
- Real-time web search capabilities via Claude Sonnet 4
- Comprehensive daily research automation
- Professional HTML email summaries with live citations
- Cost-effective operation at ~£13.50/year
- Monday-Friday topic rotation for comprehensive coverage