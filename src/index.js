export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        let response;
        
        if (url.pathname === '/ingest' && request.method === 'POST') {
            response = await handleIngestion(request, env);
        } else if (url.pathname === '/chat' && request.method === 'POST') {
            response = await handleChat(request, env);
        } else {
            const frontendUrl = 'http://127.0.0.1:8788/';
                
            response = new Response(null, {
                status: 302,
                headers: {
                    'Location': frontendUrl,
                },
            });
        }

        return withCORS(response);
    },
};

const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://127.0.0.1:8788',
    'Access-Control-Allow-Methods': 'GET, POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

function withCORS(response) {
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
        headers.set(key, value);
    }
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
    });
}

function simpleChunker(text, maxLen = 500) {
    const sentences = text.split(/[.!?]\s+/);
    let chunks = [];
    let currentChunk = "";

    // Attempting to extract sentences into chunks here
    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxLen && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence + ". ";
        } else {
            currentChunk += sentence + ". ";
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

async function handleIngestion(request, env) {

    try {
        const { text, source = "manual_entry" } = await request.json();

        if (!text) {
            return new Response('Missing "text" field.', { status: 400 });
        }

        const chunks = simpleChunker(text);

        const embeddingModel = "@cf/baai/bge-small-en-v1.5";

        const embeddingsResult = await env.AI.run(embeddingModel, { text: chunks });
        const embeddings = embeddingsResult.data;

        const vectorizeData = [];
        const d1Statements = [];

        for (let i = 0; i < chunks.length; i++) {
            const id = crypto.randomUUID();
            
            d1Statements.push(
                env.DB.prepare("INSERT INTO db_notes (id, vector_chunk, source) VALUES (?, ?, ?)").bind(id, chunks[i], source)
            );
            
            vectorizeData.push({ id: id, values: embeddings[i] });
        }

        await env.DB.batch(d1Statements);
        await env.VECTORIZE.insert(vectorizeData);
        
        return new Response(`Successfully ingested ${chunks.length} chunks.`, { status: 200 });

    } catch (e) {

        return new Response(`Ingestion error: ${e.message}`, { status: 500 });

    }
}

async function handleChat(request, env) {

    try {
        const { query } = await request.json();

        if (!query) {
            return new Response('Missing "query" field.', { status: 400 });
        }

        const embeddingModel = "@cf/baai/bge-small-en-v1.5";
        const queryEmbedding = await env.AI.run(embeddingModel, { text: [query] });

        const searchResults = await env.VECTORIZE.query(
            queryEmbedding.data[0],
            { topK: 5 }
        );

        const idsToFetch = searchResults.matches.map(m => m.id);

        if (idsToFetch.length === 0) {
            return new Response("Couldn't find relevant notes to answer your question :(", { status: 200 });
        }

        const placeholders = idsToFetch.map(() => '?').join(',');

        const { results } = await env.DB.prepare(
            `SELECT vector_chunk FROM db_notes WHERE id IN (${placeholders})`
        ).bind(...idsToFetch).all();

        const context = results.map(r => r.vector_chunk).join('\n---\n');

        const llmModel = "@cf/meta/llama-3-8b-instruct";
        
        const systemPrompt = "You are a friendly, concise, and helpful assistant. Use ONLY the provided CONTEXT to answer the USER QUESTION. If the context does not contain the answer, politely state that the information is not available in your notes.";

        const ragPrompt = `${systemPrompt}\n\nCONTEXT:\n${context}\n\nUSER QUESTION: ${query}`;

        const llmResponse = await env.AI.run(llmModel, { prompt: ragPrompt });

        return new Response(llmResponse.response, { 
            status: 200, 
            headers: { 'Content-Type': 'text/plain' } 
        });

    } catch (e) {
        console.error(e);
        return new Response(`Chat error: ${e.message}`, { status: 500 });
    }
}