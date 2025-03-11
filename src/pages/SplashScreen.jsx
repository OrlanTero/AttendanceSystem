import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // After 2 seconds, navigate to the login page
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      <div className="splash-logo">
        <img src={logo} alt="Logo" className="splash-logo-image" />
      </div>
      <h1 className="splash-title">Attendance Management System</h1>
      <p className="splash-subtitle">Loading...</p>
    </div>
  );
};

export default SplashScreen;
