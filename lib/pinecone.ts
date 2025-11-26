import { Pinecone } from '@pinecone-database/pinecone';
import { PINECONE_INDEX_NAME, PINECONE_TOP_K } from '@/config';

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not set");
}

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// point to your namespace
const index = pc.index(PINECONE_INDEX_NAME).namespace("default");

export async function searchPinecone(query: string): Promise<string> {

  // 1) Embed using new API (latest SDK)
  const embedResult = await pc.inference.embed(
    "llama-text-embed-v2",      // model name
    [query]                     // input array
  );

  // extract vector — ALWAYS works in new SDK
  const queryVector = embedResult.data[0].values;

  // 2) Query Pinecone
  const response = await index.query({
    vector: queryVector,
    topK: PINECONE_TOP_K,
    includeMetadata: true
  });

  // 3) No matches
  if (!response.matches || response.matches.length === 0) {
    return "No relevant information found in the knowledge base.";
  }

  // 4) Build final context string
  let final = "";

  for (const match of response.matches) {
    const meta = match.metadata || {};

    final += `
SOURCE: ${meta.source_name || ""}
DESCRIPTION: ${meta.source_description || ""}
${meta.pre_context || ""}
${meta.text || ""}
${meta.post_context || ""}
------------------------------------
`;
  }

  return final.trim();
}

