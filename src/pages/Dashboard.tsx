import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Lightbulb, 
  Plus, 
  Search, 
  FileText, 
  Mic, 
  Upload, 
  LogOut,
  Clock,
  Tag,
  Globe,
  Lock,
  Filter,
  MoreVertical,
  Trash2,
  ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  type: string;
  status: string;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

const typeLabels: Record<string, string> = {
  sop: "SOP",
  how_to: "How-To",
  product_doc: "Product Doc",
  reflection: "Reflection",
  general: "General",
};

const typeColors: Record<string, string> = {
  sop: "bg-blue-100 text-blue-700",
  how_to: "bg-green-100 text-green-700",
  product_doc: "bg-purple-100 text-purple-700",
  reflection: "bg-amber-100 text-amber-700",
  general: "bg-gray-100 text-gray-700",
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchDocuments();
  }, [user, navigate]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, summary, content, type, status, tags, is_public, created_at, updated_at")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error loading documents",
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      setDocuments(documents.filter((d) => d.id !== id));
      toast({ title: "Document deleted" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error deleting document",
      });
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      doc.title.toLowerCase().includes(query) ||
      doc.summary?.toLowerCase().includes(query) ||
      doc.content?.toLowerCase().includes(query) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(query));
    const matchesType = !typeFilter || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">FounderMind</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Your Knowledge Base</h1>
          <p className="text-muted-foreground">
            Capture, organize, and share your founder expertise
          </p>
        </div>

        {/* Action cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <ActionCard
            icon={<FileText className="w-6 h-6" />}
            title="Text Interview"
            description="Guided conversation to capture your knowledge"
            onClick={() => navigate("/interview/text")}
            primary
          />
          <ActionCard
            icon={<Mic className="w-6 h-6" />}
            title="Voice Interview"
            description="Record and transcribe your expertise"
            onClick={() => navigate("/interview/voice")}
          />
          <ActionCard
            icon={<Upload className="w-6 h-6" />}
            title="Upload Files"
            description="Import audio, video, or documents"
            onClick={() => navigate("/upload")}
          />
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                {typeFilter ? typeLabels[typeFilter] : "All types"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter(null)}>
                All types
              </DropdownMenuItem>
              {Object.entries(typeLabels).map(([key, label]) => (
                <DropdownMenuItem key={key} onClick={() => setTypeFilter(key)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Documents list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <EmptyState hasDocuments={documents.length > 0} />
        ) : (
          <div className="grid gap-4">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={() => navigate(`/document/${doc.id}`)}
                onDelete={() => deleteDocument(doc.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
  primary = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-2xl text-left transition-all duration-200 group ${
        primary
          ? "bg-primary text-primary-foreground hover:shadow-lg hover:scale-[1.02]"
          : "bg-card border border-border hover:border-accent/50 hover:shadow-md"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
          primary
            ? "bg-accent text-accent-foreground"
            : "bg-secondary text-secondary-foreground group-hover:bg-accent/10 group-hover:text-accent"
        }`}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className={primary ? "text-primary-foreground/70" : "text-muted-foreground"}>
        {description}
      </p>
    </button>
  );
}

function DocumentCard({
  document,
  onView,
  onDelete,
}: {
  document: Document;
  onView: () => void;
  onDelete: () => void;
}) {
  const formattedDate = new Date(document.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                typeColors[document.type] || typeColors.general
              }`}
            >
              {typeLabels[document.type] || "General"}
            </span>
            {document.is_public ? (
              <Globe className="w-4 h-4 text-success" />
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          <h3
            onClick={onView}
            className="font-semibold text-lg mb-1 cursor-pointer hover:text-accent transition-colors truncate"
          >
            {document.title}
          </h3>

          {document.summary && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {document.summary}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formattedDate}
            </span>
            {document.tags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {document.tags.slice(0, 3).join(", ")}
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function EmptyState({ hasDocuments }: { hasDocuments: boolean }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {hasDocuments ? "No matching documents" : "No documents yet"}
      </h3>
      <p className="text-muted-foreground max-w-sm mx-auto">
        {hasDocuments
          ? "Try adjusting your search or filters"
          : "Start an interview to capture your knowledge and create your first document"}
      </p>
    </div>
  );
}
