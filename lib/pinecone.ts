import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_INDEX_NAME, PINECONE_TOP_K } from "@/config";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not set");
}

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pc.index(PINECONE_INDEX_NAME).namespace("default");

export async function searchPinecone(query: string): Promise<string> {
  // 1. Embed user query (dense vector)
  const embedResult = await pc.inference.embed({
    model: "llama-text-embed-v2",
    input: [query],   // <-- MUST be array
  });

  const queryVector = embedResult.data[0].values;  // <-- YOUR index is DENSE

  // 2. Query Pinecone
  const response = await index.query({
    topK: PINECONE_TOP_K,
    vector: queryVector,
    includeMetadata: true,
  });

  // 3. Handle no matches
  if (!response.matches || response.matches.length === 0) {
    return "No relevant information found in the knowledge base.";
  }

  // 4. Build context summary
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


