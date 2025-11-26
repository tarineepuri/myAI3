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

  // 1️⃣ EMBEDDING — Legacy SDK uses 3 arguments
  const embedResult = await pc.inference.embed(
    "llama-text-embed-v2",      // model name
    { input: [query] },          // input must be inside an object
    {}                           // options object (even if empty)
  );

  // 2️⃣ CORRECT OUTPUT SHAPE FOR YOUR SDK
  const queryVector = embedResult.data[0].values;

  // 3️⃣ Query Pinecone
  const response = await index.query({
    topK: PINECONE_TOP_K,
    vector: queryVector,
    includeMetadata: true,
  });

  if (!response.matches || response.matches.length === 0) {
    return "No relevant information found in the knowledge base.";
  }

  // 4️⃣ Build final text output
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
