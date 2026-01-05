import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Send,
  Loader2,
  Sparkles,
  User,
  Bot,
  FileText,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const documentTypes = [
  { value: "sop", label: "Standard Operating Procedure" },
  { value: "how_to", label: "How-To Guide" },
  { value: "product_doc", label: "Product Documentation" },
  { value: "reflection", label: "Founder Reflection" },
  { value: "general", label: "General Knowledge" },
];

export default function TextInterview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [topic, setTopic] = useState("");
  const [targetType, setTargetType] = useState("general");
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startInterview = async () => {
    if (!topic.trim()) {
      toast({
        variant: "destructive",
        title: "Topic required",
        description: "Please enter what you'd like to document",
      });
      return;
    }

    setLoading(true);

    try {
      // Create interview session
      const { data: session, error: sessionError } = await supabase
        .from("interview_sessions")
        .insert([{
          user_id: user!.id,
          topic,
          target_type: targetType as "sop" | "how_to" | "product_doc" | "reflection" | "general",
          messages: [] as unknown as any,
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);

      // Get first AI question
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            topic,
            targetType,
            messages: [],
            action: "start",
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to start interview");
      }

      const data = await response.json();
      const aiMessage: Message = { role: "assistant", content: data.message };
      setMessages([aiMessage]);
      setStarted(true);

      // Update session with first message
      await supabase
        .from("interview_sessions")
        .update({ messages: [aiMessage] as unknown as any })
        .eq("id", session.id);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error starting interview",
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            topic,
            targetType,
            messages: newMessages,
            action: "continue",
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to get response");
      }

      const data = await response.json();
      const aiMessage: Message = { role: "assistant", content: data.message };
      const updatedMessages = [...newMessages, aiMessage];
      setMessages(updatedMessages);

      // Update session
      if (sessionId) {
        await supabase
          .from("interview_sessions")
          .update({ messages: updatedMessages as unknown as any })
          .eq("id", sessionId);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDocument = async () => {
    if (messages.length < 4) {
      toast({
        variant: "destructive",
        title: "More content needed",
        description: "Please continue the interview to capture more knowledge",
      });
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-document`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            topic,
            targetType,
            messages,
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate document");
      }

      const data = await response.json();

      // Save document
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert([{
          user_id: user!.id,
          title: data.title,
          content: data.content,
          summary: data.summary,
          type: targetType as "sop" | "how_to" | "product_doc" | "reflection" | "general",
          status: "draft" as const,
          tags: data.tags || [],
          source_type: "text",
        }])
        .select()
        .single();

      if (docError) throw docError;

      // Update session with document reference
      if (sessionId) {
        await supabase
          .from("interview_sessions")
          .update({ document_id: doc.id, status: "completed" })
          .eq("id", sessionId);
      }

      toast({
        title: "Document created!",
        description: "Your knowledge has been captured and structured",
      });

      navigate(`/document/${doc.id}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error generating document",
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Text Interview</span>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Start Your Interview</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              I'll guide you through a conversation to capture your expertise and turn it
              into structured documentation.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">What would you like to document?</Label>
              <Input
                id="topic"
                placeholder="e.g., How I onboard new customers, My product development process..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Document type</Label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={startInterview}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Start Interview
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold">{topic}</h1>
              <p className="text-sm text-muted-foreground">
                {documentTypes.find((t) => t.value === targetType)?.label}
              </p>
            </div>
          </div>

          <Button
            variant="hero"
            size="sm"
            onClick={generateDocument}
            disabled={generating || messages.length < 4}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate Document
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-4 animate-in ${
                message.role === "user" ? "justify-end" : ""
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-accent" />
              </div>
              <div className="bg-card border border-border rounded-2xl px-5 py-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Textarea
            placeholder="Share your thoughts..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] max-h-[200px] resize-none"
            rows={1}
          />
          <Button
            variant="hero"
            size="icon-lg"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
