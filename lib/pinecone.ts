import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_TOP_K, PINECONE_INDEX_NAME } from "@/config";

if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is not set");
}

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index(PINECONE_INDEX_NAME).namespace("default");

export async function searchPinecone(query: string): Promise<string> {

    const embedResult = await pc.inference.embed(
        "multilingual-e5-large",
        [query]
    );

    // 🔍 DEBUG: print the full embedding object as JSON
    return JSON.stringify(embedResult.data[0], null, 2);
}
