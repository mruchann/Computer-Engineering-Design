export interface FileMetadata {
  filename: string;
  magnetLink: string;
  timestamp: string;
  isDirectory: boolean;
  owner?: string;
  ownerUsername?: string;
  [key: string]: any; // For other metadata properties from extraction
  hash?: string;
} 