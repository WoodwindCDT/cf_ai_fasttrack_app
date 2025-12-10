### Cloudflare Retrieval-Augmented Generation (RAG) Assistant

This project demonstrates a full-stack, AI-powered application built on the Cloudflare developer platform. It allows users to ask natural language questions about custom, ingested text data by leveraging text embedding for semantic search and Workers AI (Llama 3.3) for intelligent response generation.

> Access here > [https://cfai.cris1.com/](https://cfai.cris1.com/)

---

#### Project Architecture

The application uses the following key Cloudflare components:

- **Backend API (Worker)**: Handles the RAG pipeline logic (embedding, retrieval, augmentation, and generation).

- **Vector Database**: Cloudflare Vectorize stores numerical embeddings of text chunks.

- **Text Data Store**: Cloudflare D1 stores the original text chunks referenced by Vectorize.

- **AI Models**: Workers AI is used for both Embedding (@cf/baai/bge-small-en-v1.5) and Generation (@cf/meta/llama-3-8b-instruct).

- **Frontend**: Cloudflare Pages hosts a simple static chat interface.

---

#### Example Walkthrough

- Enter a collection of notes within the "Enter Your Notes" textarea.

<p align="center">
  <img src="https://github.com/WoodwindCDT/cf_ai_fasttrack_app/blob/main/assets/input-example.png?raw=true" alt="example of input image"/>
</p>

- Press "Ingest Data"
  - An example of a successful submission:
  
<p align="center">
  <img src="https://github.com/WoodwindCDT/cf_ai_fasttrack_app/blob/main/assets/successful-input.png?raw=true" alt="example of successful input image"/>
</p>

- Next, you may ask a natural language question within the "Ask a Question" text input.
  - Press "Send" once ready.
  - An example of a successful query response:
  
<p align="center">
  <img src="https://github.com/WoodwindCDT/cf_ai_fasttrack_app/blob/main/assets/responses.png?raw=true" alt="example of successful responses image"/>
</p>