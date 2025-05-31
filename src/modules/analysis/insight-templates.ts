// Analysis templates specifically for Insight Buddy extension

import type { AnalysisType, PromptTemplate } from './types'

export const insightAnalysisTypes: Record<string, AnalysisType> = {
  summarize: {
    id: 'summarize',
    name: 'Tóm tắt',
    description: 'Tóm tắt ngắn gọn nội dung đoạn văn',
    icon: '📝',
    category: 'content',
    requiredInputs: [
      { name: 'text', type: 'text', required: true },
      { name: 'context', type: 'text', required: false }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['summary', 'keyPoints']
    },
    estimatedTime: 3,
    aiRequired: true
  },

  explain: {
    id: 'explain',
    name: 'Giải thích thuật ngữ',
    description: 'Giải thích các thuật ngữ khó hiểu trong văn bản',
    icon: '💡',
    category: 'content',
    requiredInputs: [
      { name: 'text', type: 'text', required: true },
      { name: 'context', type: 'text', required: false }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['terms', 'explanations']
    },
    estimatedTime: 5,
    aiRequired: true
  },

  critique: {
    id: 'critique',
    name: 'Đặt câu hỏi phản biện',
    description: 'Tạo câu hỏi phản biện sâu sắc về nội dung',
    icon: '🤔',
    category: 'content',
    requiredInputs: [
      { name: 'text', type: 'text', required: true },
      { name: 'context', type: 'text', required: false }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['questions', 'reasoning']
    },
    estimatedTime: 5,
    aiRequired: true
  },

  contextDictionary: {
    id: 'context',
    name: 'Từ điển ngữ cảnh',
    description: 'Giải thích từ ngữ trong ngữ cảnh cụ thể',
    icon: '📚',
    category: 'content',
    requiredInputs: [
      { name: 'text', type: 'text', required: true },
      { name: 'context', type: 'text', required: false }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['definitions', 'usage']
    },
    estimatedTime: 3,
    aiRequired: true
  },

  biasCheck: {
    id: 'bias',
    name: 'Kiểm tra thiên vị',
    description: 'Phát hiện ngôn ngữ thiên vị và cảm xúc',
    icon: '⚖️',
    category: 'bias',
    requiredInputs: [
      { name: 'text', type: 'text', required: true },
      { name: 'author', type: 'text', required: false },
      { name: 'source', type: 'text', required: false }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['biasTypes', 'examples', 'neutralAlternatives']
    },
    estimatedTime: 5,
    aiRequired: true
  },

  expand: {
    id: 'expand',
    name: 'Mở rộng kiến thức',
    description: 'Gợi ý từ khóa và chủ đề liên quan để tìm hiểu thêm',
    icon: '➕',
    category: 'content',
    requiredInputs: [
      { name: 'text', type: 'text', required: true },
      { name: 'context', type: 'text', required: false }
    ],
    outputFormat: {
      type: 'structured',
      sections: ['keywords', 'relatedTopics', 'recommendations']
    },
    estimatedTime: 3,
    aiRequired: true
  }
}

