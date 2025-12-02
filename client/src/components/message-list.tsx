import { useRef, useEffect } from "react";
import { Bot, User, ExternalLink, Download } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CodeBlock } from "./code-block";
import type { Message } from "@shared/schema";
import perplexiaLogo from "@assets/generated_images/perplexia_ai_brain_logo.png";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onDownloadProject?: () => void;
}

function parseMessageContent(content: string) {
  const parts: Array<{ type: "text" | "code"; content: string; language?: string; filename?: string }> = [];
  
  const codeBlockRegex = /```(\w+)?(?:\s+([^\n]+))?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }

    parts.push({
      type: "code",
      language: match[1] || "text",
      filename: match[2],
      content: match[3].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      content: content.slice(lastIndex),
    });
  }

  return parts;
}

function MessageContent({ content }: { content: string }) {
  const parts = parseMessageContent(content);

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.type === "code") {
          return (
            <CodeBlock
              key={index}
              code={part.content}
              language={part.language}
              filename={part.filename}
            />
          );
        }
        return (
          <div 
            key={index} 
            className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap"
          >
            {part.content}
          </div>
        );
      })}
    </div>
  );
}

function Citations({ citations }: { citations: string[] }) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-xs font-medium text-muted-foreground mb-2">Sources</p>
      <div className="flex flex-wrap gap-2">
        {citations.slice(0, 5).map((citation, index) => (
          <a
            key={index}
            href={citation}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-primary/10 px-2 py-1 rounded-md"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="max-w-[150px] truncate">
              {new URL(citation).hostname}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function MessageList({ messages, isLoading, onDownloadProject }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const hasProjectFiles = messages.some(
    (m) => m.role === "assistant" && m.content.includes("```python")
  );

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 overflow-hidden">
              <img 
                src={perplexiaLogo} 
                alt="Perplexia AI" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h2 className="text-xl font-semibold mb-2">Welcome to Perplexia</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              I'm your AI-powered Django development assistant. Ask me to generate 
              complete Django projects with PostgreSQL, models, views, templates, and more.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                "Create a blog app with user authentication",
                "Build an e-commerce product catalog",
                "Set up a REST API with Django REST Framework",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  className="text-sm px-4 py-2 rounded-full border border-border hover-elevate text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`button-suggestion-${suggestion.slice(0, 10)}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
            data-testid={`message-${message.role}-${message.id}`}
          >
            {message.role === "assistant" && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={`${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3 max-w-[75%]"
                  : "flex-1"
              }`}
            >
              <MessageContent content={message.content} />
              {message.role === "assistant" && message.citations && (
                <Citations citations={message.citations as string[]} />
              )}
            </div>
            {message.role === "user" && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-muted">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 items-start">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-sm text-muted-foreground">Perplexia is thinking...</span>
            </div>
          </div>
        )}

        {hasProjectFiles && !isLoading && onDownloadProject && (
          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={onDownloadProject}
              className="gap-2"
              data-testid="button-download-project"
            >
              <Download className="h-4 w-4" />
              Download Project as ZIP
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
