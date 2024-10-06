require('dotenv').config();
const { OpenAIEmbeddings } = require("@langchain/openai");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");
const { MongoClient } = require("mongodb");
const { Document } = require("langchain/document");
const fs = require('fs');
const { CharacterTextSplitter } = require("@langchain/textsplitters");

let vectorStore;

async function initializeLLM() {
    console.log("Initializing connection to LLM and MongoDB...");

    const embeddingModel = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "text-embedding-3-small"
    });

    const client = new MongoClient(process.env.MONGODB_URI)
    // , { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db("embeddings");
        const collection = database.collection("embeddings_col");

        const dbConfig = {
            collection,
            indexName: "vector_index",
            textKey: "text",
            embeddingKey: "embedding"
        };

        // Ensure that the collection is empty
        const count = await collection.countDocuments();
        if (count > 0) {
            await collection.deleteMany({});
        }


        let docs = [];

        const filePaths = ['./src/pages/rag/data.txt']
        //  , './src/pages/rag/book.txt', './src/pages/rag/Companies Listed Alphabetically Showing the Following Details.txt'];

        for (const filePath of filePaths) {
            const fileData = await fs.readFileSync(filePath, 'utf8');

            const splitter = new CharacterTextSplitter({
                separator: "\n",
                chunkSize: 500,
                chunkOverlap: 15
            });

            const fileDocs = await splitter.createDocuments([fileData]);
            docs = docs.concat(fileDocs);
        }



        vectorStore = await MongoDBAtlasVectorSearch.fromDocuments(docs, embeddingModel, dbConfig);
        console.log("LLM and MongoDB have been initialized successfully.");

        return vectorStore;
    } catch (error) {
        console.error("Failed to initialize LLM or MongoDB:", error);
        throw error;
    } finally {
        await client.close();
    }
}

module.exports = {initializeLLM};