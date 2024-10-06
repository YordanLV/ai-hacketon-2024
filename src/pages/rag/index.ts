const express = require('express');
const {setupChatComponents} = require('./query.ts');
const {initializeLLM} = require('./embeddings.ts');

const { createStuffDocumentsChain } = require("langchain/chains/combine_documents")


const app = express();
app.use(express.json());

let chatComponents;

async function promptRAG(query) {
    const { vectorStore, llm, promptTemplate, outputParser } = chatComponents;

    try {

        // console.log(vectorStore)
        const vectorResult = await vectorStore.similaritySearch(query, 5);
        // TODO comment out vector result 
        console.log("--------------------------- RAG data --------------------")
        console.log(vectorResult)
        const ragChain = await createStuffDocumentsChain({ //rag chain to emulate chatbot behaviour
            llm: llm,
            prompt: promptTemplate,
            outputParser: outputParser,
        });

        const result = await ragChain.invoke({ //invoke the chain to return response
            question: query,
            context: vectorResult,
        });

        return result;
    } catch (error) {
        console.error('Error handling the query:', error);
        return 'An error occurred while processing your request';
    }
};


async function initializeRAG(){
    const initialized = await initializeLLM();
    chatComponents = await setupChatComponents();

    if (initialized) {
        console.log(`LLM iniitialized successfully`);
    } else {
        console.error("Failed to initialize the LLM");
    }
};


module.exports = {promptRAG, initializeRAG};
