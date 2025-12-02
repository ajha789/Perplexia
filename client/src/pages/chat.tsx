import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import JSZip from "jszip";
import { Settings } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "@/components/model-selector";
import { MessageList } from "@/components/message-list";
import { MessageInput } from "@/components/message-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Chat, Message } from "@shared/schema";

export default function ChatPage() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState("sonar");
  const [currentChatId, setCurrentChatId] = useState<string | null>(params.id || null);

  const { data: chat, isLoading: chatLoading } = useQuery<Chat>({
    queryKey: ["/api/chats", currentChatId],
    enabled: !!currentChatId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/chats", currentChatId, "messages"],
    enabled: !!currentChatId,
  });

  useEffect(() => {
    if (params.id && params.id !== currentChatId) {
      setCurrentChatId(params.id);
    }
  }, [params.id, currentChatId]);

  useEffect(() => {
    if (chat?.model) {
      setSelectedModel(chat.model);
    }
  }, [chat]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      let chatId = currentChatId;
      
      if (!chatId) {
        const newChatRes = await apiRequest("POST", "/api/chats", { 
          title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
          model: selectedModel 
        });
        const newChat = await newChatRes.json();
        chatId = newChat.id;
        setCurrentChatId(chatId);
        setLocation(`/chat/${chatId}`, { replace: true });
      }

      const res = await apiRequest("POST", "/api/messages", {
        chatId,
        content,
        model: selectedModel,
      });
      const result = await res.json();
      return { result, chatId };
    },
    onSuccess: ({ chatId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateModelMutation = useMutation({
    mutationFn: async (model: string) => {
      if (!currentChatId) return;
      await apiRequest("PATCH", `/api/chats/${currentChatId}`, { model });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", currentChatId] });
    },
  });

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    if (currentChatId) {
      updateModelMutation.mutate(model);
    }
  };

  const handleDownloadProject = async () => {
    const zip = new JSZip();
    
    const codeBlockRegex = /```(\w+)?(?:\s+([^\n]+))?\n([\s\S]*?)```/g;
    
    messages.forEach((message) => {
      if (message.role === "assistant") {
        let match;
        while ((match = codeBlockRegex.exec(message.content)) !== null) {
          const language = match[1] || "txt";
          const filename = match[2] || `file_${Date.now()}.${getExtension(language)}`;
          const content = match[3].trim();
          
          zip.file(filename, content);
        }
      }
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `django_project_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Project Downloaded",
      description: "Your Django project has been downloaded as a ZIP file.",
    });
  };

  const getExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      python: "py",
      py: "py",
      javascript: "js",
      js: "js",
      typescript: "ts",
      ts: "ts",
      html: "html",
      css: "css",
      sql: "sql",
      json: "json",
      yaml: "yml",
      django: "py",
      jinja2: "html",
    };
    return extensions[language.toLowerCase()] || "txt";
  };

  const isLoading = chatLoading || messagesLoading;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-2 h-14 px-4 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          {chat && (
            <h1 className="text-sm font-medium truncate max-w-[200px]">
              {chat.title}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
          />
          <Button variant="ghost" size="icon" data-testid="button-settings">
            <Settings className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <MessageList
        messages={messages}
        isLoading={sendMessageMutation.isPending}
        onDownloadProject={handleDownloadProject}
      />

      <MessageInput
        onSend={(content) => sendMessageMutation.mutate(content)}
        isLoading={sendMessageMutation.isPending}
        disabled={isLoading}
      />
    </div>
  );
}
