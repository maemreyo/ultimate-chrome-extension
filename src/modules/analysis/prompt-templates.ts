import { PromptTemplate } from './types'

export const promptTemplates: Record<string, PromptTemplate> = {
  contentAnalysis: {
    id: 'content-analysis',
    name: 'Content Analysis',
    description: 'Comprehensive analysis of text content',
    category: 'content',
    template: `Analyze the following content and provide a comprehensive analysis:

Content: {{content}}

Please analyze the following aspects:
1. Main Topic and Theme
2. Key Points and Arguments
3. Writing Style and Tone
4. Target Audience
5. Strengths and Weaknesses
6. Overall Quality Score (1-10)

{{#if includeRecommendations}}
Also provide specific recommendations for improvement.
{{/if}}

Format your response as a structured analysis with clear sections.`,
    variables: [
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'The content to analyze'
      },
      {
        name: 'includeRecommendations',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Whether to include improvement recommendations'
      }
    ]
  },

  sentimentAnalysis: {
    id: 'sentiment-analysis',
    name: 'Sentiment Analysis',
    description: 'Analyze emotional tone and sentiment',
    category: 'sentiment',
    template: `Perform a detailed sentiment analysis on the following text:

Text: {{text}}

Analyze:
1. Overall Sentiment (Positive/Negative/Neutral) with confidence score
2. Emotional Tone (Professional/Casual/Formal/Informal/etc.)
3. Detected Emotions (Joy, Anger, Sadness, Fear, Surprise, etc.) with intensities
4. Sentiment Progression (if text is long enough)
5. Key Phrases Contributing to Sentiment

{{#if contextualFactors}}
Consider these contextual factors: {{contextualFactors}}
{{/if}}

Provide specific examples from the text to support your analysis.`,
    variables: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'Text to analyze for sentiment'
      },
      {
        name: 'contextualFactors',
        type: 'string',
        required: false,
        description: 'Additional context to consider'
      }
    ]
  },

  seoAnalysis: {
    id: 'seo-analysis',
    name: 'SEO Analysis',
    description: 'Search engine optimization analysis',
    category: 'seo',
    template: `Perform an SEO analysis for the following content:

URL: {{url}}
Title: {{title}}
Meta Description: {{metaDescription}}
Content: {{content}}

Analyze:
1. Title Tag Optimization (length, keywords, appeal)
2. Meta Description Quality
3. Keyword Usage and Density
4. Content Structure (headings, paragraphs)
5. Readability Score
6. Internal/External Link Analysis
7. Image Alt Text Usage
8. Schema Markup Recommendations

Target Keywords: {{#if keywords}}{{keywords}}{{else}}Identify from content{{/if}}

Provide specific recommendations with priority levels.`,
    variables: [
      {
        name: 'url',
        type: 'string',
        required: false,
        description: 'Page URL'
      },
      {
        name: 'title',
        type: 'string',
        required: true,
        description: 'Page title'
      },
      {
        name: 'metaDescription',
        type: 'string',
        required: false,
        description: 'Meta description'
      },
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'Page content'
      },
      {
        name: 'keywords',
        type: 'array',
        required: false,
        description: 'Target keywords'
      }
    ]
  },

  readabilityAnalysis: {
    id: 'readability-analysis',
    name: 'Readability Analysis',
    description: 'Assess content readability and accessibility',
    category: 'readability',
    template: `Analyze the readability of the following text:

Text: {{text}}

Provide analysis on:
1. Reading Level (Grade level)
2. Sentence Complexity
   - Average sentence length
   - Complex sentence ratio
3. Vocabulary Difficulty
   - Common vs. uncommon words
   - Technical jargon usage
4. Paragraph Structure
5. Clarity and Coherence
6. Accessibility Issues

Target Audience: {{#if targetAudience}}{{targetAudience}}{{else}}General public{{/if}}

Suggest specific improvements to enhance readability.`,
    variables: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'Text to analyze'
      },
      {
        name: 'targetAudience',
        type: 'string',
        required: false,
        description: 'Intended audience'
      }
    ]
  },

  factCheckAnalysis: {
    id: 'fact-check-analysis',
    name: 'Fact Check Analysis',
    description: 'Identify and verify factual claims',
    category: 'fact-check',
    template: `Identify and analyze factual claims in the following content:

Content: {{content}}

For each claim:
1. Extract the specific claim
2. Categorize claim type (statistical, historical, scientific, etc.)
3. Assess verifiability (can be fact-checked vs. opinion)
4. Identify what evidence would be needed to verify
5. Flag potential red flags or suspicious claims

{{#if checkSources}}
Also evaluate the credibility of any cited sources.
{{/if}}

Focus on claims that are:
- Specific and measurable
- Potentially misleading if false
- Central to the argument

Do not attempt to verify the claims, only identify and categorize them.`,
    variables: [
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'Content to analyze for claims'
      },
      {
        name: 'checkSources',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Whether to evaluate source credibility'
      }
    ]
  },

  biasAnalysis: {
    id: 'bias-analysis',
    name: 'Bias Analysis',
    description: 'Detect potential biases in content',
    category: 'bias',
    template: `Analyze the following content for potential biases:

Content: {{content}}
{{#if author}}Author: {{author}}{{/if}}
{{#if source}}Source: {{source}}{{/if}}

Examine for:
1. Political Bias (left/center/right leaning)
2. Confirmation Bias Indicators
3. Selection Bias in Examples/Data
4. Language Bias (loaded words, framing)
5. Cultural or Regional Bias
6. Gender, Race, or Other Demographic Bias
7. Commercial or Financial Bias

For each detected bias:
- Provide specific examples
- Rate severity (minor/moderate/significant)
- Suggest neutral alternatives

Note: Aim for objective analysis without introducing your own biases.`,
    variables: [
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'Content to analyze'
      },
      {
        name: 'author',
        type: 'string',
        required: false,
        description: 'Content author'
      },
      {
        name: 'source',
        type: 'string',
        required: false,
        description: 'Content source'
      }
    ]
  },

  competitorAnalysis: {
    id: 'competitor-analysis',
    name: 'Competitor Content Analysis',
    description: 'Compare content against competitors',
    category: 'content',
    template: `Compare and analyze the following content pieces:

Your Content:
{{yourContent}}

Competitor Content:
{{competitorContent}}

Analyze:
1. Content Depth and Coverage
2. Unique Value Propositions
3. Writing Quality and Style
4. SEO Optimization Comparison
5. Visual and Media Usage
6. Call-to-Action Effectiveness
7. Audience Engagement Potential

Provide:
- Strengths of each piece
- Areas where competitor excels
- Opportunities for improvement
- Specific recommendations to outperform`,
    variables: [
      {
        name: 'yourContent',
        type: 'string',
        required: true,
        description: 'Your content'
      },
      {
        name: 'competitorContent',
        type: 'string',
        required: true,
        description: 'Competitor content'
      }
    ]
  },

  customAnalysis: {
    id: 'custom-analysis',
    name: 'Custom Analysis',
    description: 'User-defined analysis',
    category: 'custom',
    template: `{{customPrompt}}

Input: {{input}}

{{#if additionalInstructions}}
Additional Instructions: {{additionalInstructions}}
{{/if}}`,
    variables: [
      {
        name: 'customPrompt',
        type: 'string',
        required: true,
        description: 'Custom analysis prompt'
      },
      {
        name: 'input',
        type: 'string',
        required: true,
        description: 'Input to analyze'
      },
      {
        name: 'additionalInstructions',
        type: 'string',
        required: false,
        description: 'Additional instructions'
      }
    ]
  }
}

// Helper function to compile templates
export function compileTemplate(template: string, variables: Record<string, any>): string {
  let compiled = template

  // Handle conditional blocks {{#if variable}}...{{/if}}
  compiled = compiled.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
    return variables[varName] ? content : ''
  })

  // Handle variable substitution {{variable}}
  compiled = compiled.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = variables[varName]
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return value?.toString() || ''
  })

  return compiled.trim()
}