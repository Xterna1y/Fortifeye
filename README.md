# Fortifeye

Fortifeye is a web-based platform built for the hackathon project. It provides separate user flows for **guardians** and **dependents**, with a frontend built for user interaction and a backend API for application logic and data handling. The platform also includes a **sandbox feature**, where links can be opened in an isolated environment to help prevent data leakage and reduce the risk of accidental malware installation.

## Tech Stack

### Frontend

* **React**
* **Vite**
* **JavaScript**
* **CSS**

### Backend

* **Node.js**
* **Express.js**
* **CORS**

### Development Environment

* **npm** for package management
* **Google Cloud Workstations** for cloud development

## Project Structure

```text
FORTIFEYE/
├── backend_v2/
│   ├── src/
│   ├── server.js
│   ├── package.json
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
└── README.md
```

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd <your-project-folder>
```

### 2. Set up the backend

Go into the backend folder, install dependencies, and start the development server.

```bash
cd backend_v2
npm install
npm run dev
```

### 3. Set up the frontend

Open a new terminal, then go into the frontend folder, install dependencies, and start the frontend development server.

```bash
cd frontend
npm install
npm run dev
```

## Login Credentials

### Dependent account

* **Email:** [dependent01@gmail.com]
* **Password:** 12345678

* **Email:** [dependent02@gmail.com]
* **Password:** 12345678

### Guardian account

* **Email:** [guardian@gmail.com](mailto:guardian@123.com)
* **Password:** 12345678

## Key Features

* **Guardian and dependent roles** with separate user flows
* **Transaction approval workflow** to support safer decision-making before sensitive transfers or actions are completed
* **Scam text and audio analysis** to examine suspicious messages and speech content
* **Risk scoring system** that evaluates potential threat levels based on detected scam indicators
* **Guidance and next-step advice** to help users decide how to respond safely after a scam check
* **Sandbox link isolation** to open suspicious or unknown links in a contained environment for safer browsing, helping prevent data leakage and accidental malware installation
* **AI + RAG-powered detection** where links, text, and audio are not only analysed by AI, but are also checked against retrieved reference data to identify suspicious websites and similar scam text patterns

## Notes

* Start the **backend** first before starting the **frontend**.
* Make sure both servers are running during development.
* If environment variables are required, create the necessary `.env` files before running the project.
