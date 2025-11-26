import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_API_KEY, PINECONE_INDEX_NAME } from "@/config";

export async function searchPinecone(query: string): Promise<string> {
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  const index = pc.index(PINECONE_INDEX_NAME);

  // 1. Embed the user query
  const embedResult = await pc.inference.embed({
    model: "llama-text-embed-v2",
    input: [query],
  });

  // YOUR VERSION ALWAYS RETURNS data[0].values
  const vector = embedResult.data[0].values;

  // 2. Query Pinecone
  const response = await index.query({
    vector,
    topK: 5,
    includeMetadata: true,
  });

  // Return the best match as a string
  return JSON.stringify(response.matches || []);
}
