import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { createHash, randomBytes } from "node:crypto";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export type RefreshTokenRecord = {
  tokenId: string;
  userId: string;
  tokenHashB64: string;
  expiresAtEpochSec: number;
  createdAt: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export class RefreshTokenRepository {
  constructor(private readonly tableName: string) {}

  async save(record: RefreshTokenRecord): Promise<void> {
    await client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `REFRESH#${record.tokenId}`,
          sk: "TOKEN",
          userId: record.userId,
          tokenHashB64: record.tokenHashB64,
          expiresAtEpochSec: record.expiresAtEpochSec,
          createdAt: record.createdAt,
        },
      }),
    );
  }

  async consume(tokenId: string, rawToken: string): Promise<RefreshTokenRecord | null> {
    const res = await client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `REFRESH#${tokenId}`, sk: "TOKEN" },
      }),
    );
    const item = res.Item;
    if (!item) return null;
    const expected = item.tokenHashB64 as string;
    const actual = hashToken(rawToken);
    if (expected !== actual) return null;
    const now = Math.floor(Date.now() / 1000);
    if ((item.expiresAtEpochSec as number) < now) return null;
    return {
      tokenId,
      userId: item.userId as string,
      tokenHashB64: expected,
      expiresAtEpochSec: item.expiresAtEpochSec as number,
      createdAt: item.createdAt as string,
    };
  }

  async delete(tokenId: string): Promise<void> {
    await client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { pk: `REFRESH#${tokenId}`, sk: "TOKEN" },
      }),
    );
  }
}

export class InMemoryRefreshTokenRepository {
  private readonly tokens = new Map<string, RefreshTokenRecord>();

  async save(record: RefreshTokenRecord): Promise<void> {
    this.tokens.set(record.tokenId, record);
  }

  async consume(tokenId: string, rawToken: string): Promise<RefreshTokenRecord | null> {
    const record = this.tokens.get(tokenId);
    if (!record) return null;
    const actual = createHash("sha256").update(rawToken).digest("base64url");
    if (record.tokenHashB64 !== actual) return null;
    const now = Math.floor(Date.now() / 1000);
    if (record.expiresAtEpochSec < now) return null;
    return record;
  }

  async delete(tokenId: string): Promise<void> {
    this.tokens.delete(tokenId);
  }
}

export function newRefreshTokenRaw(): { tokenId: string; raw: string } {
  const tokenId = randomBytes(16).toString("hex");
  const raw = randomBytes(32).toString("base64url");
  return { tokenId, raw };
}

export function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("base64url");
}
