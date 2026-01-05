import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  ArrowRight, 
  Mic, 
  FileText, 
  Upload, 
  Sparkles,
  CheckCircle,
  Zap,
  Shield,
  Globe
} from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">FounderMind</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/auth">
              <Button variant="hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Knowledge Capture
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Your expertise,
            <br />
            <span className="text-accent">documented forever.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Transform the knowledge in your head into structured SOPs, guides, and documentation 
            through natural AI-guided interviews. No writing required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button variant="hero" size="xl">
                Start Capturing Knowledge
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="xl">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gradient-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Three ways to capture your knowledge
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Choose how you want to document your expertise. Our AI adapts to your style.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileText className="w-8 h-8" />}
              title="Text Interview"
              description="Have a guided conversation with AI that asks the right questions to extract your knowledge and organize it into documentation."
            />
            <FeatureCard
              icon={<Mic className="w-8 h-8" />}
              title="Voice Recording"
              description="Just talk. Record your expertise naturally, and we'll transcribe and transform your words into structured content."
            />
            <FeatureCard
              icon={<Upload className="w-8 h-8" />}
              title="File Import"
              description="Upload existing recordings, videos, or documents. We'll extract the key insights and reformat them for you."
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Stop losing your hard-won knowledge
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                As a founder, your brain holds invaluable processes, decisions, and insights. 
                FounderMind helps you capture it all before it's lost.
              </p>

              <div className="space-y-4">
                <Benefit text="Create SOPs that your team can follow" />
                <Benefit text="Document your product decisions and rationale" />
                <Benefit text="Build a searchable knowledge base" />
                <Benefit text="Share expertise with public links" />
                <Benefit text="Reflect on your founder journey" />
              </div>
            </div>

            <div className="bg-gradient-hero rounded-3xl p-8 md:p-12">
              <div className="grid grid-cols-2 gap-6">
                <StatCard icon={<Zap />} value="10x" label="Faster than writing" />
                <StatCard icon={<FileText />} value="5+" label="Document types" />
                <StatCard icon={<Shield />} value="100%" label="Private by default" />
                <StatCard icon={<Globe />} value="1-Click" label="Share publicly" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-card border border-border rounded-3xl p-12 md:p-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to capture your knowledge?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join founders who are building their personal knowledge base. 
              Start with a free account today.
            </p>
            <Link to="/auth">
              <Button variant="hero" size="xl">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">FounderMind</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 FounderMind. Built for founders, by founders.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
        <CheckCircle className="w-4 h-4 text-success" />
      </div>
      <span>{text}</span>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-slate-medium/50 rounded-xl p-6 text-center">
      <div className="w-10 h-10 mx-auto mb-3 text-accent">{icon}</div>
      <p className="text-2xl font-bold text-primary-foreground mb-1">{value}</p>
      <p className="text-sm text-primary-foreground/70">{label}</p>
    </div>
  );
}
