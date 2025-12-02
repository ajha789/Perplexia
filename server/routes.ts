import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendToPerplexity, getApiKeyStatus } from "./perplexity";
import { insertChatSchema, sendMessageSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize API keys on startup
  await storage.initializeApiKeys();

  // Get all chats
  app.get("/api/chats", async (req, res) => {
    try {
      const chats = await storage.getChats();
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  // Get single chat
  app.get("/api/chats/:id", async (req, res) => {
    try {
      const chat = await storage.getChat(req.params.id);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ error: "Failed to fetch chat" });
    }
  });

  // Create new chat
  app.post("/api/chats", async (req, res) => {
    try {
      const validatedData = insertChatSchema.parse(req.body || {});
      const chatData = {
        title: validatedData.title || "New Chat",
        model: validatedData.model || "sonar",
      };
      const chat = await storage.createChat(chatData);
      res.status(201).json(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(400).json({ error: "Failed to create chat" });
    }
  });

  // Update chat
  app.patch("/api/chats/:id", async (req, res) => {
    try {
      const chat = await storage.updateChat(req.params.id, req.body);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      res.json(chat);
    } catch (error) {
      console.error("Error updating chat:", error);
      res.status(400).json({ error: "Failed to update chat" });
    }
  });

  // Delete chat
  app.delete("/api/chats/:id", async (req, res) => {
    try {
      await storage.deleteChat(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ error: "Failed to delete chat" });
    }
  });

  // Get messages for a chat
  app.get("/api/chats/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send message and get AI response
  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = sendMessageSchema.parse(req.body);
      const { chatId, content, model } = validatedData;

      // Verify chat exists
      const chat = await storage.getChat(chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      // Save user message
      const userMessage = await storage.createMessage({
        chatId,
        role: "user",
        content,
      });

      // Get conversation history
      const history = await storage.getMessages(chatId);
      const conversationHistory = history.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Get AI response from Perplexity
      const aiResponse = await sendToPerplexity(
        conversationHistory,
        content,
        model || chat.model
      );

      // Save AI response
      const assistantMessage = await storage.createMessage({
        chatId,
        role: "assistant",
        content: aiResponse.content,
        citations: aiResponse.citations,
      });

      // Update chat title if it's the first message
      if (history.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        await storage.updateChat(chatId, { title });
      }

      res.json({
        userMessage,
        assistantMessage,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to send message" 
      });
    }
  });

  // Get API key status
  app.get("/api/keys/status", async (req, res) => {
    try {
      const status = await getApiKeyStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching API key status:", error);
      res.status(500).json({ error: "Failed to fetch API key status" });
    }
  });

  return httpServer;
}
