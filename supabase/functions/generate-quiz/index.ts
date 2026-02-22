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

    console.log('ENV check:', { supabaseUrl: !!supabaseUrl, serviceKey: !!supabaseServiceKey, geminiKey: !!geminiApiKey });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('Auth result:', { userId: user?.id, authError: authError?.message });
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { material_ids, question_count, time_limit_minutes, mode } = await req.json();
    console.log('Request body:', { material_ids, question_count, time_limit_minutes, mode });

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

    console.log('Materials fetch:', { count: materials?.length, error: matError?.message });
    if (matError || !materials?.length) {
      return new Response(JSON.stringify({ error: 'Failed to fetch materials', details: matError?.message }), {
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
        console.error('Gemini attempt', attempt, 'failed:', String(err));
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
        question_count,
        time_limit_minutes,
        mode,
      })
      .select('id')
      .single();

    console.log('Quiz insert:', { quizId: quiz?.id, error: quizError?.message });
    if (quizError || !quiz) {
      return new Response(JSON.stringify({ error: 'Failed to create quiz', details: quizError?.message }), {
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

    console.log('Questions insert:', { count: questions.length, error: qError?.message });
    if (qError) {
      return new Response(JSON.stringify({ error: 'Failed to insert questions', details: qError?.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ quiz_id: quiz.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), {
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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
    const errorBody = await response.text();
    console.error('Gemini API error body:', errorBody);
    throw new Error(`Gemini API error: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('No content in Gemini response');
  }

  return JSON.parse(content) as GeminiResponse;
}