export const insightPromptTemplates: Record<string, PromptTemplate> = {
  summarize: {
    id: 'summarize',
    name: 'Tóm tắt nội dung',
    description: 'Tạo tóm tắt ngắn gọn cho đoạn văn',
    template: `Bạn là một trợ lý AI chuyên tóm tắt nội dung. Hãy tóm tắt đoạn văn sau một cách ngắn gọn và chính xác.

{{#if context}}
Ngữ cảnh: {{context}}
{{/if}}

Đoạn văn cần tóm tắt:
"""
{{text}}
"""

Yêu cầu:
1. Tóm tắt trong 2-3 câu chính
2. Giữ lại ý chính quan trọng nhất
3. Liệt kê 3-5 điểm chính (bullet points)
4. Ngôn ngữ rõ ràng, dễ hiểu

Định dạng output:
{
  "summary": "Tóm tắt ngắn gọn ở đây",
  "keyPoints": [
    "Điểm chính 1",
    "Điểm chính 2",
    "Điểm chính 3"
  ],
  "confidence": 0.95
}`,
    variables: [
      { name: 'text', type: 'string', required: true },
      { name: 'context', type: 'string', required: false }
    ],
    category: 'summary'
  },

  explain: {
    id: 'explain',
    name: 'Giải thích thuật ngữ',
    description: 'Giải thích các thuật ngữ khó hiểu',
    template: `Bạn là một chuyên gia giải thích thuật ngữ. Hãy tìm và giải thích các thuật ngữ khó hiểu trong đoạn văn sau.

{{#if context}}
Ngữ cảnh: {{context}}
{{/if}}

Đoạn văn:
"""
{{text}}
"""

Yêu cầu:
1. Xác định các thuật ngữ chuyên môn, từ khó, hoặc khái niệm phức tạp
2. Giải thích mỗi thuật ngữ một cách đơn giản, dễ hiểu
3. Đưa ra ví dụ minh họa nếu cần
4. Giải thích phù hợp với người đọc phổ thông

Định dạng output:
{
  "terms": [
    {
      "term": "Thuật ngữ 1",
      "explanation": "Giải thích đơn giản",
      "example": "Ví dụ minh họa (nếu có)"
    }
  ],
  "summary": "Tóm tắt chung về các thuật ngữ đã giải thích"
}`,
    variables: [
      { name: 'text', type: 'string', required: true },
      { name: 'context', type: 'string', required: false }
    ],
    category: 'explanation'
  },

  critique: {
    id: 'critique',
    name: 'Câu hỏi phản biện',
    description: 'Tạo câu hỏi phản biện sâu sắc',
    template: `Bạn là một nhà tư duy phản biện. Hãy đặt ra các câu hỏi phản biện sâu sắc về nội dung sau.

{{#if context}}
Ngữ cảnh: {{context}}
{{/if}}

Nội dung cần phân tích:
"""
{{text}}
"""

Yêu cầu:
1. Đặt 3-5 câu hỏi phản biện sâu sắc
2. Tập trung vào: logic, bằng chứng, giả định, và hệ quả
3. Mỗi câu hỏi kèm theo lý do tại sao nó quan trọng
4. Câu hỏi phải mang tính xây dựng, không phá hoại

Định dạng output:
{
  "questions": [
    {
      "question": "Câu hỏi phản biện",
      "category": "logic|evidence|assumption|implication",
      "reasoning": "Tại sao câu hỏi này quan trọng",
      "importance": "high|medium|low"
    }
  ],
  "overallAssessment": "Đánh giá tổng quan về độ tin cậy và logic của nội dung"
}`,
    variables: [
      { name: 'text', type: 'string', required: true },
      { name: 'context', type: 'string', required: false }
    ],
    category: 'critical-thinking'
  },

  biasCheck: {
    id: 'bias',
    name: 'Kiểm tra thiên vị',
    description: 'Phát hiện ngôn ngữ thiên vị',
    template: `Bạn là chuyên gia phân tích ngôn ngữ và phát hiện thiên vị. Hãy phân tích đoạn văn sau.

{{#if author}}
Tác giả: {{author}}
{{/if}}
{{#if source}}
Nguồn: {{source}}
{{/if}}

Văn bản cần phân tích:
"""
{{text}}
"""

Yêu cầu:
1. Xác định các loại thiên vị (xác nhận, lựa chọn, cảm xúc, văn hóa, v.v.)
2. Trích dẫn cụ thể các ví dụ từ văn bản
3. Đánh giá mức độ nghiêm trọng của thiên vị
4. Đề xuất cách diễn đạt trung lập hơn

Định dạng output:
{
  "biasTypes": [
    {
      "type": "confirmation|selection|emotional|cultural|political",
      "severity": "low|medium|high",
      "description": "Mô tả loại thiên vị"
    }
  ],
  "examples": [
    {
      "original": "Câu/cụm từ thiên vị",
      "issue": "Vấn đề gì với câu này",
      "neutral": "Cách diễn đạt trung lập hơn"
    }
  ],
  "overallScore": 0.7,
  "recommendation": "Khuyến nghị chung"
}`,
    variables: [
      { name: 'text', type: 'string', required: true },
      { name: 'author', type: 'string', required: false },
      { name: 'source', type: 'string', required: false }
    ],
    category: 'bias-detection'
  },

  expand: {
    id: 'expand',
    name: 'Mở rộng kiến thức',
    description: 'Gợi ý từ khóa và chủ đề liên quan',
    template: `Bạn là một trợ lý nghiên cứu. Hãy gợi ý các từ khóa và chủ đề liên quan để người đọc có thể tìm hiểu thêm.

{{#if context}}
Ngữ cảnh: {{context}}
{{/if}}

Nội dung:
"""
{{text}}
"""

Yêu cầu:
1. Xác định 5-10 từ khóa quan trọng để tìm kiếm
2. Gợi ý 3-5 chủ đề liên quan để nghiên cứu thêm
3. Đề xuất các góc nhìn khác nhau về vấn đề
4. Gợi ý nguồn tham khảo uy tín (nếu có thể)

Định dạng output:
{
  "keywords": [
    {
      "term": "Từ khóa",
      "relevance": "high|medium|low",
      "searchQuery": "Gợi ý cách tìm kiếm"
    }
  ],
  "relatedTopics": [
    {
      "topic": "Chủ đề liên quan",
      "description": "Mô tả ngắn",
      "whyRelevant": "Tại sao nên tìm hiểu"
    }
  ],
  "perspectives": [
    "Góc nhìn 1: ...",
    "Góc nhìn 2: ..."
  ],
  "recommendations": [
    "Gợi ý tìm hiểu thêm 1",
    "Gợi ý tìm hiểu thêm 2"
  ]
}`,
    variables: [
      { name: 'text', type: 'string', required: true },
      { name: 'context', type: 'string', required: false }
    ],
    category: 'expansion'
  },

  quickSummary: {
    id: 'quickSummary',
    name: 'Tóm tắt nhanh',
    description: 'Tóm tắt cực ngắn trong 1 câu',
    template: `Tóm tắt đoạn văn sau trong MỘT câu duy nhất, ngắn gọn nhất có thể:

"""
{{text}}
"""

Chỉ trả về một câu tóm tắt, không giải thích thêm.`,
    variables: [
      { name: 'text', type: 'string', required: true }
    ],
    category: 'quick'
  }
}

