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
    const { topic, targetType, messages, action } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const typeDescriptions: Record<string, string> = {
      sop: "Standard Operating Procedure with clear steps, responsibilities, and checkpoints",
      how_to: "How-To Guide with practical instructions and tips",
      product_doc: "Product Documentation covering features, usage, and specifications",
      reflection: "Founder Reflection capturing insights, lessons learned, and personal journey",
      general: "General Knowledge documentation",
    };

    const systemPrompt = `You are an expert interviewer helping founders capture their knowledge. Your goal is to extract valuable insights through thoughtful questions.

You are helping create a ${typeDescriptions[targetType] || "knowledge document"} about: ${topic}

Guidelines:
- Ask one focused question at a time
- Use follow-up questions to dig deeper into interesting points
- Be encouraging and acknowledge good insights
- Help the founder articulate tacit knowledge they might not realize they have
- After 4-6 exchanges, you can suggest wrapping up if enough content has been gathered
- Keep responses concise but warm`;

    let aiMessages = [];
    
    if (action === "start") {
      aiMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `I want to document: ${topic}. Please start the interview.` }
      ];
    } else {
      aiMessages = [
        { role: "system", content: systemPrompt },
        ...messages
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
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
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content;

    if (!aiMessage) {
      throw new Error("No response from AI");
    }

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Interview chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
