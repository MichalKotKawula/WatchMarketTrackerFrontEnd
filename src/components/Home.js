import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chart from './Chart';

const Home = () => {
  const [linkInput, setLinkInput] = useState('');
  const [watchDetails, setWatchDetails] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [brandInput, setBrandInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [brandModelWatches, setBrandModelWatches] = useState([]);
  const [averagePriceBrandModel, setAveragePriceBrandModel] = useState('');
  const [chartData, setChartData] = useState([]);
  const [chartXData, setChartXData] = useState([]);
  const [predictedChartData, setPredictedChartData] = useState([]);
  const [predictedChartXData, setPredictedChartXData] = useState([]);
  const [predictionMethod, setPredictionMethod] = useState('linear');
  const [degree, setDegree] = useState(2);
  const [percentageChange, setPercentageChange] = useState('');
  const [isPositiveChange, setIsPositiveChange] = useState(null);

  const fetchPredictions = async (prices) => {
    try {
      const response = await axios.post('https://watchdetailsbackend.netlify.app/.netlify/functions/server/predictPrices', 
      { 
        prices, 
        method: predictionMethod, 
        degree 
      }, 
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }
  };

  const loadPredictions = async (watches) => {
    const prices = watches.map(watch => ({
      ds: new Date(watch.creationDate).toISOString().split('T')[0], // Convert to ISO date string
      y: parseFloat(watch.price_formated) // Ensure price is a float
    }));
    console.log('Prepared prices data for prediction:', prices);
    const predictions = await fetchPredictions(prices);
    setPredictedChartData([['Price', ...predictions.map(pred => pred.yhat)]]);
    setPredictedChartXData(predictions.map(pred => pred.ds));
  };

  const fetchWatchDetails = async (link) => {
    try {
      const response = await axios.get(`https://watchdetailsbackend.netlify.app/.netlify/functions/server/getWatchDetails`, 
      {
        params: { link: encodeURIComponent(link) },
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      if (response.data.price_formated && !isNaN(response.data.price_formated)) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching watch details:', error);
      return null;
    }
  };

  const loadWatchDetails = async () => {
    const links = linkInput.split('\n').filter(link => link.trim() !== '');
    const details = [];
    for (const link of links) {
      const data = await fetchWatchDetails(link);
      if (data) {
        details.push(data);
      }
    }
    setWatchDetails(details);
  };

  const fetchWatchesByBrandAndModel = async (brand, model) => {
    try {
      const response = await axios.get(`https://watchdetailsbackend.netlify.app/.netlify/functions/server/getWatchesByBrandAndModel`, 
      {
        params: { brand: encodeURIComponent(brand), model: encodeURIComponent(model) },
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching watches:', error);
      return [];
    }
  };

  const loadBrandModelWatches = async () => {
    const watches = await fetchWatchesByBrandAndModel(brandInput, modelInput);
    setBrandModelWatches(watches);
    const prices = watches.map(watch => parseFloat(watch.price_formated));
    const dates = watches.map(watch => new Date(watch.creationDate).toISOString().split('T')[0]); // Ensure date is in ISO format
    const avgPrice = prices.reduce((acc, curr) => acc + curr, 0) / prices.length;
    setAveragePriceBrandModel(`Average Price: ${avgPrice.toFixed(2)}`);

    setChartData([['Price', ...prices]]);
    setChartXData(dates);

    calculatePercentageChange(prices, dates);

    // Call predictions after loading watch details by brand and model
    loadPredictions(watches);
  };

  const saveWatchDetails = async () => {
    const creationDate = new Date().getTime(); // Get current date and time in milliseconds
    const updatedDetails = watchDetails.map(detail => ({ ...detail, creationDate }));

    try {
      for (const watchData of updatedDetails) {
        await axios.post('https://watchdetailsbackend.netlify.app/.netlify/functions/server/sendWatchDetails', watchData, 
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });
      }
      alert('All watch details saved successfully!');
    } catch (error) {
      console.error('Failed to save watch data', error);
      alert('Failed to save some or all watch details.');
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    const response = await axios.post('https://watchdetailsbackend.netlify.app/.netlify/functions/server/api/message', { message: userInput },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
    setChatMessages([...chatMessages, { sender: 'user', text: userInput }, { sender: 'ai', text: response.data.response }]);
    setUserInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const calculatePercentageChange = (prices, dates) => {
    const filteredPrices = prices.filter(price => price > 1);
    if (filteredPrices.length > 1) {
      const oldestPrice = filteredPrices[0];
      const newestPrice = filteredPrices[filteredPrices.length - 1];
      const percentageChange = ((newestPrice - oldestPrice) / oldestPrice) * 100;
      setPercentageChange(`Percentage Change: ${percentageChange.toFixed(2)}%`);
      setIsPositiveChange(percentageChange > 0);
    } else {
      setPercentageChange('Not enough data for percentage change calculation.');
      setIsPositiveChange(null);
    }
  };

  useEffect(() => {
    // Fetch data or perform any setup logic here if needed
  }, []);

  return (
    <div className="container">
      <h1>Watch Details</h1>
      <div className="mb-3">
        <textarea
          className="form-control"
          value={linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          placeholder="Enter Watch Links Here, each link on a new line"
        ></textarea>
      </div>
      <div className="mb-3">
        <button className="btn btn-primary" onClick={loadWatchDetails}>Load Watch Details</button>
        {watchDetails.length > 0 && (
          <>
            <button className="btn btn-primary ml-2" onClick={saveWatchDetails}>Save Watch Details</button>
          </>
        )}
      </div>
      <div id="watchDetails" className="mb-4">
        {watchDetails.map((detail, index) => (
          <div key={index} className="p-2 border-bottom">
            <p>Price: {detail.price_formated}</p>
          </div>
        ))}
      </div>
      <h2>Watch Recommendation Chatbot</h2>
      <div id="chatContainer" className="chatbox">
        {chatMessages.map((msg, index) => (
          <div key={index} className={msg.sender === 'user' ? 'text-right' : 'text-left'}>
            <div className={msg.sender === 'user' ? 'alert alert-primary' : 'alert alert-secondary'}>{msg.text}</div>
          </div>
        ))}
      </div>
      <div className="input-group chat-input">
        <textarea
          className="form-control"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe your preferences..."
        ></textarea>
        <button className="btn send-button" onClick={sendMessage}></button>
      </div>
      <div className="form-group">
        <h2>Filter Watches</h2>
        <label htmlFor="brandInput">Brand:</label>
        <select id="brandInput" className="form-control" value={brandInput} onChange={(e) => setBrandInput(e.target.value)}>
          <option value="">Select a Brand</option>
          <option value="Rolex">Rolex</option>
          <option value="IWC">IWC</option>
          <option value="Omega">Omega</option>
          <option value="Breitling">Breitling</option>
          <option value="Panerai">Panerai</option>
          <option value="TAG Heuer">TAG Heuer</option>
          <option value="Zenith">Zenith</option>
          <option value="Audemars Piguet">Audemars Piguet</option>
          <option value="Cartier">Cartier</option>
          <option value="Patek Philippe">Patek Philippe</option>
          <option value="Jager-LeCoultre">Jager-LeCoultre</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="modelInput">Model:</label>
        <input
          type="text"
          id="modelInput"
          className="form-control"
          value={modelInput}
          onChange={(e) => setModelInput(e.target.value)}
          placeholder="Enter Watch Model e.g. gmt"
        />
      </div>
      <div className="form-group">
        <label htmlFor="predictionMethod">Prediction Method:</label>
        <select id="predictionMethod" className="form-control" value={predictionMethod} onChange={(e) => setPredictionMethod(e.target.value)}>
          <option value="linear">Linear</option>
          <option value="logarithmic">Logarithmic</option>
          <option value="exponential">Exponential</option>
          <option value="polynomial">Polynomial</option>
        </select>
      </div>
      {predictionMethod === 'polynomial' && (
        <div className="form-group">
          <label htmlFor="polynomialDegree">Polynomial Degree:</label>
          <input
            type="number"
            id="polynomialDegree"
            className="form-control"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            placeholder="Enter Polynomial Degree"
          />
        </div>
      )}
      <button className="btn btn-primary mb-3" onClick={loadBrandModelWatches}>Load Watches by Brand and Model</button>
      <div id="brandModelWatches" className="mb-4">
        {brandModelWatches.map((watch, index) => (
          <div key={index} className="p-2 border-bottom">
              <p>Brand: {watch.brand}, Model: {watch.model}, Price: {watch.price_formated}</p>
          </div>
        ))}
      </div>
      <div id="averagePriceBrandModel" className="mb-4">
        {averagePriceBrandModel}
        <br />
        {percentageChange} 
        {isPositiveChange !== null && (
          <span>
            {isPositiveChange ? (
              <svg height="10" width="10">
                <polygon points="0,10 5,0 10,10" style={{ fill: 'green' }} />
              </svg>
            ) : (
              <svg height="10" width="10">
                <polygon points="0,0 5,10 10,0" style={{ fill: 'red' }} />
              </svg>
            )}
          </span>
        )}
      </div>

      {chartData.length > 0 && chartXData.length > 0 && (
        <>
          <h3>Historical Pricing</h3>
          <Chart 
            data={chartData} 
            xData={chartXData}
            bindto="#brandModelChart" 
            type="scatter"
            xType="timeseries"
            axisX={{
              type: 'timeseries',
              tick: {
                format: '%Y-%m-%d',
                rotate: 75,
                multiline: false
              },
              height: 130
            }}
            axisY={{
              label: 'Price'
            }}
          />
        </>
      )}
      {predictedChartData.length > 0 && predictedChartXData.length > 0 && (
        <>
          <h3>{predictionMethod.charAt(0).toUpperCase() + predictionMethod.slice(1)} Prediction</h3>
          <Chart 
            data={predictedChartData} 
            xData={predictedChartXData}
            bindto="#predictedChart" 
            type="scatter"
            xType="timeseries"
            axisX={{
              type: 'timeseries',
              tick: {
                format: '%Y-%m-%d',
                rotate: 75,
                multiline: false
              },
              height: 130
            }}
            axisY={{
              label: 'Predicted Price'
            }}
          />
        </>
      )}
    </div>
  );
};

export default Home;
