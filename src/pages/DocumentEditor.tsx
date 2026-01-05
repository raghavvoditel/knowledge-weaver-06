import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Lightbulb,
  ArrowLeft,
  Save,
  Loader2,
  Globe,
  Lock,
  Trash2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  type: string;
  status: string;
  tags: string[];
  is_public: boolean;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
}

const documentTypes = [
  { value: "sop", label: "SOP" },
  { value: "how_to", label: "How-To" },
  { value: "product_doc", label: "Product Doc" },
  { value: "reflection", label: "Reflection" },
  { value: "general", label: "General" },
];

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In Review" },
  { value: "published", label: "Published" },
];

export default function DocumentEditor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [type, setType] = useState("general");
  const [status, setStatus] = useState("draft");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchDocument();
  }, [user, id, navigate]);

  const fetchDocument = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setDocument(data);
      setTitle(data.title);
      setContent(data.content || "");
      setSummary(data.summary || "");
      setType(data.type as string);
      setStatus(data.status as string);
      setTags(data.tags?.join(", ") || "");
      setIsPublic(data.is_public);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error loading document",
        description: "Document not found or access denied",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async () => {
    setSaving(true);

    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Generate public slug if making public
      let publicSlug = document?.public_slug;
      if (isPublic && !publicSlug) {
        publicSlug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
      }

      const { error } = await supabase
        .from("documents")
        .update({
          title,
          content,
          summary,
          type,
          status,
          tags: tagsArray,
          is_public: isPublic,
          public_slug: isPublic ? publicSlug : null,
        })
        .eq("id", id);

      if (error) throw error;

      setDocument((prev) =>
        prev ? { ...prev, is_public: isPublic, public_slug: publicSlug } : null
      );

      toast({
        title: "Document saved",
        description: "Your changes have been saved",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error saving",
        description: "Please try again",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteDocument = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Document deleted" });
      navigate("/dashboard");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error deleting",
        description: "Please try again",
      });
    }
  };

  const copyPublicLink = () => {
    if (document?.public_slug) {
      const url = `${window.location.origin}/public/${document.public_slug}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Edit Document</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={deleteDocument}>
              <Trash2 className="w-5 h-5 text-destructive" />
            </Button>
            <Button variant="hero" onClick={saveDocument} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main content */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title..."
                className="text-xl font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief description of this document..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your documentation here..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h3 className="font-semibold">Document Settings</h3>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="onboarding, sales, product..."
                />
              </div>
            </div>

            {/* Sharing */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h3 className="font-semibold">Sharing</h3>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Globe className="w-5 h-5 text-success" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {isPublic ? "Public" : "Private"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isPublic ? "Anyone with link can view" : "Only you can access"}
                    </p>
                  </div>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>

              {isPublic && document?.public_slug && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={copyPublicLink}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy public link
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
