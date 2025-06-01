interface ErrorContext {
  provider: string
  operation: string
  attempt: number
  metadata?: Record<string, any>
}

export class EnhancedErrorHandler {
  private errorHistory: Array<{
    timestamp: Date
    error: Error
    context: ErrorContext
    resolved: boolean
  }> = []

  handleError(error: any, context: ErrorContext): Error {
    // Log to history
    this.errorHistory.push({
      timestamp: new Date(),
      error,
      context,
      resolved: false
    })

    // Enhance error with context
    const enhancedError = this.enhanceError(error, context)

    // Provide actionable recommendations
    const recommendations = this.getRecommendations(error, context)
    if (recommendations.length > 0) {
      enhancedError.recommendations = recommendations
    }

    return enhancedError
  }

  private enhanceError(error: any, context: ErrorContext): any {
    // Add context to error
    error.context = context

    // Categorize error
    error.category = this.categorizeError(error)

    // Add user-friendly message
    error.userMessage = this.getUserFriendlyMessage(error)

    // Add retry information
    error.isRetryable = this.isRetryable(error)

    return error
  }

  private categorizeError(error: any): string {
    const message = error.message?.toLowerCase() || ''
    const code = error.code || error.status

    if (code === 401 || message.includes('unauthorized') || message.includes('api key')) {
      return 'authentication'
    }
    if (code === 429 || message.includes('rate limit')) {
      return 'rate-limit'
    }
    if (code === 402 || message.includes('quota') || message.includes('billing')) {
      return 'billing'
    }
    if (code >= 500 || message.includes('internal server')) {
      return 'server-error'
    }
    if (message.includes('network') || message.includes('timeout')) {
      return 'network'
    }
    if (message.includes('invalid') || message.includes('validation')) {
      return 'validation'
    }

    return 'unknown'
  }

  private getUserFriendlyMessage(error: any): string {
    const category = error.category || this.categorizeError(error)

    const messages: Record<string, string> = {
      'authentication': 'API key is invalid or missing. Please check your settings.',
      'rate-limit': 'Too many requests. Please wait a moment and try again.',
      'billing': 'Billing or quota issue. Please check your account.',
      'server-error': 'The AI service is temporarily unavailable. Please try again later.',
      'network': 'Network connection issue. Please check your internet connection.',
      'validation': 'Invalid request. Please check your input and try again.',
      'unknown': 'An unexpected error occurred. Please try again.'
    }

    return messages[category] || messages.unknown
  }

  private isRetryable(error: any): boolean {
    const category = error.category || this.categorizeError(error)
    const retryableCategories = ['rate-limit', 'server-error', 'network']
    return retryableCategories.includes(category)
  }

  private getRecommendations(error: any, context: ErrorContext): string[] {
    const recommendations: string[] = []
    const category = error.category || this.categorizeError(error)

    switch (category) {
      case 'authentication':
        recommendations.push('Verify your API key in settings')
        recommendations.push('Ensure the API key has not expired')
        recommendations.push('Check if the API key has the required permissions')
        break

      case 'rate-limit':
        recommendations.push('Enable request queuing in settings')
        recommendations.push('Increase the delay between requests')
        recommendations.push('Consider upgrading your API plan')
        break

      case 'billing':
        recommendations.push('Check your account balance')
        recommendations.push('Review your usage limits')
        recommendations.push('Consider using a cheaper model')
        break

      case 'network':
        recommendations.push('Check your internet connection')
        recommendations.push('Try using a different network')
        recommendations.push('Check if the service is blocked by firewall')
        break
    }

    // Add context-specific recommendations
    if (context.attempt > 2) {
      recommendations.push('Consider using a fallback provider')
    }

    return recommendations
  }

  getErrorStats(timeWindow?: number) {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0
    const relevantErrors = this.errorHistory.filter(e => e.timestamp.getTime() > cutoff)

    const stats = {
      total: relevantErrors.length,
      byCategory: {} as Record<string, number>,
      byProvider: {} as Record<string, number>,
      resolutionRate: 0
    }

    relevantErrors.forEach(entry => {
      const category = this.categorizeError(entry.error)
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
      stats.byProvider[entry.context.provider] = (stats.byProvider[entry.context.provider] || 0) + 1
    })

    const resolved = relevantErrors.filter(e => e.resolved).length
    stats.resolutionRate = relevantErrors.length > 0 ? resolved / relevantErrors.length : 0

    return stats
  }
}