import { randomUUID } from "node:crypto";
import type { CreateDocumentRequest, CreateDocumentResponse } from "@domidocs/contracts";
import type { WebEnv } from "../config";
import type { DocumentRepository, InMemoryDocumentRepository } from "../data/document-repository";
import { presignPut } from "../data/s3-presign";

export async function createDocument(
  env: WebEnv,
  docs: DocumentRepository | InMemoryDocumentRepository,
  ownerUserId: string,
  body: CreateDocumentRequest,
): Promise<CreateDocumentResponse> {
  const documentId = randomUUID();
  const objectKey = `users/${ownerUserId}/${documentId}`;
  const now = new Date().toISOString();
  await docs.create({
    documentId,
    ownerUserId,
    encryptionMode: body.encryptionMode,
    objectKey,
    contentType: body.contentType,
    tags: body.tags ?? [],
    createdAt: now,
    updatedAt: now,
  });

  if (env.useInMemoryStore) {
    return {
      documentId,
      uploadUrl: `http://localhost/fake-upload/${objectKey}`,
      uploadExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  const { url, uploadExpiresAt } = await presignPut({
    bucket: env.documentsBucketName,
    key: objectKey,
    contentType: body.contentType,
  });
  return {
    documentId,
    uploadUrl: url,
    uploadExpiresAt,
  };
}
