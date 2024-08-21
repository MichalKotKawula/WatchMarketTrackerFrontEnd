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
  const [isChatVisible, setIsChatVisible] = useState(true);
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
  const [brandData, setBrandData] = useState({});
  const [brands] = useState([
    'Rolex',
    'IWC',
    'Omega',
    'Breitling',
    'Panerai',
    'TAG Heuer',
    'Zenith',
    'Audemars Piguet',
    'Cartier',
    'Patek Philippe',
    'Jaeger-LeCoultre'
  ]);

  const toggleChatVisibility = () => {
    setIsChatVisible(!isChatVisible);
  };

  useEffect(() => {
    const fetchBrandData = async (brand) => {
      try {
        const response = await axios.get(`https://watchdetailsbackend.netlify.app/.netlify/functions/server/getBrandWatchData`, {
          params: { brand },
        });
        return response.data;
      } catch (error) {
        console.error(`Error fetching data for brand ${brand}:`, error);
        return [];
      }
    };

    const loadAllBrandData = async () => {
      const data = {};
      for (const brand of brands) {
        const brandData = await fetchBrandData(brand);

        const filteredData = brandData.filter(watch => {
          const date = new Date(watch.creationDate);
          return !isNaN(date); 
        });

        const prices = filteredData.map(watch => parseFloat(watch.price_formated));
        const dates = filteredData.map(watch => {
          const date = new Date(watch.creationDate);
          return date.toISOString().split('T')[0];
        });

        data[brand] = { prices, dates };
      }
      setBrandData(data);
    };

    loadAllBrandData();
  }, [brands]);

  const sanitizeBrandName = (brand) => brand.replace(/\s+/g, '-'); 

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
      ds: new Date(watch.creationDate).toISOString().split('T')[0],
      y: parseFloat(watch.price_formated) 
    }));
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
    const dates = watches.map(watch => new Date(watch.creationDate).toISOString().split('T')[0]); 
    const avgPrice = prices.reduce((acc, curr) => acc + curr, 0) / prices.length;
    setAveragePriceBrandModel(`Average Price: ${avgPrice.toFixed(2)}`);

    setChartData([['Price', ...prices]]);
    setChartXData(dates);

    calculatePercentageChange(prices, dates);

    loadPredictions(watches);
  };

  const saveWatchDetails = async () => {
    const creationDate = new Date().getTime(); 
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



<div id="brandDataCharts" className="row">
        {brands.map((brand, index) => (
          <div key={index} className="col-md-4 mb-4">
            <h3>{brand}</h3>
            {brandData[brand] && brandData[brand].prices.length > 0 ? (
              <Chart
                data={[['Price', ...brandData[brand].prices]]}
                xData={brandData[brand].dates}
                bindto={`#${sanitizeBrandName(brand)}-chart`}
                type="line"
                xType="timeseries"
                axisX={{
                  type: 'timeseries',
                  tick: {
                    format: '%Y-%m-%d',
                    rotate: 75,
                    multiline: false,
                  },
                  height: 130,
                }}
                axisY={{
                  label: 'Price',
                }}
              />
            ) : (
              <p>No data available for {brand}</p>
            )}
          </div>
        ))}
      </div>







      {/* <h1>Watch Details</h1>
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
      </div> */}
    <div className="container">
      <div id="chatContainer" className={isChatVisible ? '' : 'minimized'}>
        <div className="chat-title-bar">
          <h2>Watch Chatbot</h2>
          <button className="toggle-icon" onClick={toggleChatVisibility}>
            {isChatVisible ? '-' : '+'}
          </button>
        </div>
        {isChatVisible && (
          <>
            <div className="chatbox">
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
          </>
        )}
      </div>

      {/* Other components and sections of the Home page can go here */}
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
