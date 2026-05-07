import "server-only";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL_DOCUMENT_BUILDER ?? "gpt-5.2";

type StructuredOutputSchema = {
  name: string;
  description?: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

type OpenAiStructuredResponse<T> = {
  data: T;
  model: string;
  responseId: string | null;
  outputText: string;
};

const extractOutputText = (payload: Record<string, unknown>) => {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const textParts = output.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const content = Array.isArray((item as { content?: unknown[] }).content)
      ? ((item as { content: unknown[] }).content ?? [])
      : [];

    return content
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const text = (entry as { text?: string }).text;
        return typeof text === "string" ? text : null;
      })
      .filter((entry): entry is string => Boolean(entry));
  });

  return textParts.join("\n").trim();
};

export async function createStructuredOpenAiResponse<T>({
  systemPrompt,
  userPrompt,
  schema,
  model = DEFAULT_OPENAI_MODEL,
}: {
  systemPrompt: string;
  userPrompt: string;
  schema: StructuredOutputSchema;
  model?: string;
}): Promise<OpenAiStructuredResponse<T>> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userPrompt }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: schema.name,
          description: schema.description,
          schema: schema.schema,
          strict: schema.strict ?? true,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "OpenAI request failed.");
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const outputText = extractOutputText(payload);

  if (!outputText) {
    throw new Error("OpenAI returned an empty response.");
  }

  let parsed: T;
  try {
    parsed = JSON.parse(outputText) as T;
  } catch {
    throw new Error("OpenAI returned invalid structured JSON.");
  }

  return {
    data: parsed,
    model: typeof payload.model === "string" ? payload.model : model,
    responseId: typeof payload.id === "string" ? payload.id : null,
    outputText,
  };
}
