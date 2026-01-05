import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
  Upload as UploadIcon,
  FileText,
  FileAudio,
  FileVideo,
  Loader2,
  X,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const documentTypes = [
  { value: "sop", label: "Standard Operating Procedure" },
  { value: "how_to", label: "How-To Guide" },
  { value: "product_doc", label: "Product Documentation" },
  { value: "reflection", label: "Founder Reflection" },
  { value: "general", label: "General Knowledge" },
];

const acceptedTypes = {
  audio: ["audio/mpeg", "audio/wav", "audio/webm", "audio/mp4", "audio/m4a"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  text: ["text/plain", "text/markdown", "application/pdf"],
};

export default function FileUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [targetType, setTargetType] = useState("general");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    const isAccepted = [
      ...acceptedTypes.audio,
      ...acceptedTypes.video,
      ...acceptedTypes.text,
    ].includes(selectedFile.type);

    if (!isAccepted) {
      toast({
        variant: "destructive",
        title: "Unsupported file type",
        description: "Please upload audio, video, or text files",
      });
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 50MB",
      });
      return;
    }

    setFile(selectedFile);
    setTranscript("");
  };

  const getFileIcon = () => {
    if (!file) return <UploadIcon className="w-8 h-8" />;
    if (acceptedTypes.audio.includes(file.type)) return <FileAudio className="w-8 h-8" />;
    if (acceptedTypes.video.includes(file.type)) return <FileVideo className="w-8 h-8" />;
    return <FileText className="w-8 h-8" />;
  };

  const processFile = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // For audio/video, transcribe first
      if (
        acceptedTypes.audio.includes(file.type) ||
        acceptedTypes.video.includes(file.type)
      ) {
        setTranscribing(true);

        // Convert to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
        });
        reader.readAsDataURL(file);
        const base64Audio = await base64Promise;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ audio: base64Audio }),
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Transcription failed");
        }

        const data = await response.json();
        setTranscript(data.text);
        setTranscribing(false);
      } else {
        // For text files, read content
        const text = await file.text();
        setTranscript(text);
      }

      toast({
        title: "File processed",
        description: "Ready to generate document",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Processing failed",
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setUploading(false);
      setTranscribing(false);
    }
  };

  const generateDocument = async () => {
    if (!transcript.trim()) {
      toast({
        variant: "destructive",
        title: "No content",
        description: "Please process a file first",
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
            topic: file?.name.replace(/\.[^/.]+$/, "") || "Uploaded Content",
            targetType,
            transcript,
            sourceType: "file",
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
          source_type: "file",
        }])
        .select()
        .single();

      if (docError) throw docError;

      toast({
        title: "Document created!",
        description: "Your file has been transformed",
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
            <span className="text-xl font-bold">Upload Files</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <UploadIcon className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Import Your Content</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Upload audio, video, or text files. I'll extract the knowledge and create
            structured documentation.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
          {/* File drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${
              dragActive
                ? "border-accent bg-accent/5"
                : file
                ? "border-success bg-success/5"
                : "border-border hover:border-accent/50"
            }`}
          >
            <input
              type="file"
              accept={[
                ...acceptedTypes.audio,
                ...acceptedTypes.video,
                ...acceptedTypes.text,
              ].join(",")}
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div
              className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                file ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"
              }`}
            >
              {file ? <CheckCircle className="w-8 h-8" /> : getFileIcon()}
            </div>

            {file ? (
              <div>
                <p className="font-medium mb-1">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setTranscript("");
                  }}
                  className="mt-2 text-sm text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <p className="font-medium mb-1">Drop your file here</p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (audio, video, text up to 50MB)
                </p>
              </div>
            )}
          </div>

          {/* Document type */}
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

          {/* Process button */}
          {file && !transcript && (
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={processFile}
              disabled={uploading}
            >
              {transcribing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Transcribing...
                </>
              ) : uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5" />
                  Process File
                </>
              )}
            </Button>
          )}

          {/* Generate button */}
          {transcript && (
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={generateDocument}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate Document
                </>
              )}
            </Button>
          )}
        </div>

        {/* Transcript preview */}
        {transcript && (
          <div className="mt-6 bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Extracted Content
            </h3>
            <p className="text-muted-foreground whitespace-pre-wrap line-clamp-10">
              {transcript}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
