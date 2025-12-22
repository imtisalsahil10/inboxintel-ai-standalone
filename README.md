<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# InboxIntel AI - Intelligent Email Assistant

InboxIntel AI is a powerful, full-stack email management platform designed to declutter your inbox and boost productivity. By leveraging Google's Gemini AI, it transforms how you interact with your emails through intelligent summarization, sentiment analysis, and automated smart replies.

## 🚀 Key Features

*   **🤖 AI-Powered Analysis:**
    *   **Instant Summaries:** Get concise summaries of long email threads.
    *   **Sentiment Analysis:** Automatically detect the tone (Positive, Neutral, Negative) of incoming messages.
    *   **Urgency Scoring:** Prioritize emails with an AI-assigned urgency score (0-100).
    *   **Action Items:** Automatically extract tasks and action items from email content.

*   **⚡ Smart Reply System:**
    *   Generate context-aware replies with a single click using Gemini AI.
    *   Draft, edit, and send responses directly from the application.

*   **📧 Seamless Gmail Integration:**
    *   **Secure OAuth 2.0:** Sign in securely with your Google account.
    *   **Real-time Sync:** Fetch and sync your latest emails instantly.
    *   **Full Thread View:** View complete email conversations in a clean, modern interface.

*   **🔒 Secure & Scalable:**
    *   **Persistent Sessions:** Stay logged in across sessions with MongoDB-backed token storage.
    *   **Cloud Ready:** Fully configured for deployment on platforms like Render.

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Tailwind CSS, Vite
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (Atlas)
*   **AI Engine:** Google Gemini AI
*   **APIs:** Gmail API, Google OAuth 2.0

## 🏃‍♂️ Run Locally

**Prerequisites:** Node.js (v18+), MongoDB Atlas Account, Google Cloud Console Project

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/inboxintel-ai.git
    cd inboxintel-ai
    ```

2.  **Install Dependencies:**
    ```bash
    # Install frontend dependencies
    npm install

    # Install backend dependencies
    cd backend
    npm install
    cd ..
    ```

3.  **Configure Environment Variables:**

    *   **Frontend:** Create `.env.local` in the root directory:
        ```env
        VITE_GEMINI_API_KEY=your_gemini_api_key
        VITE_API_URL=http://localhost:3000
        ```

    *   **Backend:** Create `.env` in the `backend` directory:
        ```env
        PORT=3000
        MONGO_URI=your_mongodb_connection_string
        GOOGLE_CLIENT_ID=your_google_client_id
        GOOGLE_CLIENT_SECRET=your_google_client_secret
        BASE_URL=http://localhost:3000
        FRONTEND_URL=http://localhost:5173
        ```

4.  **Start the Application:**

    *   **Start Backend:**
        ```bash
        cd backend
        npm run dev
        ```

    *   **Start Frontend:** (Open a new terminal)
        ```bash
        npm run dev
        ```

5.  Open [http://localhost:5173](http://localhost:5173) in your browser.

## ☁️ Deployment

This project includes a `render.yaml` blueprint for easy deployment on Render.

1.  Push your code to GitHub.
2.  Create a new Blueprint on Render and connect your repository.
3.  Fill in the required environment variables (`MONGO_URI`, `GOOGLE_CLIENT_ID`, etc.).
4.  Update your Google Cloud Console "Authorized Redirect URIs" with your new Render backend URL.
