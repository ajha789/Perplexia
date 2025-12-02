import { ChevronDown, Sparkles, Zap, Brain, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const MODELS = [
  { 
    id: "sonar-pro", 
    name: "Sonar Pro", 
    description: "Most capable for complex tasks",
    icon: Sparkles,
  },
  { 
    id: "sonar", 
    name: "Sonar", 
    description: "Fast and efficient",
    icon: Zap,
  },
  { 
    id: "sonar-reasoning", 
    name: "Sonar Reasoning", 
    description: "Enhanced reasoning",
    icon: Brain,
  },
  { 
    id: "sonar-deep-research", 
    name: "Deep Research", 
    description: "In-depth analysis",
    icon: Search,
  },
] as const;

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];
  const Icon = currentModel.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 min-w-[180px] justify-between"
          data-testid="button-model-selector"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{currentModel.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        {MODELS.map((model) => {
          const ModelIcon = model.icon;
          const isSelected = model.id === selectedModel;
          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onModelChange(model.id)}
              className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                isSelected ? "bg-accent" : ""
              }`}
              data-testid={`menu-item-model-${model.id}`}
            >
              <div className="flex items-center gap-2 w-full">
                <ModelIcon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                <span className="font-medium text-sm">{model.name}</span>
                {isSelected && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-xs text-muted-foreground pl-6">
                {model.description}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
