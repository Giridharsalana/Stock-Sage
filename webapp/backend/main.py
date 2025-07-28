import os
import json
import httpx
import dotenv
import typing
import pandas
import yfinance
import fastapi
import pydantic
import google.genai
import fastapi.middleware.cors


app = fastapi.FastAPI()

# Allow CORS for frontend
app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dotenv.load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

@app.get("/", response_class=fastapi.responses.HTMLResponse)
def root():
    return """
    <html>
    <head>
        <title>StockSage</title>
        <style>
            body {
                background: linear-gradient(135deg, #232526, #414345);
                height: 100vh;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            .center {
                color: #fff;
                background: rgba(0,0,0,0.5);
                padding: 40px 60px;
                border-radius: 20px;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                font-size: 2rem;
                text-align: center;
                letter-spacing: 2px;
                animation: fadeIn 1.2s;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
        </style>
    </head>
    <body>
        <div class="center">
            🚀 StockSage backend server is <b>up and running</b>! 🚀
        </div>
    </body>
    </html>
    """

@app.get("/price-data")
def get_price_data(ticker: str = fastapi.Query(...)):
    data = yfinance.Ticker(ticker)
    hist = data.history(period="6mo")
    return hist.reset_index().to_dict(orient="records")

@app.get("/predict")
def predict(ticker: str = fastapi.Query(...)):
    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY not set in environment."}
    if not NEWS_API_KEY:
        return {"error": "NEWS_API_KEY not set in environment."}
    # Fetch news
    news_url = "https://newsapi.org/v2/everything"
    news_params = {
        "q": ticker,
        "sortBy": "publishedAt",
        "language": "en",
        "apiKey": NEWS_API_KEY,
        "pageSize": 5
    }
    try:
        with httpx.Client() as client:
            news_resp = client.get(news_url, params=news_params)
            if news_resp.status_code != 200:
                return {"error": "Failed to fetch news."}
            news_data = news_resp.json()
            articles = news_data.get("articles", [])
            news_items = [
                {"title": a["title"], "summary": a["description"], "url": a["url"]} for a in articles if a.get("title")
            ]
    except Exception as e:
        return {"error": "Exception fetching news."}

    # Fetch price data
    try:
        data = yfinance.Ticker(ticker)
        hist = data.history(period="6mo")
        price_text = ""
        if not hist.empty and "Close" in hist:
            close = hist["Close"]
            price_text = "Last 10 closing prices: " + ", ".join([f"{v:.2f}" for v in close.tail(10)])
            short_ma = close.rolling(window=5).mean()
            long_ma = close.rolling(window=20).mean()
            last_price = close.iloc[-1]
        else:
            return {"error": "No price data available for prediction."}
    except Exception as e:
        return {"error": "Exception fetching price data."}

    # LLM: Score news and get sentiment in one call
    news_scores = []
    sentiment = "unknown"

    try:
        client = google.genai.Client(api_key=GEMINI_API_KEY)
        model_name = "models/gemini-2.5-flash"
        # Prompt for both news scoring and sentiment
        prompt = (
            f"Given the following news headlines and summaries for the stock ticker '{ticker}', "
            "rate the impact of each article on the stock price on a scale from -10 (very negative) to +10 (very positive) as a list of NewsScore objects. "
            "Then, based on the news and the following price data, provide the overall sentiment (positive, negative, or neutral) for the stock as a string field named 'sentiment'.\n\n"
        )
        for idx, item in enumerate(news_items):
            prompt += f"Article {idx+1}:\nTitle: {item['title']}\nSummary: {item['summary']}\nURL: {item['url']}\n"
        prompt += f"\n{price_text}"
        # Ask Gemini for structured output
        generate_content_config = google.genai.types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=google.genai.types.Schema(
                type=google.genai.types.Type.OBJECT,
                required=["news_scores", "sentiment"],
                properties={
                    "news_scores": google.genai.types.Schema(
                        type=google.genai.types.Type.ARRAY,
                        items=google.genai.types.Schema(
                            type=google.genai.types.Type.OBJECT,
                            required=["title", "summary", "score", "url"],
                            properties={
                                "title": google.genai.types.Schema(type=google.genai.types.Type.STRING),
                                "summary": google.genai.types.Schema(type=google.genai.types.Type.STRING),
                                "score": google.genai.types.Schema(type=google.genai.types.Type.NUMBER),
                                "url": google.genai.types.Schema(type=google.genai.types.Type.STRING),
                            },
                        ),
                    ),
                    "sentiment": google.genai.types.Schema(type=google.genai.types.Type.STRING),
                },
            ),
        )
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=generate_content_config,
        )
    except Exception as e:
        return {"error": f"Exception during LLM processing: {str(e)}"}

    json_data = json.loads(response.text)
    def last_float(val):
        try:
            return float(val.iloc[-1]) if hasattr(val, 'iloc') else float(val)
        except Exception:
            return None

    return {
        "ticker": ticker,
        "news_scores": json_data.get("news_scores", []),
        "sentiment": json_data.get("sentiment", "unknown"),
        "price_text": price_text,
        "short_ma": last_float(short_ma) if 'short_ma' in locals() else None,
        "long_ma": last_float(long_ma) if 'long_ma' in locals() else None,
        "last_price": float(last_price) if 'last_price' in locals() else None,
    }
