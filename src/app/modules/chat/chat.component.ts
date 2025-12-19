import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
  chatGptResponse?: string;
  knowledgeBaseResponse?: string;
}

interface Conversation {
  id: number;
  title: string;
  preview: string;
  time: string;
  messages: Message[];
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  showUploadModal = false;
  selectedFiles: File[] = [];
  conversations: Conversation[] = [
    {
      id: 1,
      title: 'Investment Account Features',
      preview: 'What are the key features of our...',
      time: '2 hours ago',
      messages: [
        {
          content: 'What are the key features of our premium investment account?',
          isUser: true,
          timestamp: new Date()
        },
        {
          content: '',
          isUser: false,
          timestamp: new Date(),
          chatGptResponse: 'Based on general financial knowledge, premium investment accounts typically offer diversified portfolio management, professional advisory services, and enhanced customer support. These accounts often include automated rebalancing and access to exclusive investment opportunities.',
          knowledgeBaseResponse: 'According to our internal documentation, our premium investment account specifically offers: diversified portfolio management, low-fee index funds, automated rebalancing, dedicated financial advisor access, priority customer support, and exclusive market insights with quarterly performance reviews.'
        }
      ]
    },
    {
      id: 2,
      title: 'Compliance Review Fees',
      preview: 'Can you explain the fee structure for internal...',
      time: 'Yesterday',
      messages: [
        {
          content: 'Can you explain the fee structure for internal compliance reviews?',
          isUser: true,
          timestamp: new Date()
        },
        {
          content: '',
          isUser: false,
          timestamp: new Date(),
          chatGptResponse: 'Compliance review fees generally vary based on the scope and complexity of the audit. Industry standards typically range from a few hundred dollars for basic reviews to several thousand for comprehensive audits.',
          knowledgeBaseResponse: 'Our compliance review fee structure: Basic reviews start at $500, Standard reviews range from $1,500-$3,000, Comprehensive audits range from $2,000-$10,000 depending on organization size. Additional fees may apply for expedited reviews or specialized compliance areas.'
        }
      ]
    },
    {
      id: 3,
      title: 'Market Analysis Q4 2024',
      preview: 'Provide a comprehensive marke...',
      time: '3 days ago',
      messages: [
        {
          content: 'Provide a comprehensive market analysis for Q4 2024',
          isUser: true,
          timestamp: new Date()
        },
        {
          content: '',
          isUser: false,
          timestamp: new Date(),
          chatGptResponse: 'Q4 2024 market trends show continued growth in technology sectors, particularly AI and cloud computing. Healthcare and renewable energy sectors are also showing strong performance. Interest rates appear to be stabilizing after recent adjustments.',
          knowledgeBaseResponse: 'Our Q4 2024 internal market analysis: S&P 500 achieved 12% YTD gain, Technology sector up 18%, Healthcare sector up 14%. Key investment opportunities identified in AI adoption, renewable energy infrastructure, and emerging markets. Recommended portfolio allocation: 40% tech, 25% healthcare, 20% renewable energy, 15% diversified.'
        }
      ]
    }
  ];

  selectedConversation: Conversation | null = null;
  currentMessages: Message[] = [];
  newMessage: string = '';
  searchQuery: string = '';
  private shouldScrollToBottom = false;

  ngOnInit() {
    // Select first conversation by default
    if (this.conversations.length > 0) {
      this.selectConversation(this.conversations[0]);
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
    this.currentMessages = [...conversation.messages];
    this.shouldScrollToBottom = true;
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
    const newConv: Conversation = {
      id: this.conversations.length + 1,
      title: 'New Conversation',
      preview: 'Start a new conversation...',
      time: 'Just now',
      messages: [
        {
          content: 'Hello! How can I assist you today?',
          isUser: false,
          timestamp: new Date()
        }
      ]
    };
    this.conversations.unshift(newConv);
    this.selectConversation(newConv);
  }

  sendMessage() {
    if (this.newMessage.trim() && this.selectedConversation) {
      // Add user message
      const userMessage: Message = {
        content: this.newMessage,
        isUser: true,
        timestamp: new Date()
      };
      this.currentMessages.push(userMessage);
      this.selectedConversation.messages.push(userMessage);

      // Update conversation preview
      this.selectedConversation.preview = this.newMessage.substring(0, 40) + '...';
      this.selectedConversation.time = 'Just now';

      // Clear input
      const messageText = this.newMessage;
      this.newMessage = '';

      // Scroll to bottom after user message
      this.shouldScrollToBottom = true;

      // Simulate AI response after a short delay
      setTimeout(() => {
        const aiMessage: Message = {
          content: '',
          isUser: false,
          timestamp: new Date(),
          chatGptResponse: `Based on general knowledge, I can provide information about "${messageText}". This is a ChatGPT-style response that draws from general training data and common knowledge patterns.`,
          knowledgeBaseResponse: `According to our internal knowledge base regarding "${messageText}": This response is generated from our specific company documentation, policies, and proprietary information that provides more accurate and contextual answers.`
        };
        this.currentMessages.push(aiMessage);
        if (this.selectedConversation) {
          this.selectedConversation.messages.push(aiMessage);
        }
        // Scroll to bottom after AI response
        this.shouldScrollToBottom = true;
      }, 1000);
    }
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
          alert(`File ${file.name} exceeds 10MB limit`);
        }
      }
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  uploadFiles() {
    if (this.selectedFiles.length === 0) {
      alert('Please select at least one file');
      return;
    }

    // Simulate file upload
    console.log('Uploading files:', this.selectedFiles);
    
    // Add a message indicating files were uploaded
    if (this.selectedConversation) {
      const fileNames = this.selectedFiles.map(f => f.name).join(', ');
      const uploadMessage: Message = {
        content: `📎 Uploaded ${this.selectedFiles.length} file(s): ${fileNames}`,
        isUser: true,
        timestamp: new Date()
      };
      this.currentMessages.push(uploadMessage);
      this.selectedConversation.messages.push(uploadMessage);
      this.shouldScrollToBottom = true;
    }

    // Close modal and reset
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
    const diff = now.getTime() - timestamp.getTime();
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
      conv.preview.toLowerCase().includes(query)
    );
  }
}
