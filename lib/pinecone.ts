import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_API_KEY, PINECONE_INDEX_NAME } from "@/config";

export async function searchPinecone(query: string): Promise<string> {
  try {
    // Initialize Pinecone
    const pc = new Pinecone({
      apiKey: PINECONE_API_KEY
    });

    // 1. Embed the user query (FIXED: 3 arguments, not 1 object)
    const embedResult = await pc.inference.embed(
      "llama-text-embed-v2",        // model name
      [query],                       // inputs as array
      { inputType: "query" }         // parameters object
    );

    // 2. Extract the vector (FIXED: use [0].values, not .data[0].embedding)
    const queryVector = embedResult.data[0].values;

    // 3. Get the index
    const index = pc.index(PINECONE_INDEX_NAME);

    // 4. Query Pinecone
    const searchResults = await index.query({
      vector: queryVector,
      topK: 3,
      includeMetadata: true
    });

    // 5. Format results as context
    const context = searchResults.matches
      .map(match => match.metadata?.text || "")
      .filter(text => text.length > 0)
      .join("\n\n");

    return context;

  } catch (error) {
    console.error("Pinecone search error:", error);
    throw error;
  }
}
