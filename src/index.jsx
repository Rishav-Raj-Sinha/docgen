import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // Import the main App component

// Create the root element and render the App component into the HTML
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
