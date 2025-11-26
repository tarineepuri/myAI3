import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_API_KEY, PINECONE_INDEX_NAME } from "@/config";

export async function searchPinecone(query: string): Promise<string> {
  // 1. Connect to Pinecone
  const pc = new Pinecone({
    apiKey: PINECONE_API_KEY,
  });

  // 2. Embed text (universal format)
  const embedResult = await pc.inference.embed(
    "llama-text-embed-v2",
    { input: [query] }
  );

  // 🔥 UNIVERSAL extraction that ALWAYS works:
  const vector =
    embedResult.data[0].values ??            // dense format
    embedResult.data[0].embedding ??         // alt format
    embedResult.data[0].sparseValues ??      // sparse format
    embedResult.data[0].sparseValues?.values ?? // fallback
    (() => {
      throw new Error("No usable embedding vector returned.");
    })();

  // 3. Query Pinecone index
  const index = pc.index(PINECONE_INDEX_NAME);

  const result = await index.query({
    vector,
    topK: 5,
  });

  return JSON.stringify(result, null, 2);
}
