import { Component, OnInit } from '@angular/core';
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
  status: 'Processing' | 'Ready' | 'Failed';
  addedDate: Date;
  isActive?: boolean;
}

@Component({
  selector: 'app-knowledge',
  templateUrl: './knowledge.component.html',
  styleUrls: ['./knowledge.component.css']
})
export class KnowledgeComponent implements OnInit {
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

  constructor(
    private documentService: DocumentService,
    private toast: ToastService,
    private loading: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
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
          fileName: doc.sourceType === 'website' ? undefined : `${doc.sourceName}${doc.sourceType}`,
          url: doc.originalUrl || undefined,
          status: (doc.status as 'Processing' | 'Ready' | 'Failed') || 'Processing',
          addedDate: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
          isActive: doc.isActive
        }));
        this.loading.hide();
      },
      error: (err) => {
        console.error('Failed to load documents', err);
        this.toast.error('Failed to load documents', err?.message || 'See console for details');
        this.loading.hide();
      }
    });
  }

  sourceTypes: SourceType[] = [
    { value: 'file', label: 'File Upload', icon: 'file' },
    { value: 'website', label: 'Website URL', icon: 'globe' },
    { value: 'text', label: 'Text Content', icon: 'text' },
    { value: 'qa', label: 'Q&A Pairs', icon: 'help' }
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

    // Other source types (website, text, qa): add in-memory source as before
    const newSource: KnowledgeSource = {
      id: this.nextId++,
      name: this.sourceName,
      type: this.selectedSourceType,
      category: this.category || undefined,
      fileName: this.selectedFile?.name,
      url: this.websiteUrl || undefined,
      status: 'Processing',
      addedDate: new Date()
    };

    this.knowledgeSources.push(newSource);
    this.toast.success('Source added', 'Source added successfully');
    this.activeTab = 'view';

    console.log('Saving source:', {
      name: this.sourceName,
      type: this.selectedSourceType,
      file: this.selectedFile,
      websiteUrl: this.websiteUrl,
      textContent: this.textContent,
      qaContent: this.qaContent,
      category: this.category
    });

    this.closeModal();
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
    return this.knowledgeSources.filter(s => s.status === 'Ready').length;
  }

  getProcessingCount(): number {
    return this.knowledgeSources.filter(s => s.status === 'Processing').length;
  }

  getFailedCount(): number {
    return this.knowledgeSources.filter(s => s.status === 'Failed').length;
  }
}
