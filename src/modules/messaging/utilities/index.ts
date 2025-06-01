// src/modules/messaging/utilities/index.ts
// Centralized exports for all messaging utility functions

// Message validation utilities
export {
  estimateMessageSize,
  generateMessageFingerprint,
  isMessageExpired,
  messageMatchesFilter,
  sanitizeMessagePayload,
  validateChannelName,
  validateMessage,
  validateMessageFilter
} from "./message-validation-helpers"

// Message routing utilities
export {
  CircuitBreaker,
  LoadBalancer,
  MessageRouter,
  type MessageTransform,
  type RouteCondition,
  type RouteConfig,
  type RouteMetrics,
  type RouteMiddleware,
  type RouteTarget,
  type RoutingResult
} from "./message-routing-helpers"

// Message compression utilities
export {
  MessageCompressor,
  MessageOptimizer,
  type CompressedMessage,
  type CompressionConfig,
  type MessageChunk
} from "./message-compression-helpers"

// Message security utilities
export {
  MessageRateLimiter,
  MessageSecurity,
  type EncryptedMessage,
  type EncryptionConfig,
  type MessageSignature,
  type SecurityContext
} from "./message-security-helpers"
