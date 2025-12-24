import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, finalize, retry, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Conversation, 
  Message, 
  SendMessageDto, 
  ChatResponseDto,
  SendMessageResponse,
  ConversationListResponse,
  ConversationMessagesResponse,
  ApiError 
} from '../models/conversation.model';
import { LoadingService } from './loading.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private readonly API_URL = `${environment.apiUrl}/conversation`;
  
  // State management
  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();
  
  private currentMessagesSubject = new BehaviorSubject<Message[]>([]);
  public currentMessages$ = this.currentMessagesSubject.asObservable();
  
  private selectedConversationSubject = new BehaviorSubject<Conversation | null>(null);
  public selectedConversation$ = this.selectedConversationSubject.asObservable();

  constructor(
    private http: HttpClient,
    private loadingService: LoadingService,
    private toastService: ToastService
  ) {}

  /**
   * Load all conversations for the current user
   */
  loadConversations(): Observable<Conversation[]> {
    this.loadingService.show();
    
    return this.http.get<Conversation[]>(this.API_URL).pipe(
      retry({ count: 2, delay: 1000 }), // Retry up to 2 times with 1 second delay
      tap(conversations => {
        // Transform and sort conversations by most recent first
        const transformedConversations = conversations.map(conv => this.transformConversation(conv));
        const sortedConversations = transformedConversations.sort((a, b) => {
          const aDate = new Date(a.updatedAt || a.createdAt);
          const bDate = new Date(b.updatedAt || b.createdAt);
          return bDate.getTime() - aDate.getTime();
        });
        this.conversationsSubject.next(sortedConversations);
      }),
      catchError(error => this.handleError(error, 'Failed to load conversations')),
      finalize(() => this.loadingService.hide())
    );
  }

  /**
   * Load messages for a specific conversation
   */
  loadConversationMessages(conversationId: number): Observable<Message[]> {
    this.loadingService.show();
    
    return this.http.get<Message[]>(`${this.API_URL}/${conversationId}/messages`).pipe(
      retry({ count: 2, delay: 1000 }), // Retry up to 2 times with 1 second delay
      tap(messages => {
        // Transform and sort messages by timestamp
        const transformedMessages = messages.map(msg => this.transformMessage(msg));
        const sortedMessages = transformedMessages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        this.currentMessagesSubject.next(sortedMessages);
      }),
      catchError(error => this.handleError(error, 'Failed to load messages')),
      finalize(() => this.loadingService.hide())
    );
  }

  /**
   * Send a message (creates new conversation if conversationId is null)
   */
  sendMessage(dto: SendMessageDto): Observable<ChatResponseDto> {
    this.loadingService.show();
    
    // Add user message immediately for better UX
    if (dto.conversationId) {
      const tempUserMessage: Message = {
        id: Date.now(), // Temporary ID
        conversationId: dto.conversationId,
        content: dto.content,
        type: 'User',
        createdAt: new Date(),
        isUser: true,
        timestamp: new Date()
      };
      
      const currentMessages = this.currentMessagesSubject.value;
      this.currentMessagesSubject.next([...currentMessages, tempUserMessage]);
    }
    
    return this.http.post<ChatResponseDto>(`${this.API_URL}/message`, dto).pipe(
      tap(response => {
        // Transform messages
        const transformedUserMessage = this.transformMessage(response.userMessage);
        const transformedAiMessage = this.transformMessage(response.aiMessage);
        
        // Update current messages if this is the selected conversation
        const currentConversation = this.selectedConversationSubject.value;
        if (currentConversation?.id === response.userMessage.conversationId || !dto.conversationId) {
          const currentMessages = this.currentMessagesSubject.value;
          
          // Remove temporary message if it exists and replace with real messages
          const filteredMessages = dto.conversationId 
            ? currentMessages.filter(msg => msg.id !== Date.now())
            : currentMessages;
          
          const updatedMessages = [...filteredMessages, transformedUserMessage, transformedAiMessage];
          this.currentMessagesSubject.next(updatedMessages);
          
          // Create or update conversation object
          const conversation: Conversation = {
            id: response.userMessage.conversationId,
            title: this.generateConversationTitle(transformedUserMessage.content),
            createdAt: transformedUserMessage.createdAt,
            updatedAt: transformedAiMessage.createdAt,
            messageCount: updatedMessages.length
          };
          
          // Update conversations list and selected conversation
          this.updateConversationInList(conversation);
          this.selectedConversationSubject.next(conversation);
        }
      }),
      catchError(error => {
        // Remove temporary message on error
        if (dto.conversationId) {
          const currentMessages = this.currentMessagesSubject.value;
          const filteredMessages = currentMessages.filter(msg => msg.id !== Date.now());
          this.currentMessagesSubject.next(filteredMessages);
        }
        return this.handleError(error, 'Failed to send message');
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId: number): Observable<void> {
    this.loadingService.show();
    
    return this.http.delete<void>(`${this.API_URL}/${conversationId}`).pipe(
      tap(() => {
        // Remove from conversations list
        const currentConversations = this.conversationsSubject.value;
        const updatedConversations = currentConversations.filter(c => c.id !== conversationId);
        this.conversationsSubject.next(updatedConversations);
        
        // Clear selected conversation if it was deleted
        const selectedConversation = this.selectedConversationSubject.value;
        if (selectedConversation?.id === conversationId) {
          this.selectedConversationSubject.next(null);
          this.currentMessagesSubject.next([]);
        }
        
        this.toastService.success('Conversation deleted successfully');
      }),
      catchError(error => this.handleError(error, 'Failed to delete conversation')),
      finalize(() => this.loadingService.hide())
    );
  }

  /**
   * Select a conversation and load its messages
   */
  selectConversation(conversation: Conversation): void {
    this.selectedConversationSubject.next(conversation);
    this.loadConversationMessages(conversation.id).subscribe();
  }

  /**
   * Clear current selection
   */
  clearSelection(): void {
    this.selectedConversationSubject.next(null);
    this.currentMessagesSubject.next([]);
  }

  /**
   * Get current conversations from state
   */
  getCurrentConversations(): Conversation[] {
    return this.conversationsSubject.value;
  }

  /**
   * Get current messages from state
   */
  getCurrentMessages(): Message[] {
    return this.currentMessagesSubject.value;
  }

  /**
   * Get selected conversation from state
   */
  getSelectedConversation(): Conversation | null {
    return this.selectedConversationSubject.value;
  }

  /**
   * Refresh conversations (reload from server)
   */
  refreshConversations(): Observable<Conversation[]> {
    return this.loadConversations();
  }

  /**
   * Search conversations by title or content
   */
  searchConversations(query: string): Conversation[] {
    if (!query.trim()) {
      return this.getCurrentConversations();
    }
    
    const searchTerm = query.toLowerCase();
    return this.getCurrentConversations().filter(conversation => 
      conversation.title.toLowerCase().includes(searchTerm) ||
      (conversation.preview && conversation.preview.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Update a conversation in the list (used after sending messages)
   */
  private updateConversationInList(updatedConversation: Conversation): void {
    const currentConversations = this.conversationsSubject.value;
    const existingIndex = currentConversations.findIndex(c => c.id === updatedConversation.id);
    
    if (existingIndex >= 0) {
      // Update existing conversation
      currentConversations[existingIndex] = updatedConversation;
    } else {
      // Add new conversation to the beginning
      currentConversations.unshift(updatedConversation);
    }
    
    // Sort by most recent first
    const sortedConversations = currentConversations.sort((a, b) => {
      const aDate = new Date(a.updatedAt || a.createdAt);
      const bDate = new Date(b.updatedAt || b.createdAt);
      return bDate.getTime() - aDate.getTime();
    });
    
    this.conversationsSubject.next([...sortedConversations]);
  }

  /**
   * Transform backend conversation to frontend model
   */
  private transformConversation(conversation: any): Conversation {
    return {
      ...conversation,
      createdAt: new Date(conversation.createdAt),
      updatedAt: conversation.updatedAt ? new Date(conversation.updatedAt) : undefined,
      preview: this.generatePreview(conversation)
    };
  }

  /**
   * Transform backend message to frontend model
   */
  private transformMessage(message: any): Message {
    return {
      ...message,
      createdAt: new Date(message.createdAt),
      // Add computed properties for UI compatibility
      isUser: message.type === 'user',
      timestamp: new Date(message.createdAt),
      chatGptResponse: message.azureAiAnswer,
      knowledgeBaseResponse: message.ragAnswer
    };
  }

  /**
   * Generate conversation title from first message
   */
  private generateConversationTitle(firstMessage: string): string {
    if (firstMessage.length <= 50) {
      return firstMessage;
    }
    return firstMessage.substring(0, 47) + '...';
  }

  /**
   * Generate preview text for conversation
   */
  private generatePreview(conversation: any): string {
    // This could be enhanced to show the last message preview
    return `${conversation.messageCount} message${conversation.messageCount !== 1 ? 's' : ''}`;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse, defaultMessage: string): Observable<never> {
    let errorMessage = defaultMessage;
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = 'Connection error. Please check your internet connection.';
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'You are not authorized. Please log in again.';
          break;
        case 403:
          errorMessage = 'Access denied.';
          break;
        case 404:
          errorMessage = 'Conversation not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 0:
          errorMessage = 'Connection error. Please check your internet connection.';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }
    }
    
    console.error('Conversation Service Error:', error);
    this.toastService.error('Error', errorMessage);
    
    return throwError(() => new Error(errorMessage));
  }
}