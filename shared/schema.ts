import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Perplexity Models available
export const PERPLEXITY_MODELS = [
  { id: "sonar-pro", name: "Sonar Pro", description: "Most capable model for complex tasks" },
  { id: "sonar", name: "Sonar", description: "Fast and efficient for general queries" },
  { id: "sonar-reasoning", name: "Sonar Reasoning", description: "Enhanced reasoning capabilities" },
  { id: "sonar-deep-research", name: "Deep Research", description: "In-depth research and analysis" },
] as const;

export type PerplexityModel = typeof PERPLEXITY_MODELS[number]["id"];

// Chats table - stores conversation sessions
export const chats = pgTable("chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull().default("New Chat"),
  model: text("model").notNull().default("sonar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Messages table - stores individual messages in a chat
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  citations: jsonb("citations").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// API Keys table - tracks usage and rotation status
export const apiKeys = pgTable("api_keys", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  keyIndex: integer("key_index").notNull().unique(), // 1, 2, or 3
  isActive: boolean("is_active").notNull().default(true),
  isExhausted: boolean("is_exhausted").notNull().default(false),
  lastUsed: timestamp("last_used"),
  errorCount: integer("error_count").notNull().default(0),
});

// Relations
export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));

// Insert schemas
export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Schema for creating a message from API (role is set server-side)
export const createMessageSchema = z.object({
  chatId: z.string(),
  content: z.string().min(1),
  citations: z.array(z.string()).optional(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
});

// Types
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

// Extended types for frontend
export type ChatWithMessages = Chat & { messages: Message[] };

// Message request type
export const sendMessageSchema = z.object({
  chatId: z.string(),
  content: z.string().min(1),
  model: z.string().optional(),
});

export type SendMessageRequest = z.infer<typeof sendMessageSchema>;
