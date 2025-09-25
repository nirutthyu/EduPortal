import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home"; // Ensure the correct capitalization
import Login from "./components/login"; // Ensure the correct capitalization
import Signup from "./components/Signup"; // Ensure the correct capitalization
import VideoPage from "./components/courses/VideoPage";
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/courses/:id" element={<VideoPage />} />
      </Routes>
    </Router>
  );
};

export default App;
