# StockSage Web App Backend

This backend uses FastAPI to provide endpoints for:
- Fetching historical share price data for a given ticker
- Collecting news headlines about the ticker
- Performing sentiment analysis using Gemini API
- Providing data for frontend visualization and prediction

## Setup
- Python 3.9+
- Install dependencies: `pip install -r requirements.txt`

## Run
- `uvicorn main:app --reload`
