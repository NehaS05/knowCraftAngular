import { Component } from '@angular/core';

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
}

@Component({
  selector: 'app-knowledge',
  templateUrl: './knowledge.component.html',
  styleUrls: ['./knowledge.component.css']
})
export class KnowledgeComponent {
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
  knowledgeSources: KnowledgeSource[] = [];
  nextId = 1;

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
      // Update existing source
      const sourceIndex = this.knowledgeSources.findIndex(s => s.id === this.editingSourceId);
      if (sourceIndex !== -1) {
        this.knowledgeSources[sourceIndex] = {
          ...this.knowledgeSources[sourceIndex],
          name: this.sourceName,
          type: this.selectedSourceType,
          category: this.category || undefined,
          fileName: this.selectedFile?.name || this.knowledgeSources[sourceIndex].fileName,
          url: this.websiteUrl || undefined
        };
        alert('Source updated successfully!');
      }
    } else {
      // Add new source
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
      alert('Source added successfully!');
      
      // Switch to view tab to see the added source
      this.activeTab = 'view';
    }

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

  deleteSource(id: number) {
    if (confirm('Are you sure you want to delete this source?')) {
      this.knowledgeSources = this.knowledgeSources.filter(s => s.id !== id);
    }
  }

  getSourceTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'file': 'File',
      'website': 'Url',
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
