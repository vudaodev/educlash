import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestionSchema {
  question_text: string;
  options: string[];
  correct_option_index: number;
}

interface GeminiResponse {
  questions: QuestionSchema[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { material_ids, question_count, time_limit_minutes, mode } = await req.json();

    if (!material_ids?.length || !question_count || !time_limit_minutes || !mode) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch materials
    const { data: materials, error: matError } = await supabase
      .from('materials')
      .select('extracted_text')
      .in('id', material_ids);

    if (matError || !materials?.length) {
      return new Response(JSON.stringify({ error: 'Failed to fetch materials' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const combinedText = materials.map((m: { extracted_text: string }) => m.extracted_text).join('\n\n');

    // Call Gemini with retry
    let geminiResult: GeminiResponse | null = null;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        geminiResult = await callGemini(geminiApiKey, combinedText, question_count);
        break;
      } catch (err) {
        lastError = err as Error;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    if (!geminiResult) {
      return new Response(JSON.stringify({ error: `AI generation failed: ${lastError?.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        creator_id: user.id,
        num_questions: question_count,
        time_limit_seconds: time_limit_minutes * 60,
        mode,
      })
      .select('id')
      .single();

    if (quizError || !quiz) {
      return new Response(JSON.stringify({ error: 'Failed to create quiz' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert questions
    const questions = geminiResult.questions.slice(0, question_count).map((q, i) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      options: q.options,
      correct_option_index: q.correct_option_index,
      order: i,
    }));

    const { error: qError } = await supabase.from('questions').insert(questions);

    if (qError) {
      return new Response(JSON.stringify({ error: 'Failed to insert questions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ quiz_id: quiz.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callGemini(
  apiKey: string,
  text: string,
  questionCount: number,
): Promise<GeminiResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `You are a quiz generator. Based on the following study material, generate exactly ${questionCount} multiple-choice questions. Each question should have exactly 4 options with one correct answer.

Study Material:
${text}

Generate ${questionCount} questions.`,
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question_text: { type: 'string' },
                  options: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  correct_option_index: { type: 'integer' },
                },
                required: ['question_text', 'options', 'correct_option_index'],
              },
            },
          },
          required: ['questions'],
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('No content in Gemini response');
  }

  return JSON.parse(content) as GeminiResponse;
}
