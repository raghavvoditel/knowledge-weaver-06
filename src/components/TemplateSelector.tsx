import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { documentTemplates, type DocumentTemplate } from "@/lib/documentTemplates";
import { useToast } from "@/hooks/use-toast";
import { FileText, FileCheck, BookOpen, Lightbulb, File, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const typeIcons: Record<string, React.ReactNode> = {
  sop: <FileCheck className="w-5 h-5" />,
  how_to: <BookOpen className="w-5 h-5" />,
  product_doc: <FileText className="w-5 h-5" />,
  reflection: <Lightbulb className="w-5 h-5" />,
  general: <File className="w-5 h-5" />,
};

interface TemplateSelectorProps {
  trigger: React.ReactNode;
}

export function TemplateSelector({ trigger }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSelectTemplate = async (template: DocumentTemplate) => {
    if (!user) return;
    
    setCreating(template.id);
    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: template.name,
          content: template.content,
          type: template.type,
          tags: template.tags,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Document created",
        description: `Started with "${template.name}" template`,
      });

      setOpen(false);
      navigate(`/document/${data.id}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error creating document",
        description: "Please try again",
      });
    } finally {
      setCreating(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Start with a pre-structured template or a blank document
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 mt-4">
          {documentTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              disabled={creating !== null}
              className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-accent/50 hover:bg-secondary/50 transition-all text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                {creating === template.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  typeIcons[template.type]
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium mb-1">{template.name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
                {template.tags.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
