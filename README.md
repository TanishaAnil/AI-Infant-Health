# NurtureAI - Agentic Infant Health Monitor

An intelligent, agentic health monitoring interface for infants that tracks vitals, sleep, and feeding, providing real-time AI insights and pediatric guidance using the Gemini API.

## Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd nurture-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    *   Create a file named `.env` in the root directory.
    *   Add your Google Gemini API Key:
        ```env
        API_KEY=your_actual_api_key_here
        ```
    *   *Note: Never commit `.env` to GitHub.*

4.  **Run the application:**
    ```bash
    npm run dev
    ```

## Tech Stack
*   React 18 + Vite
*   TailwindCSS
*   Google GenAI SDK
*   Lucide React (Icons)
*   Recharts (Data Visualization)
