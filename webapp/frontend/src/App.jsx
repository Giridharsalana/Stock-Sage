import axios from 'axios';
import { Line } from 'react-chartjs-2';
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import './App.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Tooltip,
  Legend,
  Filler
);

function App() {
  const [ticker, setTicker] = useState("");
  const [priceData, setPriceData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set the browser tab title
  useEffect(() => {
    document.title = 'StockSage';
  }, []);

  const fetchAll = async () => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    try {
      const [priceRes, predictionRes] = await Promise.all([
        axios.get(`/price-data?ticker=${ticker}`),
        axios.get(`/predict?ticker=${ticker}`)
      ]);
      setPriceData(priceRes.data);
      setPrediction(predictionRes.data);
    } catch (err) {
      setError(err.message || 'Error fetching data');
    }
    setLoading(false);
  };

  const chartData = {
    labels: priceData.slice(-30).map(row => row.Date ? row.Date.slice(0, 10) : ''),
    datasets: [
      {
        label: 'Close Price',
        data: priceData.slice(-30).map(row => row.Close),
        borderColor: '#4f8cff',
        backgroundColor: 'rgba(79,140,255,0.2)',
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem) {
            return `${tooltipItem.dataset.label}: $${tooltipItem.raw.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'MMM d', // <-- fix here
          displayFormats: {
            day: 'MMM d', // <-- fix here
          },
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return `$${value}`;
          },
        },
      },
    },
  };

  // Handler for Enter key in ticker input
  const handleTickerKeyDown = (e) => {
    if (e.key === 'Enter' && ticker) {
      fetchAll();
    }
  };

  // Use sentiment from prediction if available
  const sentiment = prediction && prediction.sentiment ? prediction : null;

  return (
    <div style={{ fontFamily: 'Segoe UI, Arial, sans-serif', background: 'linear-gradient(135deg, #232526, #414345)', minHeight: '100vh', color: '#fff', margin: 0, padding: 0, width: '100vw', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ width: '100%', margin: 0, background: 'rgba(0,0,0,0.7)', borderRadius: 0, padding: '32px 0', boxShadow: 'none', minHeight: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 1400, minWidth: 320 }}>
          <h1 style={{ textAlign: 'center', letterSpacing: 2, fontSize: 40, marginBottom: 32, fontWeight: 700, color: '#4f8cff', textShadow: '0 2px 16px #0008' }}>StockSage</h1>
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, justifyContent: 'center', alignItems: 'center' }}>
            <input
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              onKeyDown={handleTickerKeyDown}
              style={{ fontSize: 22, padding: 12, borderRadius: 12, border: 'none', width: 300, background: '#222', color: '#fff', outline: 'none', boxShadow: '0 2px 8px #0004' }}
              placeholder="Enter Ticker (e.g. MRVL)"
            />
            <button onClick={fetchAll} style={{ fontSize: 22, padding: '12px 32px', borderRadius: 12, border: 'none', background: '#4f8cff', color: '#fff', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 8px #0004' }} disabled={!ticker}>Search</button>
          </div>
          {(!ticker || loading) && <div style={{ textAlign: 'center', fontSize: 20 }}>{loading ? 'Loading...' : 'Please enter a ticker to search.'}</div>}
          {error && <div style={{ color: 'red', textAlign: 'center', fontSize: 18 }}>{error}</div>}
          {/* Only show 'No data found' if a search was actually performed */}
          {ticker && !loading && !error && priceData.length === 0 && (prediction || (prediction && prediction.news_scores && prediction.news_scores.length > 0)) && (
            <div style={{ textAlign: 'center', color: '#ccc', fontSize: 18 }}>No data found for ticker: {ticker}</div>
          )}
          {priceData.length > 0 && (
            <div style={{
              marginBottom: 40,
              maxWidth: 1200,
              marginLeft: 'auto',
              marginRight: 'auto',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
            }}>
              <h2 style={{ fontSize: 28, marginBottom: 16, color: '#fff', width: '100%', textAlign: 'center' }}>Price Chart</h2>
              <div style={{ background: '#222', width: '100%' }}>
                <div style={{ padding: '20px 24px' }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>
          )}
          {/* Sentiment & Prediction Row */}
          {prediction && (
            <div style={{
              display: 'flex',
              gap: 32,
              justifyContent: 'center',
              alignItems: 'stretch',
              marginBottom: 32,
              flexWrap: 'wrap',
              maxWidth: 1200,
              marginLeft: 'auto',
              marginRight: 'auto',
              width: '100%',
            }}>
              {/* Sentiment Card */}
              {prediction.sentiment && (
                <div style={{ flex: 1, minWidth: 0, background: '#232526', borderRadius: 12, padding: 24, margin: 0, boxShadow: '0 2px 8px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <h2 style={{ margin: 0, marginBottom: 12 }}>Sentiment</h2>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: prediction.sentiment === 'positive' ? '#4caf50' : prediction.sentiment === 'negative' ? '#ff5252' : '#ffc107', marginBottom: 0 }}>
                    {prediction.sentiment}
                  </div>
                </div>
              )}
              {/* Prediction Card */}
              {prediction && (
                <div style={{ flex: 1, minWidth: 0, background: '#232526', borderRadius: 12, padding: 24, margin: 0, boxShadow: '0 2px 8px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <h2 style={{ margin: 0, marginBottom: 12 }}>Prediction</h2>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: prediction.prediction === 'up' ? '#4caf50' : '#ff5252', marginBottom: 8 }}>
                    {prediction.prediction}
                  </div>
                  <div style={{ color: '#ccc', marginTop: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Short MA
                    <span title="Short-term Moving Average (5 days)
A quick trend indicator.
If above Long MA, trend is bullish." style={{ cursor: 'help', color: '#ffc107', fontSize: 18, lineHeight: 1 }}>
                      &#9432;
                    </span>
                    : {prediction.short_ma && prediction.short_ma.toFixed ? prediction.short_ma.toFixed(2) : prediction.short_ma}
                  </div>
                  <div style={{ color: '#ccc', fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Long MA
                    <span title="Long-term Moving Average (20 days)
A slower trend indicator.
If above Short MA, trend is bearish." style={{ cursor: 'help', color: '#ffc107', fontSize: 18, lineHeight: 1 }}>
                      &#9432;
                    </span>
                    : {prediction.long_ma && prediction.long_ma.toFixed ? prediction.long_ma.toFixed(2) : prediction.long_ma}
                  </div>
                  <div style={{ color: '#ccc', fontSize: 16 }}>
                    Last Price: {prediction.last_price && prediction.last_price.toFixed ? prediction.last_price.toFixed(2) : prediction.last_price}
                  </div>
                </div>
              )}
              {/* Average News Score Card */}
              {prediction && typeof prediction.avg_news_score !== 'undefined' && (
                <div style={{ flex: 1, minWidth: 0, background: '#232526', borderRadius: 12, padding: 24, margin: 0, boxShadow: '0 2px 8px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <h2 style={{ margin: 0, marginBottom: 12 }}>Average News Score</h2>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ffc107' }}>
                    {prediction.avg_news_score && prediction.avg_news_score.toFixed ? prediction.avg_news_score.toFixed(2) : prediction.avg_news_score}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* News Section */}
          {prediction && prediction.news_scores && prediction.news_scores.length > 0 && (
            <div style={{ marginBottom: 32, maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' }}>
              <h2>Latest News</h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {prediction.news_scores.map((n, i) => {
                  let scoreColor = '#ffc107';
                  if (n.score > 1) scoreColor = '#4caf50';
                  else if (n.score < -1) scoreColor = '#ff5252';
                  return (
                    <li
                      key={i}
                      style={{
                        marginBottom: 12,
                        background: '#222',
                        borderRadius: 8,
                        padding: 12,
                        borderLeft: `8px solid ${scoreColor}`,
                        borderRight: `8px solid ${scoreColor}`
                      }}
                    >
                      {n.url ? (
                        <a
                          href={n.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#4f8cff', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          {n.title}
                        </a>
                      ) : (
                        <span style={{ color: '#4f8cff', fontWeight: 'bold', textDecoration: 'none' }}>{n.title}</span>
                      )}
                      {n.summary && <div style={{ color: '#ccc', marginTop: 4 }}>{n.summary}</div>}
                      <div style={{ color: scoreColor, fontWeight: 500, marginTop: 4 }}>Score: {n.score}</div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
