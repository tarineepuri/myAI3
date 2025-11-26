import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_TOP_K, PINECONE_INDEX_NAME } from "@/config";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("Missing PINECONE_API_KEY");
}

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index(PINECONE_INDEX_NAME).namespace("default");

export async function searchPinecone(query: string): Promise<string> {
  // 1. Embed text (correct format for your SDK)
  const embedResult = await pc.inference.embed(
    "llama-text-embed-v2",
    [query]
  );

  // ACCESS PATH FOR YOUR VERSION:
  const vector = embedResult.data[0].embedding;

  // 2. Query Pinecone
  const response = await index.query({
    vector,
    topK: PINECONE_TOP_K,
    includeMetadata: true
  });

  if (!response.matches?.length) {
    return "No relevant information found in the knowledge base.";
  }

  let final = "";

  for (const match of response.matches) {
    const meta = match.metadata || {};

    final += `
SOURCE: ${meta.source_name || "unknown"}
DESCRIPTION: ${meta.source_description || ""}

${meta.pre_context || ""}
${meta.text || ""}
${meta.post_context || ""}
------------------------------------
`;
  }

  return final.trim();
}
