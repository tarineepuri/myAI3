import { Pinecone } from '@pinecone-database/pinecone';
import { PINECONE_TOP_K, PINECONE_INDEX_NAME } from '@/config';

if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not set');
}

export const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

export const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

export async function searchPinecone(query: string): Promise<string> {
    const results = await pineconeIndex
        .namespace("default")
        .searchRecords({
            query: {
                inputs: { text: query },
                topK: PINECONE_TOP_K,
            },
            fields: [
                "text",
                "pre_context",
                "post_context",
                "source_name",
                "source_description",
                "order"
            ],
        });

    if (!results.matches || results.matches.length === 0) {
        return "No relevant information found in the knowledge base.";
    }

    let finalText = "";

    for (const match of results.matches) {
        const t = match.fields?.text || "";
        const pre = match.fields?.pre_context || "";
        const post = match.fields?.post_context || "";
        const source = match.fields?.source_name || "";
        const desc = match.fields?.source_description || "";

        finalText += `
SOURCE: ${source}
DESCRIPTION: ${desc}

${pre}
${t}
${post}

-------------------------
`;
    }

    return finalText.trim();
}
