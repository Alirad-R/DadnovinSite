import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import * as fs from "fs/promises";
import * as path from "path";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const VECTOR_STORE_PATH = "./vector-store";
const DOCS_FILE = path.join(VECTOR_STORE_PATH, "docs.json");

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

async function saveVectorStore(documents: any[]) {
  await fs.mkdir(VECTOR_STORE_PATH, { recursive: true });
  await fs.writeFile(DOCS_FILE, JSON.stringify(documents));
  console.log(`Documents saved to ${DOCS_FILE}`);
}

async function loadOrCreateVectorStore(openAIApiKey: string) {
  const embeddings = new OpenAIEmbeddings({ openAIApiKey });
  

  try {
    console.log("Loading existing vector store...");
    const docsContent = await fs.readFile(DOCS_FILE, "utf-8");
    const documents = JSON.parse(docsContent);
    return await MemoryVectorStore.fromDocuments(documents, embeddings);
  } catch {
    console.log("Creating new vector store...");
    const documents = await loadDocumentsFromDirectory("./data");

    if (documents.length === 0) {
      console.warn("No documents found in the data directory!");
    }

    const vectorStore = await MemoryVectorStore.fromDocuments(
      documents,
      embeddings
    );
    await saveVectorStore(documents);
    return vectorStore;
  }
}

export { loadOrCreateVectorStore };
