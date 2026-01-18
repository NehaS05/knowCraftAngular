import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { DocumentService } from '../../core/services/document.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingService } from '../../core/services/loading.service';
import { DocumentDto } from '../../core/models/document.model';

interface SourceType {
  value: string;
  label: string;
  icon: string;
}

interface KnowledgeSource {
  id: number;
  name: string;
  type: string;
  category?: string;
  fileName?: string;
  url?: string;
  status: 'Processing' | 'Indexing' | 'Ready' | 'Failed';
  addedDate: Date;
  isActive?: boolean;
  isSearchable?: boolean;
}

@Component({
  selector: 'app-knowledge',
  templateUrl: './knowledge.component.html',
  styleUrls: ['./knowledge.component.css']
})
export class KnowledgeComponent implements OnInit, OnDestroy {
  activeTab: 'add' | 'view' = 'add';
  showModal = false;
  isEditMode = false;
  editingSourceId: number | null = null;
  selectedSourceType = 'file';
  sourceName = '';
  selectedFile: File | null = null;
  websiteUrl = '';
  textContent = '';
  qaContent = '';
  category = '';
  isActive = true;
  knowledgeSources: KnowledgeSource[] = [];
  nextId = 1;

  // Upload state
  uploading = false;
  uploadProgress = 0;

  // Auto-refresh for indexing documents
  private refreshInterval: any;

  constructor(
    private documentService: DocumentService,
    private toast: ToastService,
    private loading: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  private startAutoRefresh(): void {
    // Check indexing documents every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.checkIndexingDocuments();
    }, 30000);
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private checkIndexingDocuments(): void {
    const indexingDocs = this.knowledgeSources.filter(doc => doc.status === 'Indexing');
    
    if (indexingDocs.length === 0) {
      return; // No indexing documents to check
    }

    indexingDocs.forEach(doc => {
      this.documentService.verifyDocumentSearch(doc.id).subscribe({
        next: (status) => {
          const source = this.knowledgeSources.find(s => s.id === doc.id);
          if (source && status.status === 'Completed') {
            source.status = 'Ready';
            source.isSearchable = true;
            this.toast.success('Document Ready', `${source.name} is now searchable in chat`);
          }
        },
        error: (err) => {
          // Silently handle errors during auto-refresh
          console.warn(`Auto-refresh failed for document ${doc.id}:`, err);
        }
      });
    });
  }

  private loadDocuments(): void {
    this.loading.show();
    this.documentService.getDocuments().subscribe({
      next: (docs: DocumentDto[]) => {
        this.knowledgeSources = docs.map(doc => ({
          id: doc.id,
          name: doc.sourceName,
          type: doc.sourceType,
          category: doc.category || undefined,
          fileName: this.getFileNameForSource(doc),
          url: doc.originalUrl || undefined,
          status: this.mapDocumentStatus(doc.status),
          addedDate: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
          isActive: doc.isActive,
          isSearchable: false // Will be checked separately for completed documents
        }));
        
        // Check search status for completed documents
        this.checkSearchStatusForCompletedDocuments();
        
        this.loading.hide();
      },
      error: (err) => {
        console.error('Failed to load documents', err);
        this.toast.error('Failed to load documents', err?.message || 'See console for details');
        this.loading.hide();
      }
    });
  }

  private mapDocumentStatus(status: string): 'Processing' | 'Indexing' | 'Ready' | 'Failed' {
    switch (status) {
      case 'Pending':
      case 'Processing':
        return 'Processing';
      case 'Indexing':
        return 'Indexing';
      case 'Completed':
        return 'Ready';
      case 'Failed':
        return 'Failed';
      default:
        return 'Processing';
    }
  }

