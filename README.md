# StockSage

This repository contains the StockSage web application, consisting of a FastAPI backend and a React.js frontend.

## Local Development Setup

Follow these steps to set up and run the StockSage application on your local machine.

### Prerequisites

*   Python 3.9+
*   Node.js (LTS recommended)
*   npm (comes with Node.js) or yarn
*   A Google Cloud Project with the Gemini API enabled.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/StockSage.git
cd StockSage
```

### 2. Backend Setup (FastAPI)

The backend provides APIs for fetching stock data, news, and performing sentiment analysis.

#### Navigate to the backend directory:

```bash
cd webapp/backend
```

#### Create a Python Virtual Environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
```

#### Install Dependencies:

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables:

Create a `.env` file in the `webapp/backend` directory with the following content:

```
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
NEWS_API_KEY="YOUR_NEWS_API_KEY"
```

Replace `"YOUR_GEMINI_API_KEY"` with your actual Gemini API key.

#### Run the Backend:

```bash
uvicorn main:app --reload
```

The backend server will typically run on `http://127.0.0.1:8000`.

### 3. Frontend Setup (React.js)

The frontend is a React application that interacts with the backend.

#### Navigate to the frontend directory:

```bash
cd ../frontend
```

#### Install Dependencies:

```bash
npm install
# or
# yarn install
```

#### Configure Environment Variables:

Create a `.env` file in the `webapp/frontend` directory with the following content:

```
VITE_API_BASE_URL="http://127.0.0.1:8000"
```

This points the frontend to your local backend instance.

#### Run the Frontend:

```bash
npm run dev
# or
# yarn dev
```

The frontend development server will typically run on `http://localhost:5173` (or another available port).

### 4. Access the Application

Once both the backend and frontend servers are running, open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`) to access the StockSage application.

---

**Note:** For production deployments, consider using more robust environment variable management, securing API keys, and configuring a proper web server (e.g., Nginx, Gunicorn) for the backend.# Stock-Sage
