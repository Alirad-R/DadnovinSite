import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "@langchain/openai";
import * as fs from "fs/promises";
import * as path from "path";
import { access } from "fs/promises";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

async function loadDocumentsFromDirectory(directoryPath: string) {
  try {
    const files = await fs.readdir(directoryPath);
    const textFiles = files.filter((file) => file.endsWith(".txt"));

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const documents = [];
    for (const file of textFiles) {
      const filePath = path.join(directoryPath, file);
      const content = await fs.readFile(filePath, "utf-8");
      const docs = await textSplitter.createDocuments([content]);
      documents.push(...docs);
    }

    return documents;
  } catch (error) {
    console.error("Error loading documents:", error);
    return [];
  }
}

async function saveVectorStore(vectorStore: HNSWLib, directory: string) {
  await vectorStore.save(directory);
  console.log(`Vector store saved to ${directory}`);
}

async function loadOrCreateVectorStore(openAIApiKey: string) {
  const VECTOR_STORE_PATH = "./vector-store";

  try {
    try {
      await access(VECTOR_STORE_PATH);
      console.log("Loading existing vector store...");
      const embeddings = new OpenAIEmbeddings({ openAIApiKey });
      return await HNSWLib.load(VECTOR_STORE_PATH, embeddings);
    } catch {
      console.log("Creating new vector store...");
      const documents = await loadDocumentsFromDirectory("./data");

      if (documents.length === 0) {
        console.warn("No documents found in the data directory!");
      }

      const embeddings = new OpenAIEmbeddings({ openAIApiKey });
      const vectorStore = await HNSWLib.fromDocuments(documents, embeddings);
      await saveVectorStore(vectorStore, VECTOR_STORE_PATH);

      return vectorStore;
    }
  } catch (error) {
    console.error("Error with vector store:", error);
    throw error;
  }
}

export { loadOrCreateVectorStore };
