import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { History, RotateCcw, Clock, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface Version {
  id: string;
  document_id: string;
  title: string;
  content: string | null;
  summary: string | null;
  version_number: number;
  created_at: string;
  change_description: string | null;
}

interface VersionHistoryProps {
  documentId: string;
  onRestore: (version: Version) => void;
}

export function VersionHistory({ documentId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchVersions();
    }
  }, [open, documentId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error loading versions',
        description: 'Could not load version history',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (version: Version) => {
    onRestore(version);
    setOpen(false);
    toast({
      title: 'Version restored',
      description: `Restored to version ${version.version_number}`,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version History
          </SheetTitle>
          <SheetDescription>
            View and restore previous versions of this document
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No versions saved yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Versions are created each time you save
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-3 pr-4">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium bg-secondary px-2 py-0.5 rounded">
                            v{version.version_number}
                          </span>
                          {index === 0 && (
                            <span className="text-xs text-accent font-medium">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="font-medium truncate">{version.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(version.created_at)}
                        </p>
                        {version.change_description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {version.change_description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(version)}
                        className="shrink-0"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
