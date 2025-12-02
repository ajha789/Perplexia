import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, MessageSquare, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApiStatus } from "./api-status";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Chat } from "@shared/schema";

interface ChatSidebarProps {
  currentChatId?: string;
}

export function ChatSidebar({ currentChatId }: ChatSidebarProps) {
  const [, setLocation] = useLocation();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data: chats, isLoading } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
  });

  const createChatMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/chats", {});
      return res.json();
    },
    onSuccess: async (newChat: Chat) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setLocation(`/chat/${newChat.id}`);
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      await apiRequest("DELETE", `/api/chats/${chatId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      if (currentChatId) {
        setLocation("/");
      }
    },
  });

  const handleNewChat = () => {
    createChatMutation.mutate();
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    e.preventDefault();
    deleteChatMutation.mutate(chatId);
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <span className="text-primary-foreground font-bold text-sm">P</span>
          </div>
          <span className="text-lg font-semibold">Perplexia</span>
        </div>
        <Button
          onClick={handleNewChat}
          className="w-full gap-2"
          disabled={createChatMutation.isPending}
          data-testid="button-new-chat"
        >
          {createChatMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <SidebarMenu>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : chats && chats.length > 0 ? (
                  chats.map((chat) => (
                    <SidebarMenuItem
                      key={chat.id}
                      onMouseEnter={() => setHoveredId(chat.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={chat.id === currentChatId}
                        className="group relative"
                      >
                        <a
                          href={`/chat/${chat.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setLocation(`/chat/${chat.id}`);
                          }}
                          data-testid={`link-chat-${chat.id}`}
                        >
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm">{chat.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                          {hoveredId === chat.id && (
                            <button
                              onClick={(e) => handleDeleteChat(e, chat.id)}
                              className="absolute right-2 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              data-testid={`button-delete-chat-${chat.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No chats yet. Start a new conversation!
                  </div>
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ApiStatus />
      </SidebarFooter>
    </Sidebar>
  );
}
