import type { EncryptionMode } from "./encryption-mode";

export type DocumentMetadata = {
  documentId: string;
  ownerUserId: string;
  encryptionMode: EncryptionMode;
  /** S3 object key (server never decrypts in CLIENT mode). */
  objectKey: string;
  contentType?: string;
  sizeBytes?: number;
  /** Plaintext tags when encryptionMode === BACKEND; opaque when CLIENT. */
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateDocumentRequest = {
  encryptionMode: EncryptionMode;
  contentType?: string;
  tags?: string[];
};

export type CreateDocumentResponse = {
  documentId: string;
  uploadUrl: string;
  /** When the presigned URL expires (ISO-8601). */
  uploadExpiresAt: string;
};

export type ListDocumentsResponse = {
  items: DocumentMetadata[];
};
