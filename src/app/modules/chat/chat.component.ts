import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConversationService } from '../../core/services/conversation.service';
import { LoadingService } from '../../core/services/loading.service';
import { ToastService } from '../../core/services/toast.service';
import { Conversation, Message, SendMessageDto } from '../../core/models/conversation.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  // UI State
  showUploadModal = false;
  selectedFiles: File[] = [];
  newMessage: string = '';
  searchQuery: string = '';
  private shouldScrollToBottom = false;
  private destroy$ = new Subject<void>();
  
  // Data from service
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  currentMessages: Message[] = [];
  isLoading = false;

  constructor(
    private conversationService: ConversationService,
    private loadingService: LoadingService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    // Subscribe to service observables
    this.conversationService.conversations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(conversations => {
        this.conversations = conversations;
        // Select first conversation if none selected and conversations exist
        if (!this.selectedConversation && conversations.length > 0) {
          this.selectConversation(conversations[0]);
        }
      });

    this.conversationService.currentMessages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.currentMessages = messages;
        this.shouldScrollToBottom = true;
      });

    this.conversationService.selectedConversation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(conversation => {
        this.selectedConversation = conversation;
      });

    this.loadingService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    // Load conversations on init
    this.loadConversations();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  selectConversation(conversation: Conversation) {
    this.conversationService.selectConversation(conversation);
  }

  private loadConversations() {
    this.conversationService.loadConversations().subscribe({
      next: () => {
        // Conversations are automatically updated via the service observable
      },
      error: (error) => {
        console.error('Failed to load conversations:', error);
      }
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  isConversationActive(conversation: Conversation): boolean {
    return this.selectedConversation?.id === conversation.id;
  }

  createNewConversation() {
    // Clear selection to start a new conversation
    this.conversationService.clearSelection();
    this.newMessage = '';
  }

  sendMessage() {
    if (!this.newMessage.trim()) {
      this.toastService.warning('Empty message', 'Please enter a message before sending');
      return;
    }

    if (this.newMessage.trim().length > 1000) {
      this.toastService.warning('Message too long', 'Please keep your message under 1000 characters');
      return;
    }

    const messageContent = this.newMessage.trim();
    this.newMessage = ''; // Clear input immediately

    const dto: SendMessageDto = {
      conversationId: this.selectedConversation?.id || null,
      content: messageContent
    };

    this.conversationService.sendMessage(dto).subscribe({
      next: (response) => {
        // Message and conversation updates are handled by the service
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Failed to send message:', error);
        // Restore message content on error
        this.newMessage = messageContent;
        this.toastService.error('Failed to send message', 'Please try again');
      }
    });
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  openUploadModal() {
    this.showUploadModal = true;
    this.selectedFiles = [];
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.selectedFiles = [];
  }

  onFileSelect(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Check file size (max 10MB)
        if (file.size <= 10 * 1024 * 1024) {
          this.selectedFiles.push(file);
        } else {
          this.toastService.warning('File too large', `File ${file.name} exceeds 10MB limit`);
        }
      }
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      this.toastService.warning('No files selected', 'Please select at least one file');
      return;
    }

    // For now, just show the files as uploaded in the chat
    // This can be enhanced later to integrate with the document system
    const fileNames = this.selectedFiles.map(f => f.name).join(', ');
    
    if (this.selectedConversation) {
      const dto: SendMessageDto = {
        conversationId: this.selectedConversation.id,
        content: `📎 Uploaded ${this.selectedFiles.length} file(s): ${fileNames}`
      };

      this.conversationService.sendMessage(dto).subscribe({
        next: () => {
          this.toastService.success('Files uploaded', 'Files have been attached to the conversation');
        },
        error: (error) => {
          console.error('Failed to upload files:', error);
        }
      });
    }

    this.closeUploadModal();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diff = now.getTime() - messageTime.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  get filteredConversations(): Conversation[] {
    if (!this.searchQuery.trim()) {
      return this.conversations;
    }
    
    const query = this.searchQuery.toLowerCase();
    return this.conversations.filter(conv => 
      conv.title.toLowerCase().includes(query) ||
      (conv.preview && conv.preview.toLowerCase().includes(query))
    );
  }

  getConversationTime(conversation: Conversation): string {
    const date = conversation.updatedAt || conversation.createdAt;
    return this.getTimeAgo(date);
  }

  getConversationPreview(conversation: Conversation): string {
    return conversation.preview || 'No messages yet...';
  }

  deleteConversation(event: Event, conversation: Conversation): void {
    event.stopPropagation(); // Prevent conversation selection
    
    if (confirm(`Are you sure you want to delete "${conversation.title}"?`)) {
      this.conversationService.deleteConversation(conversation.id).subscribe({
        next: () => {
          // Deletion is handled by the service
        },
        error: (error) => {
          console.error('Failed to delete conversation:', error);
        }
      });
    }
  }

  refreshConversations(): void {
    this.conversationService.refreshConversations().subscribe({
      next: () => {
        this.toastService.success('Conversations refreshed');
      },
      error: (error) => {
        console.error('Failed to refresh conversations:', error);
      }
    });
  }
}
