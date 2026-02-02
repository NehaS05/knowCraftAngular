import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentDto } from '../models/document.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/Document`;
  constructor(private http: HttpClient) {}

  /**
   * Upload a document using the exact form fields expected by the backend:
   * - 'File' (file) - for file uploads
   * - 'Url' (string) - for web content extraction
   * - 'SourceName' (string)
   * - 'Category' (string)
   * - 'SourceType' (string)
   */
  uploadDocument(file: File | null, sourceName: string, category?: string, sourceType?: string, url?: string): Observable<HttpEvent<any>> {
    const fd = new FormData();
    
    if (file) {
      // File upload
      fd.append('File', file, file.name);
    } else if (url) {
      // URL upload
      fd.append('Url', url);
    }
    
    fd.append('SourceName', sourceName);
    fd.append('Category', category || '');
    fd.append('SourceType', sourceType || '');

    return this.http.post<DocumentDto>(`${this.apiUrl}/upload`, fd, {
      reportProgress: true,
      observe: 'events',
      responseType: 'json'
    });
  }

  /**
   * Retrieve list of documents (for page load table binding)
   */
  getDocuments(): Observable<DocumentDto[]> {
    return this.http.get<DocumentDto[]>(this.apiUrl);
  }

  /**
   * Update document metadata (sourceName, category, isActive)
   */
  updateDocument(id: number, sourceName: string, category?: string, isActive?: boolean): Observable<DocumentDto> {
    const body = {
      sourceName,
      category: category || '',
      isActive: !!isActive
    };
    return this.http.put<DocumentDto>(`${this.apiUrl}/${id}`, body);
  }

  /**
   * Delete a document by id
   */
  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Check if a document is searchable
   */
  getDocumentSearchStatus(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/search-status`);
  }

  /**
   * Verify and update document search status
   */
  verifyDocumentSearch(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/verify-search`, {});
  }
}
