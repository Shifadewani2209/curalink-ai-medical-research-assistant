<img width="1212" height="806" alt="image" src="https://github.com/user-attachments/assets/bf60f914-598b-4301-bbda-54bc593cd602" />
<img width="1117" height="994" alt="image" src="https://github.com/user-attachments/assets/108bc52b-de0a-4c91-a540-cb71a7b633fa" />

# CuraLink AI Medical Research Assistant

CuraLink AI is a MERN-based medical research assistant that helps users explore condition-specific research using real evidence from:

- OpenAlex
- PubMed
- ClinicalTrials.gov

The system accepts structured medical input, expands the search query, retrieves publications and clinical trials, ranks the results, stores session context in MongoDB, and supports follow-up questions with context reuse.


# Features

- MERN stack application
- Structured medical research input form
- Query expansion for broader evidence retrieval
- Real-time publication retrieval from OpenAlex
- Real-time publication retrieval from PubMed
- Real-time clinical trial retrieval from ClinicalTrials.gov
- Linked trial-related publication display
- Result ranking and top evidence selection
- MongoDB-backed session memory
- Follow-up question support
- Structured response sections
- Premium animated frontend UI

---

## Tech Stack

### Frontend
- React
- Vite
- Framer Motion
- JavaScript

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### External APIs
- OpenAlex API
- PubMed E-utilities API
- ClinicalTrials.gov API v2

---

## Project Structure

```text
curalink-ai/
│
├── .gitignore
├── README.md
│
├── client/
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── ...
│
├── server/
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── app.js
│       ├── index.js
│       ├── config/
│       │   └── db.js
│       ├── controllers/
│       │   └── researchController.js
│       ├── models/
│       │   └── Session.js
│       ├── routes/
│       │   └── researchRoutes.js
│       └── services/
│           ├── researchService.js
│           ├── query/
│           │   └── expandQuery.js
│           ├── retrieval/
│           │   ├── openAlexService.js
│           │   ├── pubmedService.js
│           │   └── clinicalTrialsService.js
│           ├── ranking/
│           │   └── rankResults.js
│           └── llm/
│               └── ollamaService.js
