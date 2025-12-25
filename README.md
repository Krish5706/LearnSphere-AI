# LearnSphere AI

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-development-orange.svg)
![AI](https://img.shields.io/badge/AI-Powered-purple.svg)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**LearnSphere AI** is an intelligent educational platform designed to revolutionize the learning experience. By leveraging the power of Google's Generative AI, LearnSphere provides personalized tutoring, dynamic content generation, and interactive learning assistance.

## Table of Contents

- [About The Project](#about-the-project)
- [Key Features](#key-features)
- [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## About The Project

LearnSphere AI aims to bridge the gap between static educational content and interactive, personalized learning. Whether you are a student looking for homework help or a lifelong learner exploring new topics, LearnSphere adapts to your needs using state-of-the-art AI models.

### Screenshots

![App Screenshot](https://via.placeholder.com/800x400?text=App+Screenshot+Placeholder)

## Key Features

*   **AI-Powered Tutoring:** Real-time answers and explanations powered by Google Gemini.
*   **Dynamic Content:** Generate quizzes, summaries, and study guides on the fly.
*   **Interactive Interface:** User-friendly frontend designed for seamless engagement.
*   **Personalized Learning Paths:** (Planned) AI-curated curriculums based on user progress.

## Built With

*   ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
*   ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
*   ![Google Gemini](https://img.shields.io/badge/google%20gemini-8E75B2?style=for-the-badge&logo=google%20bard&logoColor=white)
*   ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)

## Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/LearnSphere-AI.git
    cd LearnSphere-AI
    ```

2.  **Install Dependencies**
    Install dependencies for both backend and frontend:
    ```bash
    # Install all dependencies (recommended)
    npm run install:all
    
    # Or install separately:
    cd backend && npm install
    cd ../forntend && npm install
    ```

### Environment Variables

#### Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Connection
# Get your MongoDB URI from MongoDB Atlas (https://www.mongodb.com/cloud/atlas) or use local MongoDB
MONGODB_URI=mongodb://localhost:27017/learnsphere-ai
# Example for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/learnsphere-ai?retryWrites=true&w=majority

# JWT Configuration
# Generate a secure random string for JWT_SECRET
# You can generate one using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Google Gemini API Key (REQUIRED)
# Get your free API key from Google AI Studio: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-google-gemini-api-key-here
```

**Important:** 
- Get your free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Make sure to add `GEMINI_API_KEY` to your backend `.env` file, otherwise PDF analysis will fail

#### Frontend Environment Variables

Create a `.env` file in the `forntend` directory:

```env
VITE_GOOGLE_AI_API_KEY=your_api_key_here
```

## Usage

### Starting the Backend Server

From the project root:
```bash
npm start
# or
npm run start:backend
```

Or from the backend directory:
```bash
cd backend
npm start
```

The backend server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### Starting the Frontend Development Server

From the project root:
```bash
npm run dev
# or
npm run start:frontend
```

Or from the frontend directory:
```bash
cd forntend
npm run dev
```

The frontend will typically run on `http://localhost:5173` (Vite's default port).

**Note:** Make sure both the backend and frontend servers are running for the full application to work properly.

## Roadmap

- [x] Basic AI Chat Integration
- [ ] User Authentication
- [ ] History and Progress Tracking
- [ ] Voice Interaction Support
- [ ] Multi-language Support

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
