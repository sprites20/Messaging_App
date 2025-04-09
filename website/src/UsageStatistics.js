import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const UsageStatistics = () => {
  const [data, setData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/get-usage-statistics");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Define colors for different models
  const modelColors = {
    "gpt-3.5-turbo": "rgba(75, 192, 192, 1)",
    "gpt-4": "rgba(255, 99, 132, 1)",
    "gpt-4-turbo": "rgba(54, 162, 235, 1)"
  };

  // Process data for Chart.js
  const labels = [];
  const datasets = [];

  Object.entries(data).forEach(([model, values]) => {
    if (values.length === 0) return;

    // Convert timestamps to readable format
    const modelLabels = values.map((item) => new Date(item.timestamp).toLocaleString());
    
    // Store labels for the x-axis (use first model's labels)
    if (labels.length === 0) {
      labels.push(...modelLabels);
    }

    datasets.push({
      label: model,
      data: values.map((item) => item.total_tokens),
      borderColor: modelColors[model] || "rgba(0, 0, 0, 1)", // Default black
      backgroundColor: modelColors[model]?.replace("1)", "0.2)") || "rgba(0, 0, 0, 0.2)", // Transparent variant
      fill: true,
    });
  });

  const chartData = { labels, datasets };

  return (
    <div>
      <h2>Usage Statistics</h2>
      <p>Token usage statistics for different models.</p>
      {datasets.length > 0 ? (
        <Line data={chartData} />
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
};

export default UsageStatistics;
