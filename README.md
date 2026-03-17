# 📰 NewsAlign v2 — AI-Powered Fact Checking System

A full-stack AI application that evaluates how well a statement aligns with real-world news using **semantic search, vector retrieval, and LLM-based reasoning**.

This is not just a similarity tool — it’s a system designed to highlight the difference between **retrieval and reasoning**.

---

## 🚀 Live Demo
Frontend: https://news-align.netlify.app/  
GitHub: https://github.com/gona04/NewsAlign  

---

## 🧠 Why this project exists

Most NLP-based “fact-checking” systems don’t actually check facts.

They measure **semantic similarity**.

That means:
- Related statements → high score  
- Even contradictory statements → high score  

This project was rebuilt to solve that exact limitation.

---

## ⚙️ How it works

The same input statement is evaluated using **three different approaches**:

### 1. NLP Similarity (Baseline)
- TensorFlow.js Universal Sentence Encoder  
- Finds *related* headlines  
- Limitation: cannot detect contradiction  

### 2. Vector Search (FAISS)
- High-performance semantic retrieval  
- Finds *most relevant evidence*  
- Limitation: still no reasoning  

### 3. LLM Reasoning (GPT-4o-mini)
- Analyzes retrieved headlines  
- Outputs:
  - TRUE  
  - FALSE  
  - UNCERTAIN  
- Provides explanation + cited sources  

---

## 🔍 Key Insight

> Retrieval ≠ Reasoning

FAISS improves *what you find*  
LLMs improve *what you conclude*

---

## 🗞️ Real-Time Data Pipeline

- Daily cron job (8AM IST)
- Scrapes:
  - The Hindu  
  - FactCheck.org  
- Rebuilds FAISS index daily  
- Cached on startup → no cold-start delay  

---

## ⚠️ API Usage Limit

LLM mode is limited to **4 requests per user per day**

Reason:
- LLM calls have real cost  
- Ensures system sustainability  

NLP + FAISS modes are unlimited.

---

## 🏗️ Architecture Overview

### Frontend
- React + TypeScript  
- Context API (state management)  
- Neumorphic UI system  
- Webpack (code splitting: 941KB → <300KB)  

### Backend
- Node.js + Express  
- REST APIs  
- JWT Authentication (Auth0)  
- Rate limiting  
- Cron jobs (data pipeline)  

### AI / ML
- TensorFlow.js (Universal Sentence Encoder)  
- FAISS (vector search)  
- MiniLM embeddings (@xenova/transformers)  
- GPT-4o-mini (reasoning layer)  

### Data Layer
- PostgreSQL (AWS RDS, SSL enabled)  
- Query logging (user_activity table)  
- Role-based access (ENUM: user/admin)  

### Infrastructure
- Railway (backend hosting — always-on)  
- Netlify (frontend)  
- AWS RDS (database)  
- Auth0 (authentication)  

---

## 🔐 Security & System Design Decisions

- ❌ Frontend limits (localStorage) → bypassable  
- ✅ Backend enforcement using PostgreSQL logs  

Daily usage is calculated using **actual stored activity**, not client-side state.

---

## 🚧 Key Engineering Decisions

- Replaced Puppeteer → Cheerio + Axios  
  → lighter, faster, cloud-friendly  

- Migrated Render → Railway  
  → eliminated cold-start delays  

- Cached FAISS index  
  → instant response on startup  

---

## 🧪 Testing

- Jest test suite  
- ~40 test cases  
- ~84% code coverage  
- Includes:
  - Service layer tests  
  - API route tests  
  - Frontend utility tests  

---

## 📦 Getting Started

### Install dependencies
```bash
npm install
