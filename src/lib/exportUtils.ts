import TurndownService from 'turndown';
import jsPDF from 'jspdf';

interface ExportDocument {
  title: string;
  content: string;
  summary?: string;
  type: string;
  tags?: string[];
  createdAt?: string;
}

// Convert HTML to Markdown
export function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });
  return turndownService.turndown(html);
}

// Export as Markdown file
export function exportAsMarkdown(doc: ExportDocument): void {
  const markdown = `# ${doc.title}

${doc.summary ? `> ${doc.summary}\n\n` : ''}${doc.tags?.length ? `**Tags:** ${doc.tags.join(', ')}\n\n---\n\n` : ''}${htmlToMarkdown(doc.content)}
`;

  downloadFile(markdown, `${sanitizeFilename(doc.title)}.md`, 'text/markdown');
}

// Export as PDF
export async function exportAsPDF(doc: ExportDocument): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // Add title
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(doc.title, maxWidth);
  pdf.text(titleLines, margin, yPosition);
  yPosition += titleLines.length * 10 + 5;

  // Add summary if exists
  if (doc.summary) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100);
    const summaryLines = pdf.splitTextToSize(doc.summary, maxWidth);
    pdf.text(summaryLines, margin, yPosition);
    yPosition += summaryLines.length * 6 + 5;
    pdf.setTextColor(0);
  }

  // Add tags if exists
  if (doc.tags?.length) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Tags: ${doc.tags.join(', ')}`, margin, yPosition);
    yPosition += 8;
  }

  // Add separator line
  pdf.setDrawColor(200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Add content (convert HTML to plain text for PDF)
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const plainText = htmlToPlainText(doc.content);
  const contentLines = pdf.splitTextToSize(plainText, maxWidth);
  
  for (const line of contentLines) {
    if (yPosition > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.text(line, margin, yPosition);
    yPosition += 6;
  }

  pdf.save(`${sanitizeFilename(doc.title)}.pdf`);
}

// Export as Word (DOCX) - using HTML download with .doc extension
export function exportAsWord(doc: ExportDocument): void {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${doc.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #1a1a2e; margin-bottom: 10px; }
    .summary { color: #666; font-style: italic; margin-bottom: 15px; }
    .tags { color: #888; font-size: 12px; margin-bottom: 20px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
    .content { line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${doc.title}</h1>
  ${doc.summary ? `<p class="summary">${doc.summary}</p>` : ''}
  ${doc.tags?.length ? `<p class="tags">Tags: ${doc.tags.join(', ')}</p>` : ''}
  <hr>
  <div class="content">${doc.content}</div>
</body>
</html>
`;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(doc.title)}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper: Convert HTML to plain text
function htmlToPlainText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

// Helper: Download file
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper: Sanitize filename
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
}
