import React from "react";
import "../styles/LoadingScreen.css";
import logoSpinner from "../styles/images/spinner.png"; 

const LoadingScreen = () => {
  return (
    <div className="loading-container">
      <img src={logoSpinner} alt="Loading..." className="loading-spinner" />
      <p>Loading...</p>
    </div>
  );
};

export default LoadingScreen;
