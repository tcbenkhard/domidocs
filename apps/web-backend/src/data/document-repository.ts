import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { DocumentMetadata, EncryptionMode } from "@domidocs/contracts";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export type NewDocumentRecord = {
  documentId: string;
  ownerUserId: string;
  encryptionMode: EncryptionMode;
  objectKey: string;
  contentType?: string;
  sizeBytes?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export class DocumentRepository {
  constructor(private readonly tableName: string) {}

  async create(record: NewDocumentRecord): Promise<void> {
    await client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `USER#${record.ownerUserId}`,
          sk: `DOC#${record.documentId}`,
          documentId: record.documentId,
          ownerUserId: record.ownerUserId,
          encryptionMode: record.encryptionMode,
          objectKey: record.objectKey,
          contentType: record.contentType,
          sizeBytes: record.sizeBytes,
          tags: record.tags,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        },
      }),
    );
  }

  async listForUser(userId: string): Promise<DocumentMetadata[]> {
    const res = await client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :d)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":d": "DOC#",
        },
      }),
    );
    return (res.Items ?? []).map((item) => ({
      documentId: item.documentId as string,
      ownerUserId: item.ownerUserId as string,
      encryptionMode: item.encryptionMode as EncryptionMode,
      objectKey: item.objectKey as string,
      contentType: item.contentType as string | undefined,
      sizeBytes: item.sizeBytes as number | undefined,
      tags: (item.tags as string[]) ?? [],
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
    }));
  }
}

export class InMemoryDocumentRepository {
  private readonly docs = new Map<string, DocumentMetadata>();

  async create(record: NewDocumentRecord): Promise<void> {
    const meta: DocumentMetadata = {
      documentId: record.documentId,
      ownerUserId: record.ownerUserId,
      encryptionMode: record.encryptionMode,
      objectKey: record.objectKey,
      contentType: record.contentType,
      sizeBytes: record.sizeBytes,
      tags: record.tags,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
    this.docs.set(record.documentId, meta);
  }

  async listForUser(userId: string): Promise<DocumentMetadata[]> {
    return [...this.docs.values()].filter((d) => d.ownerUserId === userId);
  }
}
