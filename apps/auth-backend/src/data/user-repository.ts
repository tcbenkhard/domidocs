import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { EncryptionMode } from "@domidocs/contracts";
import type { PasswordHashRecord } from "../business/password";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export type UserRecord = {
  userId: string;
  email: string;
  password: PasswordHashRecord;
  defaultEncryptionMode: EncryptionMode;
  createdAt: string;
};

export class UserRepository {
  constructor(private readonly tableName: string) {}

  async createUser(record: UserRecord): Promise<void> {
    await client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `USER#${record.userId}`,
          sk: "PROFILE",
          gsi1pk: `EMAIL#${record.email.toLowerCase()}`,
          gsi1sk: `USER#${record.userId}`,
          userId: record.userId,
          email: record.email.toLowerCase(),
          password: record.password,
          defaultEncryptionMode: record.defaultEncryptionMode,
          createdAt: record.createdAt,
        },
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const res = await client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: "Gsi1",
        KeyConditionExpression: "gsi1pk = :e",
        ExpressionAttributeValues: {
          ":e": `EMAIL#${email.toLowerCase()}`,
        },
        Limit: 1,
      }),
    );
    const item = res.Items?.[0];
    if (!item) return null;
    return {
      userId: item.userId as string,
      email: item.email as string,
      password: item.password as PasswordHashRecord,
      defaultEncryptionMode: item.defaultEncryptionMode as EncryptionMode,
      createdAt: item.createdAt as string,
    };
  }

  async getById(userId: string): Promise<UserRecord | null> {
    const res = await client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: `USER#${userId}`, sk: "PROFILE" },
      }),
    );
    const item = res.Item;
    if (!item) return null;
    return {
      userId: item.userId as string,
      email: item.email as string,
      password: item.password as PasswordHashRecord,
      defaultEncryptionMode: item.defaultEncryptionMode as EncryptionMode,
      createdAt: item.createdAt as string,
    };
  }
}

export class InMemoryUserRepository {
  private readonly byEmail = new Map<string, UserRecord>();
  private readonly byId = new Map<string, UserRecord>();

  async createUser(record: UserRecord): Promise<void> {
    if (this.byEmail.has(record.email.toLowerCase())) {
      throw new Error("Conflict");
    }
    this.byEmail.set(record.email.toLowerCase(), record);
    this.byId.set(record.userId, record);
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.byEmail.get(email.toLowerCase()) ?? null;
  }

  async getById(userId: string): Promise<UserRecord | null> {
    return this.byId.get(userId) ?? null;
  }
}