  private checkSearchStatusForCompletedDocuments(): void {
    const indexingDocs = this.knowledgeSources.filter(doc => doc.status === 'Indexing');
    
    indexingDocs.forEach(doc => {
      this.documentService.verifyDocumentSearch(doc.id).subscribe({
        next: (status) => {
          const source = this.knowledgeSources.find(s => s.id === doc.id);
          if (source) {
            source.isSearchable = status.isSearchable;
            if (status.status === 'Completed') {
              source.status = 'Ready';
              this.toast.success('Document Ready', `${source.name} is now searchable in chat`);
            }
          }
        },
        error: (err) => {
          console.warn(`Failed to verify search status for document ${doc.id}:`, err);
        }
      });
    });

    // Also check completed documents that might not be searchable yet
    const completedDocs = this.knowledgeSources.filter(doc => doc.status === 'Ready');
    
    completedDocs.forEach(doc => {
      this.documentService.getDocumentSearchStatus(doc.id).subscribe({
        next: (status) => {
          const source = this.knowledgeSources.find(s => s.id === doc.id);
          if (source) {
            source.isSearchable = status.isSearchable;
            // If document is completed but not searchable, show as indexing
            if (!status.isSearchable && source.status === 'Ready') {
              source.status = 'Indexing';
            }
          }
        },
        error: (err) => {
          console.warn(`Failed to check search status for document ${doc.id}:`, err);
        }
      });
    });
  }

  private getFileNameForSource(doc: DocumentDto): string | undefined {
    if (doc.sourceType === 'website') {
      return undefined; // Website sources show URL instead
    } else if (doc.sourceType === 'text' || doc.sourceType === 'qa') {
      return `${doc.sourceName}.txt`; // Text and Q&A sources show as .txt files
    } else {
      return `${doc.sourceName}${doc.sourceType}`; // File sources show with extension
    }
  }

  sourceTypes: SourceType[] = [
    { value: 'file', label: 'File Upload', icon: 'file' },
    { value: 'website', label: 'Website URL', icon: 'globe' },
    // { value: 'text', label: 'Text Content', icon: 'text' },
    // { value: 'qa', label: 'Q&A Pairs', icon: 'help' }
  ];

  setActiveTab(tab: 'add' | 'view') {
    this.activeTab = tab;
  }

  openFileUpload() {
    this.selectedSourceType = 'file';
    this.openModal();
  }

  openWebsiteUrl() {
    this.selectedSourceType = 'website';
    this.openModal();
  }

  openTextContent() {
    this.selectedSourceType = 'text';
    this.openModal();
  }

  openQAPairs() {
    this.selectedSourceType = 'qa';
    this.openModal();
  }

  openModal() {
    this.isEditMode = false;
    this.editingSourceId = null;
    this.showModal = true;
    this.sourceName = '';
    this.selectedFile = null;
    this.websiteUrl = '';
    this.textContent = '';
    this.qaContent = '';
    this.category = '';
    this.isActive = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditMode = false;
    this.editingSourceId = null;
  }

