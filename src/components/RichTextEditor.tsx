import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Quote,
  Undo,
  Redo,
  Code,
  Keyboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, placeholder = "Start writing...", className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn("border border-border rounded-xl overflow-hidden bg-card", className)}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-secondary/50">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            label="Bold"
            shortcut="Ctrl+B"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            label="Italic"
            shortcut="Ctrl+I"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            label="Code"
            shortcut="Ctrl+E"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            label="Heading 1"
            shortcut="Ctrl+Alt+1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            label="Heading 2"
            shortcut="Ctrl+Alt+2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            label="Heading 3"
            shortcut="Ctrl+Alt+3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            label="Bullet List"
            shortcut="Ctrl+Shift+8"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            label="Ordered List"
            shortcut="Ctrl+Shift+7"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            label="Quote"
            shortcut="Ctrl+Shift+B"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-6 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            label="Undo"
            shortcut="Ctrl+Z"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            label="Redo"
            shortcut="Ctrl+Shift+Z"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>

          <div className="flex-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground px-2">
                <Keyboard className="w-3 h-3" />
                <span className="hidden sm:inline">Shortcuts enabled</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[280px]">
              <div className="text-xs space-y-1">
                <p className="font-semibold mb-2">Keyboard Shortcuts</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span>Bold</span><span className="text-muted-foreground">Ctrl+B</span>
                  <span>Italic</span><span className="text-muted-foreground">Ctrl+I</span>
                  <span>Code</span><span className="text-muted-foreground">Ctrl+E</span>
                  <span>Undo</span><span className="text-muted-foreground">Ctrl+Z</span>
                  <span>Redo</span><span className="text-muted-foreground">Ctrl+Shift+Z</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>
    </TooltipProvider>
  );
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  shortcut,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  shortcut?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "h-8 w-8",
            active && "bg-accent/20 text-accent"
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
        {shortcut && <span className="ml-2 text-muted-foreground">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  );
}
