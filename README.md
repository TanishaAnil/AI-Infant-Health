# NurtureAI - Agentic Infant Health Monitor

An intelligent, agentic health monitoring interface for infants that tracks vitals, sleep, and feeding, providing real-time AI insights and pediatric guidance using the Gemini API.

## 🚀 Quick Setup (VS Code)

1.  **Install Dependencies:** (Fixes 'vite is not recognized' error)
    ```bash
    npm install
    ```

2.  **Configure API Key:**
    *   Create a file named `.env` in the root folder.
    *   Add your key: `API_KEY=AIzaSy...`

3.  **Run Locally:**
    ```bash
    npm run dev
    ```
    Open the link shown in the terminal (usually `http://localhost:5173`).

## 🛠️ Tech Stack
*   React 18 + Vite
*   TailwindCSS
*   Google GenAI SDK (Gemini 2.5 Flash)
*   Lucide React (Icons)
*   Recharts (Data Visualization)

## ⚠️ Troubleshooting
*   **'vite' is not recognized:** You skipped step 1. Run `npm install`.
*   **API Key Error:** Ensure your `.env` file is named exactly `.env` and is in the root directory (not inside `src` or `components`).
