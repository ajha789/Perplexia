// Database storage implementation - javascript_database blueprint
import { 
  chats, messages, apiKeys,
  type Chat, type InsertChat, 
  type Message, type InsertMessage,
  type ApiKey, type InsertApiKey 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Chats
  getChats(): Promise<Chat[]>;
  getChat(id: string): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  updateChat(id: string, data: Partial<InsertChat>): Promise<Chat | undefined>;
  deleteChat(id: string): Promise<void>;

  // Messages
  getMessages(chatId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // API Keys
  getApiKeyStatuses(): Promise<ApiKey[]>;
  getActiveApiKey(): Promise<ApiKey | undefined>;
  markKeyExhausted(keyIndex: number): Promise<void>;
  resetKeyStatus(keyIndex: number): Promise<void>;
  initializeApiKeys(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Chats
  async getChats(): Promise<Chat[]> {
    return db.select().from(chats).orderBy(desc(chats.updatedAt));
  }

  async getChat(id: string): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat || undefined;
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const [chat] = await db.insert(chats).values(insertChat).returning();
    return chat;
  }

  async updateChat(id: string, data: Partial<InsertChat>): Promise<Chat | undefined> {
    const [chat] = await db
      .update(chats)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chats.id, id))
      .returning();
    return chat || undefined;
  }

  async deleteChat(id: string): Promise<void> {
    await db.delete(chats).where(eq(chats.id, id));
  }

  // Messages
  async getMessages(chatId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  // API Keys
  async getApiKeyStatuses(): Promise<ApiKey[]> {
    return db.select().from(apiKeys).orderBy(apiKeys.keyIndex);
  }

  async getActiveApiKey(): Promise<ApiKey | undefined> {
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.isExhausted, false))
      .orderBy(apiKeys.keyIndex)
      .limit(1);
    return key || undefined;
  }

  async markKeyExhausted(keyIndex: number): Promise<void> {
    await db
      .update(apiKeys)
      .set({ isExhausted: true, isActive: false })
      .where(eq(apiKeys.keyIndex, keyIndex));
  }

  async resetKeyStatus(keyIndex: number): Promise<void> {
    await db
      .update(apiKeys)
      .set({ isExhausted: false, isActive: true, errorCount: 0 })
      .where(eq(apiKeys.keyIndex, keyIndex));
  }

  async initializeApiKeys(): Promise<void> {
    const existingKeys = await db.select().from(apiKeys);
    if (existingKeys.length === 0) {
      await db.insert(apiKeys).values([
        { keyIndex: 1, isActive: true, isExhausted: false, errorCount: 0 },
        { keyIndex: 2, isActive: true, isExhausted: false, errorCount: 0 },
        { keyIndex: 3, isActive: true, isExhausted: false, errorCount: 0 },
      ]);
    }
  }
}

export const storage = new DatabaseStorage();
