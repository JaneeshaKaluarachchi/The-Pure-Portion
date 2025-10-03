import React from "react";
import "../styles/LoadingScreen.css";
import logoSpinner from "../styles/images/0845c232253239.56766f2d063c9.gif"; 

const LoadingScreen = () => {
  return (
    <div className="loading-container">
      <img src={logoSpinner} alt="Loading..." className="loading-spinner" />
      <p>Loading...</p>
    </div>
  );
};

export default LoadingScreen;
