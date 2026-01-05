import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, ArrowLeft, Loader2, Calendar, Tag, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Document {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  type: string;
  tags: string[];
  created_at: string;
}

const typeLabels: Record<string, string> = {
  sop: "Standard Operating Procedure",
  how_to: "How-To Guide",
  product_doc: "Product Documentation",
  reflection: "Founder Reflection",
  general: "General Knowledge",
};

export default function PublicDocument() {
  const { slug } = useParams<{ slug: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [slug]);

  const fetchDocument = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, content, summary, type, tags, created_at")
        .eq("public_slug", slug)
        .eq("is_public", true)
        .single();

      if (error || !data) {
        setError(true);
      } else {
        setDocument(data);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Document Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This document doesn't exist or is no longer public.
        </p>
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to FounderMind
          </Button>
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(document.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">FounderMind</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Document header */}
        <div className="mb-10">
          <p className="text-accent font-medium mb-3">
            {typeLabels[document.type] || "Knowledge Document"}
          </p>
          <h1 className="text-4xl font-bold mb-4">{document.title}</h1>
          
          {document.summary && (
            <p className="text-xl text-muted-foreground mb-6">{document.summary}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formattedDate}
            </span>
            {document.tags.length > 0 && (
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {document.tags.join(", ")}
              </span>
            )}
          </div>
        </div>

        {/* Document content */}
        <article className="prose prose-lg max-w-none">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
            {document.content ? (
              <div className="whitespace-pre-wrap">{document.content}</div>
            ) : (
              <p className="text-muted-foreground italic">No content available.</p>
            )}
          </div>
        </article>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Created with FounderMind — Knowledge capture for founders
          </p>
          <Link to="/">
            <Button variant="outline">
              Learn more about FounderMind
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
