import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_TOP_K, PINECONE_INDEX_NAME } from "@/config";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not set");
}

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Use your index + namespace "default"
const index = pc.index(PINECONE_INDEX_NAME).namespace("default");

export async function searchPinecone(query: string): Promise<string> {
  // 1. Embed the query using SAME MODEL as your index
  const embedResult = await pc.inference.embed({
    model: "llama-text-embed-v2", // MUST match your index
    input: [query],
  });

  const vector = embedResult.data[0].values;

  // 2. Query Pinecone
  const response = await index.query({
    topK: PINECONE_TOP_K,
    vector,
    includeMetadata: true,
  });

  // 3. Handle no results
  if (!response.matches || response.matches.length === 0) {
    return "No relevant information found in the knowledge base.";
  }

  // 4. Format text
  let final = "";

  fo
