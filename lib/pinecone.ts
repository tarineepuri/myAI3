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

  // 1. Embed with OLD SDK FORMAT
  const embedResult = await pc.inference.embed({
    model: "llama-text-embed-v2",
    input: [query],
  });

  // 👇 THIS is the correct structure in YOUR version
  const queryVector = embedResult.data[0].values;

  // 2. Query Pinecone
  const response = await index.query({
    topK: PINECONE_TOP_K,
    vector: queryVector,
    includeMetadata: true,
  });

  if (!response.matches || response.matches.length === 0) {
    return "No relevant information found in the knowledge base.";
  }

  // 3. Build answer
  let result = "";
  for (const match of response.matches) {
    const meta = match.metadata || {};

    result += `
SOURCE: ${meta.source_name || ""}
DESCRIPTION: ${meta.source_description || ""}

${meta.pre_context || ""}
${meta.text || ""}
${meta.post_context || ""}

------------------------------------
`;
  }

  return result.trim();
}
