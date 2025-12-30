export interface DocumentDto {
  id: number;
  sourceName: string;
  sourceType: string;
  category: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string; // ISO string
  isActive: boolean;
  status: string;
  processedAt?: string | null; // ISO string or null
  originalUrl?: string | null; // Added for web content sources
}
