# Fortifeye

Fortifeye is a web-based platform built for the hackathon project. It provides separate user flows for **guardians** and **dependents**, with a frontend built for user interaction and a backend API for application logic and data handling.

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

* **Email:** [dependent@123.com](mailto:dependent@123.com)
* **Password:** 12345678

### Guardian account

* **Email:** [guardian@123.com](mailto:guardian@123.com)
* **Password:** 12345678

## Notes

* Start the **backend** first before starting the **frontend**.
* Make sure both servers are running during development.
* If environment variables are required, create the necessary `.env` files before running the project.
