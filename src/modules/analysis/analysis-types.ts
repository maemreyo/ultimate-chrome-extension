import type { AnalysisType } from './types'

export const analysisTypes: Record<string, AnalysisType> = {
  content: {
    id: 'content',
    name: 'Content Analysis',
    description: 'Comprehensive analysis of text content including quality, structure, and effectiveness',
    icon: '📝',
    category: 'content',
    requiredInputs: [
      {
        name: 'content',
        type: 'text',
        required: true,
        maxLength: 50000,
        description: 'The content to analyze'
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['overview', 'key-points', 'quality-metrics', 'recommendations']
    },
    estimatedTime: 30,
    aiRequired: true
  },

  sentiment: {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: 'Analyze emotional tone, sentiment polarity, and mood',
    icon: '😊',
    category: 'sentiment',
    requiredInputs: [
      {
        name: 'text',
        type: 'text',
        required: true,
        maxLength: 10000
      }
    ],
    outputFormat: {
      type: 'structured',
      schema: {
        overall: 'string',
        score: 'number',
        emotions: 'object',
        keywords: 'array'
      }
    },
    estimatedTime: 10,
    aiRequired: true
  },

  seo: {
    id: 'seo',
    name: 'SEO Analysis',
    description: 'Search engine optimization analysis and recommendations',
    icon: '🔍',
    category: 'seo',
    requiredInputs: [
      {
        name: 'content',
        type: 'html',
        required: true
      },
      {
        name: 'url',
        type: 'url',
        required: false
      },
      {
        name: 'keywords',
        type: 'text',
        required: false,
        description: 'Target keywords (comma separated)'
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['score', 'issues', 'recommendations', 'keyword-analysis']
    },
    estimatedTime: 45,
    aiRequired: true
  },

  readability: {
    id: 'readability',
    name: 'Readability Analysis',
    description: 'Assess reading difficulty and accessibility',
    icon: '📖',
    category: 'readability',
    requiredInputs: [
      {
        name: 'text',
        type: 'text',
        required: true
      },
      {
        name: 'targetAudience',
        type: 'text',
        required: false,
        description: 'Target audience (e.g., "general public", "experts")'
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['score', 'metrics', 'issues', 'suggestions']
    },
    estimatedTime: 15,
    aiRequired: true
  },

  factCheck: {
    id: 'fact-check',
    name: 'Fact Check Analysis',
    description: 'Identify factual claims for verification',
    icon: '✓',
    category: 'fact-check',
    requiredInputs: [
      {
        name: 'content',
        type: 'text',
        required: true
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['claims', 'sources', 'red-flags']
    },
    estimatedTime: 60,
    aiRequired: true
  },

  bias: {
    id: 'bias',
    name: 'Bias Detection',
    description: 'Detect various types of bias in content',
    icon: '⚖️',
    category: 'bias',
    requiredInputs: [
      {
        name: 'content',
        type: 'text',
        required: true
      },
      {
        name: 'context',
        type: 'text',
        required: false,
        description: 'Additional context about the content'
      }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['bias-types', 'examples', 'severity', 'recommendations']
    },
    estimatedTime: 40,
    aiRequired: true
  },

  summary: {
    id: 'summary',
    name: 'Smart Summary',
    description: 'Generate intelligent summaries with key insights',
    icon: '📋',
    category: 'content',
    requiredInputs: [
      {
        name: 'content',
        type: 'text',
        required: true
      },
      {
        name: 'length',
        type: 'text',
        required: false,
        description: 'Desired summary length (short/medium/long)'
      }
    ],
    outputFormat: {
      type: 'markdown',
      sections: ['summary', 'key-points', 'insights']
    },
    estimatedTime: 20,
    aiRequired: true
  }
}