// Helper function to get prompt for analysis type
export function getInsightPrompt(analysisType: string, inputs: Record<string, any>): string {
  const template = insightPromptTemplates[analysisType]
  if (!template) {
    throw new Error(`Unknown analysis type: ${analysisType}`)
  }

  // Simple template replacement
  let prompt = template.template

  // Replace variables
  Object.entries(inputs).forEach(([key, value]) => {
    // Handle conditional blocks
    const conditionalRegex = new RegExp(`{{#if ${key}}}([\\s\\S]*?){{/if}}`, 'g')
    prompt = prompt.replace(conditionalRegex, value ? '$1' : '')

    // Replace variables
    const variableRegex = new RegExp(`{{${key}}}`, 'g')
    prompt = prompt.replace(variableRegex, value || '')
  })

  return prompt.trim()
}

// Format AI response based on analysis type
export function formatInsightResponse(analysisType: string, aiResponse: string): any {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(aiResponse)
    return parsed
  } catch {
    // If not JSON, format based on type
    switch (analysisType) {
      case 'quickSummary':
        return {
          summary: aiResponse.trim(),
          type: 'quick'
        }

      case 'summarize':
        return {
          summary: aiResponse,
          keyPoints: [],
          confidence: 0.8
        }

      case 'critique':
        return {
          questions: [{
            question: aiResponse,
            category: 'general',
            reasoning: 'AI generated question',
            importance: 'medium'
          }],
          overallAssessment: ''
        }

      default:
        return {
          output: aiResponse,
          type: analysisType
        }
    }
  }
}