import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, targetType, messages, transcript, sourceType } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const typeInstructions: Record<string, string> = {
      sop: `Create a Standard Operating Procedure (SOP) with:
- Clear title
- Purpose/objective
- Scope
- Numbered step-by-step procedures
- Roles and responsibilities where applicable
- Checklists for quality assurance
- Notes and tips`,
      how_to: `Create a How-To Guide with:
- Clear, action-oriented title
- Brief introduction explaining what will be achieved
- Prerequisites or requirements
- Step-by-step instructions
- Tips and best practices
- Troubleshooting section if applicable`,
      product_doc: `Create Product Documentation with:
- Clear product/feature name
- Overview and purpose
- Key features and capabilities
- Usage instructions
- Configuration options
- Best practices`,
      reflection: `Create a Founder Reflection with:
- Meaningful title capturing the theme
- Context and background
- Key insights and lessons learned
- Challenges faced and how they were overcome
- Advice for other founders
- Personal takeaways`,
      general: `Create well-organized documentation with:
- Clear, descriptive title
- Executive summary
- Main content organized into logical sections
- Key takeaways
- Action items or next steps if applicable`,
    };

    // Build content from either interview messages or transcript
    let sourceContent = "";
    if (messages && messages.length > 0) {
      sourceContent = messages.map((m: any) => `${m.role === 'user' ? 'Founder' : 'Interviewer'}: ${m.content}`).join('\n\n');
    } else if (transcript) {
      sourceContent = transcript;
    }

    const systemPrompt = `You are an expert documentation writer helping founders turn their knowledge into structured, professional documents.

Task: ${typeInstructions[targetType] || typeInstructions.general}

Topic: ${topic}

Source: ${sourceType === 'voice' ? 'Voice recording transcript' : sourceType === 'file' ? 'Uploaded file content' : 'Interview conversation'}

Instructions:
1. Extract all valuable insights from the source content
2. Organize into a clear, professional structure following the format above
3. Use clear headings and subheadings
4. Include actionable steps where appropriate
5. Add bullet points and numbered lists for clarity
6. Keep the founder's voice and personality while making it professional
7. Generate relevant tags based on the content (3-5 tags)

Respond with a JSON object containing:
{
  "title": "Document title",
  "content": "Full formatted document content with markdown headings, lists, etc.",
  "summary": "2-3 sentence summary of the document",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: sourceContent }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate document");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from the response (in case it's wrapped in markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback: create a basic document from the response
      parsedResponse = {
        title: topic,
        content: aiResponse,
        summary: `Documentation about ${topic}`,
        tags: [],
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Generate document error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
