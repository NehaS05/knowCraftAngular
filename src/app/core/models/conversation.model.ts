export interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
  updatedAt?: Date;
  messageCount: number;
  
  // User information (for admin view)
  userId: number;
  userName?: string;
  userEmail?: string;
  
  // Computed properties for UI
  preview?: string;
}

export interface Message {
  id: number;
  conversationId: number;
  content: string;
  type: string; // 'user' or 'ai'
  createdAt: Date;
  
  // AI Response fields (only for AI messages)
  ragAnswer?: string;
  azureAiAnswer?: string;
  citations?: CitationDto[];
  confidenceScore?: number;
  tokensUsed?: number;
  
  // Computed properties for UI compatibility
  isUser?: boolean;
  timestamp?: Date;
  chatGptResponse?: string;
  knowledgeBaseResponse?: string;
}

export interface CitationDto {
  source?: string; // Legacy property
  content?: string; // Legacy property
  documentId?: number;
  documentName?: string;
  pageNumber?: number;
  excerpt?: string;
  relevanceScore: number;
  sourceUrl?: string;
}

export interface SendMessageDto {
  conversationId?: number | null;
  content: string;
}

export interface ChatResponseDto {
  userMessage: Message;
  aiMessage: Message;
  ragAnswer?: RagAnswerDto;
  chatGptAnswer?: ChatGptAnswerDto;
}

export interface RagAnswerDto {
  answer: string;
  citations: CitationDto[];
  confidenceScore: number;
}

export interface ChatGptAnswerDto {
  answer: string;
  tokensUsed: number;
}

export interface SendMessageResponse {
  conversation: Conversation;
  userMessage: Message;
  aiMessage: Message;
}

export interface ConversationListResponse {
  conversations: Conversation[];
}

export interface ConversationMessagesResponse {
  messages: Message[];
}

export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
}