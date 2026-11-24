declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

interface IdentifyPlantRequest {
  imageBase64?: string;
  mimeType?: string;
  catalogIds?: string[];
}

interface IdentifyPlantResponse {
  isOutdoorNature: boolean;
  isScreenOrFake: boolean;
  matchedCatalogId: string | null;
  speciesName: string;
  fieldNote: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GEMINI_MODEL = 'gemini-2.5-flash';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function buildPrompt(catalogIds: string[]): string {
  const allowedList = catalogIds.length > 0 ? catalogIds.join(', ') : 'meadow_daisy, sunlit_fern, lavender';
  return [
    'You are a calm botanical naturalist for the Dew & Bloom app.',
    'Inspect the photo and return ONLY valid JSON matching this schema:',
    '{"isOutdoorNature":boolean,"isScreenOrFake":boolean,"matchedCatalogId":string|null,"speciesName":string,"fieldNote":string}',
    'Rules:',
    '- Set isScreenOrFake=true if the image is a photo of a monitor, phone, TV, printed poster, or artificial plastic plant.',
    '- Set isOutdoorNature=true ONLY for real outdoor leaves, flowers, trees, moss, or garden flora.',
    '- If isScreenOrFake=true or isOutdoorNature=false, set matchedCatalogId=null, speciesName="", and fieldNote to a gentle one-sentence note.',
    `- Otherwise pick the closest botanical match from this exact list of catalogIds: [${allowedList}].`,
    '- Keep speciesName concise (e.g. "Wild Lavender") and fieldNote warm, grounded, and under 140 characters.',
  ].join('\n');
}

function sanitizeResult(raw: unknown, catalogIds: string[]): IdentifyPlantResponse {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const isScreenOrFake = Boolean(data.isScreenOrFake);
  const isOutdoorNature = !isScreenOrFake && Boolean(data.isOutdoorNature);
  const rawMatch = typeof data.matchedCatalogId === 'string' ? data.matchedCatalogId.trim() : null;
  const matchedCatalogId =
    isOutdoorNature && rawMatch && (catalogIds.length === 0 || catalogIds.includes(rawMatch))
      ? rawMatch
      : null;

  return {
    isOutdoorNature,
    isScreenOrFake,
    matchedCatalogId,
    speciesName: typeof data.speciesName === 'string' ? data.speciesName.trim() : '',
    fieldNote:
      typeof data.fieldNote === 'string' && data.fieldNote.trim().length > 0
        ? data.fieldNote.trim()
        : 'Step outside and point at real leaves, flowers, or trees.',
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
  if (!apiKey) {
    return jsonResponse({ error: 'GEMINI_API_KEY is not configured' }, 500);
  }

  let payload: IdentifyPlantRequest;
  try {
    payload = (await req.json()) as IdentifyPlantRequest;
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  const imageBase64 = payload.imageBase64?.trim();
  const mimeType = payload.mimeType?.trim() || 'image/jpeg';
  const catalogIds = Array.isArray(payload.catalogIds)
    ? payload.catalogIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : [];

  if (!imageBase64) {
    return jsonResponse({ error: 'imageBase64 is required' }, 400);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: buildPrompt(catalogIds) },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!geminiRes.ok) {
      return jsonResponse({ error: 'Vision model request failed' }, 502);
    }

    const body = (await geminiRes.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    return jsonResponse(sanitizeResult(JSON.parse(text), catalogIds));
  } catch {
    return jsonResponse({ error: 'Failed to identify plant photo' }, 502);
  }
});
