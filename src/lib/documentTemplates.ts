export interface DocumentTemplate {
  id: string;
  name: string;
  type: "sop" | "how_to" | "product_doc" | "reflection" | "general";
  description: string;
  content: string;
  tags: string[];
}

export const documentTemplates: DocumentTemplate[] = [
  {
    id: "sop-standard",
    name: "Standard Operating Procedure",
    type: "sop",
    description: "A structured template for documenting step-by-step procedures",
    tags: ["process", "procedure", "operations"],
    content: `<h1>Standard Operating Procedure</h1>

<h2>Purpose</h2>
<p>Describe the purpose of this SOP and what it aims to achieve.</p>

<h2>Scope</h2>
<p>Define who this procedure applies to and under what circumstances.</p>

<h2>Prerequisites</h2>
<ul>
<li>List any required tools, access, or knowledge</li>
<li>Note any dependencies or prior steps needed</li>
</ul>

<h2>Procedure</h2>
<h3>Step 1: [Action Title]</h3>
<p>Detailed description of the first step.</p>

<h3>Step 2: [Action Title]</h3>
<p>Detailed description of the second step.</p>

<h3>Step 3: [Action Title]</h3>
<p>Detailed description of the third step.</p>

<h2>Quality Checklist</h2>
<ul>
<li>☐ Checkpoint 1</li>
<li>☐ Checkpoint 2</li>
<li>☐ Checkpoint 3</li>
</ul>

<h2>Troubleshooting</h2>
<p>Common issues and their solutions.</p>

<h2>Revision History</h2>
<p>Track changes and updates to this procedure.</p>`,
  },
  {
    id: "how-to-guide",
    name: "How-To Guide",
    type: "how_to",
    description: "A practical guide for accomplishing a specific task",
    tags: ["guide", "tutorial", "instructions"],
    content: `<h1>How To: [Task Name]</h1>

<p><strong>Time Required:</strong> [X minutes/hours]</p>
<p><strong>Difficulty:</strong> [Beginner/Intermediate/Advanced]</p>

<h2>What You'll Learn</h2>
<p>Brief overview of what this guide covers and the outcome.</p>

<h2>Before You Start</h2>
<ul>
<li>Prerequisite 1</li>
<li>Prerequisite 2</li>
</ul>

<h2>Step-by-Step Instructions</h2>

<h3>1. [First Step]</h3>
<p>Clear instructions for the first step.</p>
<blockquote>💡 <strong>Tip:</strong> Add helpful tips in blockquotes.</blockquote>

<h3>2. [Second Step]</h3>
<p>Clear instructions for the second step.</p>

<h3>3. [Third Step]</h3>
<p>Clear instructions for the third step.</p>

<h2>Common Mistakes to Avoid</h2>
<ul>
<li>Mistake 1 and how to prevent it</li>
<li>Mistake 2 and how to prevent it</li>
</ul>

<h2>Next Steps</h2>
<p>What to do after completing this guide.</p>`,
  },
  {
    id: "product-doc",
    name: "Product Documentation",
    type: "product_doc",
    description: "Comprehensive documentation for a product or feature",
    tags: ["product", "feature", "documentation"],
    content: `<h1>[Product/Feature Name]</h1>

<h2>Overview</h2>
<p>Brief description of what this product/feature does and its value proposition.</p>

<h2>Key Features</h2>
<ul>
<li><strong>Feature 1:</strong> Description</li>
<li><strong>Feature 2:</strong> Description</li>
<li><strong>Feature 3:</strong> Description</li>
</ul>

<h2>Getting Started</h2>
<h3>Installation / Setup</h3>
<p>How to get started with this product.</p>

<h3>Basic Configuration</h3>
<p>Initial configuration steps.</p>

<h2>Usage</h2>
<h3>Basic Usage</h3>
<p>How to use the core functionality.</p>

<h3>Advanced Usage</h3>
<p>Advanced features and configurations.</p>

<h2>API Reference</h2>
<p>If applicable, document API endpoints or interfaces.</p>

<h2>Troubleshooting</h2>
<h3>Common Issues</h3>
<ul>
<li><strong>Issue:</strong> Solution</li>
</ul>

<h2>FAQ</h2>
<p><strong>Q: Common question?</strong></p>
<p>A: Answer to the question.</p>

<h2>Support</h2>
<p>How to get help or report issues.</p>`,
  },
  {
    id: "founder-reflection",
    name: "Founder Reflection",
    type: "reflection",
    description: "Capture insights, lessons learned, and personal journey",
    tags: ["reflection", "lessons", "insights"],
    content: `<h1>Reflection: [Topic/Event/Period]</h1>

<p><em>Date: [Date]</em></p>

<h2>Context</h2>
<p>What happened? What's the situation you're reflecting on?</p>

<h2>What Went Well</h2>
<ul>
<li>Success 1: Why it worked</li>
<li>Success 2: Why it worked</li>
</ul>

<h2>What Could Have Been Better</h2>
<ul>
<li>Challenge 1: What I'd do differently</li>
<li>Challenge 2: What I'd do differently</li>
</ul>

<h2>Key Lessons Learned</h2>
<blockquote>
<p>The most important insight from this experience...</p>
</blockquote>

<h3>Lesson 1</h3>
<p>Description and how it applies going forward.</p>

<h3>Lesson 2</h3>
<p>Description and how it applies going forward.</p>

<h2>Action Items</h2>
<ul>
<li>☐ What I'll start doing</li>
<li>☐ What I'll stop doing</li>
<li>☐ What I'll continue doing</li>
</ul>

<h2>Future Me Note</h2>
<p>A message to your future self about this experience.</p>`,
  },
  {
    id: "blank",
    name: "Blank Document",
    type: "general",
    description: "Start with a clean slate",
    tags: [],
    content: `<h1>Untitled Document</h1>
<p>Start writing here...</p>`,
  },
];
