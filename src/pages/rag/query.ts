require('dotenv').config({ 
    path: ['.env.local', '.env'] 
})
const { MongoClient } = require("mongodb");
const { ChatOpenAI, OpenAIEmbeddings } = require("@langchain/openai");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");



const client = new MongoClient(process.env.MONGODB_URI); //add your MongoDB Atlas connection string
const database = client.db("embeddings"); //add your MongoDB Atlas database name
const collection = database.collection("embeddings_col"); //add your MongoDB Atlas collection name
const dbConfig = {  
    collection: collection, //add collection here
    indexName: "vector_index", //add Vector Index name
    textKey: "text", //you can leave this unchanged
    embeddingKey: "embedding", //you can leave this unchanged
};

async function setupChatComponents() {
    await client.connect();
    console.log('Connected successfully to MongoDB');

    const embeddings = new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "text-embedding-3-small"
    });

    const vectorStore = await new MongoDBAtlasVectorSearch(embeddings, dbConfig);


    console.log('Vector store initialized');
    
    // const vectorResult = await vectorStore.similaritySearch("SEO", 5); //running similarity search for the query
    // console.log(vectorResult)

    const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4o"
    });

    const promptTemplate = PromptTemplate.fromTemplate(
        "You are a agent that will analyse and give statistical responses for the data CONTEXT: {context} USER QUESTION: {question}"
    );

    const outputParser = new StringOutputParser();

    return { vectorStore, llm, promptTemplate, outputParser };
}

module.exports = {setupChatComponents};




