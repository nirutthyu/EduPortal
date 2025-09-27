import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home"; // Ensure the correct capitalization
import Login from "./components/login"; // Ensure the correct capitalization
import Signup from "./components/Signup"; // Ensure the correct capitalization
import VideoPage from "./components/courses/VideoPage";
import VideoDetailPage from "./components/courses/VideoDetailPage"
import CourseForm from "./components/courses/CourseForm.jsx"
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/courses/:id" element={<VideoPage />} />
        <Route path="/course/:title/form" element={<CourseForm />} />
        <Route path="/course/:title/videos" element={<VideoPage />} />
        <Route path="/video-detail" element={<VideoDetailPage />} />
      </Routes>
    </Router>
  );
};

export default App;
