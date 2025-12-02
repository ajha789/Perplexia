import { Switch, Route, useParams } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/lib/theme";
import { ChatSidebar } from "@/components/chat-sidebar";
import ChatPage from "@/pages/chat";
import NotFound from "@/pages/not-found";

function ChatRouteWrapper() {
  const params = useParams<{ id?: string }>();
  return (
    <>
      <ChatSidebar currentChatId={params.id} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatPage />
      </main>
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={ChatRouteWrapper} />
      <Route path="/chat/:id" component={ChatRouteWrapper} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "280px",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full bg-background">
              <Router />
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