  editSource(source: KnowledgeSource) {
    this.isEditMode = true;
    this.editingSourceId = source.id;
    this.sourceName = source.name;
    this.selectedSourceType = source.type;
    this.category = source.category || '';
    this.websiteUrl = source.url || '';
    this.selectedFile = null;
    this.textContent = '';
    this.qaContent = '';
    this.isActive = source.isActive ?? true;
    this.showModal = true;
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  addSource() {
    if (!this.sourceName.trim()) {
      alert('Please enter a source name');
      return;
    }

    if (this.selectedSourceType === 'file' && !this.selectedFile && !this.isEditMode) {
      alert('Please select a file');
      return;
    }

    if (this.selectedSourceType === 'website' && !this.websiteUrl.trim()) {
      alert('Please enter a website URL');
      return;
    }

    if (this.selectedSourceType === 'text' && !this.textContent.trim() && !this.isEditMode) {
      alert('Please enter text content');
      return;
    }

    if (this.selectedSourceType === 'qa' && !this.qaContent.trim() && !this.isEditMode) {
      alert('Please enter Q&A content');
      return;
    }

    if (this.isEditMode && this.editingSourceId !== null) {
      const id = this.editingSourceId;
      this.loading.show();
      this.documentService.updateDocument(id, this.sourceName, this.category, this.isActive).subscribe({
        next: (updated: DocumentDto) => {
          const idx = this.knowledgeSources.findIndex(s => s.id === id);
          if (idx !== -1) {
            this.knowledgeSources[idx] = {
              ...this.knowledgeSources[idx],
              name: updated.sourceName,
              type: updated.sourceType || this.selectedSourceType,
              category: updated.category || undefined,
              isActive: true//updated.isActive
            };
          }
          this.toast.success('Source updated', 'The source was updated successfully');
          this.loading.hide();
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to update source', err);
          this.toast.error('Failed to update source', err?.message || 'See console for details');
          this.loading.hide();
        }
      });
      return;
    }

    // If file source, perform multipart upload using expected backend fields
    if (this.selectedSourceType === 'file' && this.selectedFile) {
      this.uploading = true;
      this.uploadProgress = 0;
      this.loading.show();

      this.documentService.uploadDocument(this.selectedFile, this.sourceName, this.category, this.selectedSourceType).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          } else if (event.type === HttpEventType.Response) {
            const resp = event.body;
            this.loadDocuments(); // Reload documents from backend
            this.toast.success('Upload successful', `${this.selectedFile?.name} uploaded`);
            this.activeTab = 'view';

            this.uploading = false;
            this.uploadProgress = 0;
            this.loading.hide();
            this.closeModal();
          }
        },
        error: (err) => {
          console.error('Upload failed', err);
          this.toast.error('Upload failed', err?.message || 'An error occurred while uploading');
          this.uploading = false;
          this.uploadProgress = 0;
          this.loading.hide();
        }
      });

      console.log('Uploading file with fields:', { File: this.selectedFile?.name, SourceName: this.sourceName, Category: this.category });
      return;
    }

    // If website source, perform URL upload using backend
    if (this.selectedSourceType === 'website' && this.websiteUrl) {
      this.uploading = true;
      this.uploadProgress = 0;
      this.loading.show();

      this.documentService.uploadDocument(null, this.sourceName, this.category, this.selectedSourceType, this.websiteUrl).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          } else if (event.type === HttpEventType.Response) {
            const resp = event.body;
            this.loadDocuments(); // Reload documents from backend
            this.toast.success('Web content extracted', `Content from ${this.websiteUrl} processed successfully`);
            this.activeTab = 'view';

            this.uploading = false;
            this.uploadProgress = 0;
            this.loading.hide();
            this.closeModal();
          }
        },
        error: (err) => {
          console.error('Web content extraction failed', err);
          this.toast.error('Web content extraction failed', err?.message || 'An error occurred while processing the URL');
          this.uploading = false;
          this.uploadProgress = 0;
          this.loading.hide();
        }
      });

      console.log('Processing URL:', { Url: this.websiteUrl, SourceName: this.sourceName, Category: this.category });
      return;
    }

    // If text content source, create text file and process through backend
    if (this.selectedSourceType === 'text' && this.textContent.trim()) {
      this.uploading = true;
      this.uploadProgress = 0;
      this.loading.show();

      // Create a text file from the content
      const textBlob = new Blob([this.textContent], { type: 'text/plain' });
      const textFile = new File([textBlob], `${this.sourceName}.txt`, { type: 'text/plain' });

      this.documentService.uploadDocument(textFile, this.sourceName, this.category, this.selectedSourceType).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          } else if (event.type === HttpEventType.Response) {
            const resp = event.body;
            this.loadDocuments(); // Reload documents from backend
            this.toast.success('Text content processed', 'Your text content has been processed successfully');
            this.activeTab = 'view';

            this.uploading = false;
            this.uploadProgress = 0;
            this.loading.hide();
            this.closeModal();
          }
        },
        error: (err) => {
          console.error('Text content processing failed', err);
          this.toast.error('Text content processing failed', err?.message || 'An error occurred while processing the text');
          this.uploading = false;
          this.uploadProgress = 0;
          this.loading.hide();
        }
      });

      console.log('Processing text content:', { SourceName: this.sourceName, Category: this.category, ContentLength: this.textContent.length });
      return;
    }

    // If Q&A content source, create text file and process through backend
    if (this.selectedSourceType === 'qa' && this.qaContent.trim()) {
      this.uploading = true;
      this.uploadProgress = 0;
      this.loading.show();

      // Create a text file from the Q&A content
      const qaBlob = new Blob([this.qaContent], { type: 'text/plain' });
      const qaFile = new File([qaBlob], `${this.sourceName}.txt`, { type: 'text/plain' });

      this.documentService.uploadDocument(qaFile, this.sourceName, this.category, this.selectedSourceType).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round((100 * event.loaded) / event.total);
          } else if (event.type === HttpEventType.Response) {
            const resp = event.body;
            this.loadDocuments(); // Reload documents from backend
            this.toast.success('Q&A content processed', 'Your Q&A content has been processed successfully');
            this.activeTab = 'view';

            this.uploading = false;
            this.uploadProgress = 0;
            this.loading.hide();
            this.closeModal();
          }
        },
        error: (err) => {
          console.error('Q&A content processing failed', err);
          this.toast.error('Q&A content processing failed', err?.message || 'An error occurred while processing the Q&A content');
          this.uploading = false;
          this.uploadProgress = 0;
          this.loading.hide();
        }
      });

      console.log('Processing Q&A content:', { SourceName: this.sourceName, Category: this.category, ContentLength: this.qaContent.length });
      return;
    }

    // Fallback for any unhandled cases
    this.toast.error('Invalid source type', 'Please select a valid source type and provide the required content');
  }

  getSourceIconClass(type: string): string {
    const classMap: { [key: string]: string } = {
      'file': 'icon-blue',
      'website': 'icon-green',
      'text': 'icon-orange',
      'qa': 'icon-red'
    };
    return classMap[type] || 'icon-blue';
  }

  // Open a confirmation modal before deleting
  confirmTargetId: number | null = null;
  showConfirmModal = false;
  confirmMessage = '';

  confirmDelete(source: KnowledgeSource) {
    this.confirmTargetId = source.id;
    this.confirmMessage = `Are you sure you want to delete "${source.name}"?`;
    this.showConfirmModal = true;
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.confirmTargetId = null;
    this.confirmMessage = '';
  }

  onConfirmDelete() {
    if (this.confirmTargetId === null) {
      return;
    }

    const id = this.confirmTargetId;
    this.loading.show();
    this.documentService.deleteDocument(id).subscribe({
      next: () => {
        this.knowledgeSources = this.knowledgeSources.filter(s => s.id !== id);
        this.toast.success('Source deleted', 'The source was deleted successfully');
        this.closeConfirmModal();
        this.loading.hide();
      },
      error: (err) => {
        console.error('Failed to delete source', err);
        this.toast.error('Failed to delete source', err?.message || 'See console for details');
        this.loading.hide();
      }
    });
  }

  getSourceTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'file': 'File',
      'website': 'Website',
      'text': 'Text',
      'qa': 'Q&A'
    };
    return typeMap[type] || type;
  }

  getReadyCount(): number {
    return this.knowledgeSources.filter(s => s.status === 'Ready' && s.isSearchable !== false).length;
  }

  getProcessingCount(): number {
    return this.knowledgeSources.filter(s => s.status === 'Processing').length;
  }

  getIndexingCount(): number {
    return this.knowledgeSources.filter(s => s.status === 'Indexing').length;
  }

  getFailedCount(): number {
    return this.knowledgeSources.filter(s => s.status === 'Failed').length;
  }

  refreshSearchStatus(source: KnowledgeSource): void {
    this.documentService.verifyDocumentSearch(source.id).subscribe({
      next: (status) => {
        source.isSearchable = status.isSearchable;
        if (status.status === 'Completed') {
          source.status = 'Ready';
          this.toast.success('Document Ready', `${source.name} is now searchable in chat`);
        } else if (status.status === 'Indexing') {
          this.toast.info('Still Indexing', `${source.name} is still being indexed. Please try again in a few moments.`);
        }
      },
      error: (err) => {
        console.warn(`Failed to refresh search status for document ${source.id}:`, err);
        this.toast.error('Failed to check search status', 'Please try again later');
      }
    });
  }
}
