import { useEffect, useState, useRef } from "react";
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
  Mic,
  MicOff,
  Loader2,
  FileText,
  Play,
  Square,
  Volume2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const documentTypes = [
  { value: "sop", label: "Standard Operating Procedure" },
  { value: "how_to", label: "How-To Guide" },
  { value: "product_doc", label: "Product Documentation" },
  { value: "reflection", label: "Founder Reflection" },
  { value: "general", label: "General Knowledge" },
];

export default function VoiceInterview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [topic, setTopic] = useState("");
  const [targetType, setTargetType] = useState("general");
  const [started, setStarted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        await transcribeAudio(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setStarted(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Microphone access denied",
        description: "Please allow microphone access to record",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setTranscribing(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(blob);
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
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Transcription failed",
        description: err instanceof Error ? err.message : "Please try again",
      });
    } finally {
      setTranscribing(false);
    }
  };

  const generateDocument = async () => {
    if (!transcript.trim()) {
      toast({
        variant: "destructive",
        title: "No transcript",
        description: "Please record some audio first",
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
            transcript,
            sourceType: "voice",
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
          source_type: "voice",
        }])
        .select()
        .single();

      if (docError) throw docError;

      toast({
        title: "Document created!",
        description: "Your voice recording has been transformed",
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
              <span className="text-xl font-bold">Voice Interview</span>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
              <Mic className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Record Your Knowledge</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Speak naturally about your topic. I'll transcribe and transform your words
              into structured documentation.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">What are you documenting?</Label>
              <Input
                id="topic"
                placeholder="e.g., My customer success strategy..."
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
              onClick={startRecording}
            >
              <Mic className="w-5 h-5" />
              Start Recording
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold">{topic || "Voice Recording"}</h1>
              <p className="text-sm text-muted-foreground">
                {documentTypes.find((t) => t.value === targetType)?.label}
              </p>
            </div>
          </div>

          <Button
            variant="hero"
            size="sm"
            onClick={generateDocument}
            disabled={generating || !transcript}
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

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Recording controls */}
        <div className="flex flex-col items-center mb-10">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              recording
                ? "bg-destructive text-destructive-foreground recording-pulse"
                : "bg-accent text-accent-foreground hover:scale-105"
            }`}
          >
            {recording ? (
              <Square className="w-12 h-12" />
            ) : (
              <Mic className="w-12 h-12" />
            )}
          </button>
          <p className="mt-4 text-lg font-medium">
            {recording ? "Recording... Click to stop" : "Click to start recording"}
          </p>
        </div>

        {/* Audio playback */}
        {audioUrl && !recording && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <Volume2 className="w-6 h-6 text-muted-foreground" />
              <audio src={audioUrl} controls className="flex-1" />
            </div>
          </div>
        )}

        {/* Transcription status */}
        {transcribing && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-accent" />
            <p className="font-medium">Transcribing your audio...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        )}

        {/* Transcript */}
        {transcript && !transcribing && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Transcript
            </h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{transcript}</p>
          </div>
        )}
      </main>
    </div>
  );
}
