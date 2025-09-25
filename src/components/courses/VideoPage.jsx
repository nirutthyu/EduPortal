import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const VideoPage = () => {
  const location = useLocation();
  const serviceTitle = location.state?.title || "Course";

  const [showForm, setShowForm] = useState(true);
  const [formData, setFormData] = useState({
    age: "",
    duration: "",
    pace: "",
    level: "",
    experience: "",
    summaryType: "",
    goal: "",
    subject: serviceTitle,
  });
  const [roadmap, setRoadmap] = useState(null);
  const [videos, setVideos] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [unlockedVideos, setUnlockedVideos] = useState({});
  const [summary, setSummary] = useState(""); // store summary
  const [loadingSummary, setLoadingSummary] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:5000/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok) {
        setRoadmap(result.roadmap);
        setVideos(result.videos);
        setShowForm(false);
        setUnlockedVideos({ [`0-0`]: true });
      } else {
        console.error("Error generating roadmap:", result.error);
      }
    } catch (err) {
      console.error("Network error:", err);
    }
  };

  const handleNextVideo = () => {
    let nextVideo = currentVideo + 1;
    let nextWeek = currentWeek;

    if (nextVideo >= videos[currentWeek][`Week ${currentWeek + 1}`].length) {
      nextWeek += 1;
      nextVideo = 0;
    }

    if (videos[nextWeek]) {
      setCurrentWeek(nextWeek);
      setCurrentVideo(nextVideo);
      setUnlockedVideos((prev) => ({ ...prev, [`${nextWeek}-${nextVideo}`]: true }));
      setSummary(""); // reset summary when moving to next video
    }
  };

  const handleSummarize = async () => {
    const topic = videos[currentWeek][`Week ${currentWeek + 1}`][currentVideo];
    const videoId = topic.video.split("v=")[1]?.split("&")[0];
    setLoadingSummary(true);

    try {
      const res = await fetch(`http://127.0.0.1:5000/summarize/${videoId}`);
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
      } else {
        console.error("Error fetching summary:", data.error);
      }
    } catch (err) {
      console.error("Network error:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">Tell Us About Yourself - {serviceTitle}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form Fields */}
          {["age", "duration", "pace", "level", "experience", "summaryType", "goal"].map((field) => (
            <div key={field}>
              <label className="block font-medium text-gray-700 mb-1">{field}</label>
              {field === "goal" ? (
                <textarea
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  rows="4"
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
                  required
                />
              ) : field === "pace" || field === "level" ? (
                <select
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
                  required
                >
                  <option value="">Select {field}</option>
                  {field === "pace" ? (
                    <>
                      <option value="fast">Fast Learner</option>
                      <option value="slow">Slow Learner</option>
                    </>
                  ) : (
                    <>
                      <option value="average">Average</option>
                      <option value="topper">Topper</option>
                    </>
                  )}
                </select>
              ) : (
                <input
                  type={field === "age" ? "number" : "text"}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
                  required
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Generate Roadmap
          </button>
        </form>
      </div>
    );
  }

  const weekName = Object.keys(videos[currentWeek])[0];
  const topic = videos[currentWeek][weekName][currentVideo];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Your Personalized Roadmap - {serviceTitle}</h2>

      {roadmap && <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap">{roadmap}</pre>}

      <div className="bg-white shadow-lg rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-2">{weekName}</h3>
        <h4 className="text-lg font-medium mb-4">{topic.topic}</h4>
        <div className="aspect-w-16 aspect-h-9 mb-4">
          <iframe
            src={topic.video.replace("watch?v=", "embed/")}
            title={topic.topic}
            allowFullScreen
            className="w-full h-96 rounded-lg"
          ></iframe>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={handleSummarize}
            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
          >
            {loadingSummary ? "Loading..." : "Summarize"}
          </button>
          <a
            href="http://127.0.0.1:5000/"
            target="_blank"
            className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600"
          >
            Quiz
          </a>
          <button
            onClick={handleNextVideo}
            disabled={!unlockedVideos[`${currentWeek}-${currentVideo}`]}
            className={`ml-auto bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 ${
              !unlockedVideos[`${currentWeek}-${currentVideo}`] ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Next Video
          </button>
        </div>

        {summary && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h5 className="font-semibold mb-2">Summary:</h5>
            <p>{summary}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPage;
