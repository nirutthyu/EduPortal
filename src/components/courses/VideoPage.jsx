import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const VideoPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState({ 0: true });
  const [showSummary, setShowSummary] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showDoubt, setShowDoubt] = useState(false);
  const [mcqs, setMcqs] = useState([])
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  // New transcript-related state
  const [transcript, setTranscript] = useState("");
  console.log(transcript)
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleAnswerSelect = (questionIndex, selectedOption) => {
  setAnswers((prev) => ({
    ...prev,
    [questionIndex]: selectedOption,
  }));
};

const normalize = (str) =>
  String(str).replace(/`/g, "").trim().toLowerCase();

const calculateScore = () => {
  let newScore = 0;

  mcqs.forEach((mcq, index) => {
    const selected = answers[index];
    if (!selected) return; // skip unanswered

    // extract just the option text from "c) `useState`"
    let correctAnswer = mcq.answer.replace(/^[a-dA-D]\)\s*/, ""); 

    if (normalize(selected) === normalize(correctAnswer)) {
      newScore++;
    }
  });

  setScore(newScore);
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingRoadmap(true);
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
      } else {
        console.error("Error generating roadmap:", result.error);
      }
    } catch (err) {
      console.error("Network error:", err);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const toggleWeek = (weekIndex) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekIndex]: !prev[weekIndex]
    }));
  };

  const selectVideo = (weekIndex, videoIndex) => {
    setCurrentWeek(weekIndex);
    setCurrentVideo(videoIndex);
    setShowSummary(false);
    setShowQuiz(false);
    setShowDoubt(false);
    setShowTranscript(false);
    setSummary("");
    // Reset transcript when changing video
    setTranscript("");
    setTranscriptError("");
  };

  const getCurrentVideoData = () => {
    if (!videos || !videos[currentWeek]) return null;
    const weekKey = Object.keys(videos[currentWeek])[0];
    return videos[currentWeek][weekKey][currentVideo];
  };

  // Function to fetch transcript
  const fetchTranscript = async (videoUrl) => {
    if (!videoUrl || videoUrl === 'No video found') {
      setTranscriptError('No video URL available for transcript');
      return;
    }

    setLoadingTranscript(true);
    setTranscriptError("");
    
    try {
      const res = await fetch("http://127.0.0.1:5000/get-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl }),
      });

      const data = await res.json();
      
      if (res.ok) {
        if (data.transcript) {
          setTranscript(data.transcript);
        } else if (data.job_id) {
          setTranscriptError("Transcript is being processed. Please try again in a moment.");
        } else {
          setTranscriptError("Transcript not available");
        }
      } else {
        setTranscriptError(data.error || "Error fetching transcript");
      }
    } catch (err) {
      console.error("Network error:", err);
      setTranscriptError("Network error. Please check your connection.");
    } finally {
      setLoadingTranscript(false);
    }
  };

  // Effect to fetch transcript when video changes
  useEffect(() => {
    const currentVideoData = getCurrentVideoData();
    if (currentVideoData && currentVideoData.video !== 'No video found') {
      // Only fetch if we don't already have a transcript for this video
      if (!transcript) {
        fetchTranscript(currentVideoData.video);
        console.log(transcript)
      }
    }
  }, [currentWeek, currentVideo, videos]); // Dependencies: when video changes

const handleSummarize = async () => {
    const currentVideoData = getCurrentVideoData();
    if (!currentVideoData || currentVideoData.video === 'No video found') {
      alert('No video available for summarization');
      return;
    }
    // Check if transcript is available
    if (!transcript) {
      alert('Transcript not available yet. Please wait for transcript to load or try again.');
      return;
    }

    setLoadingSummary(true);
    setShowSummary(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
      } else {
        console.error("Error fetching summary:", data.error);
        setSummary("Error loading summary. Please try again.");
      }
    } catch (err) {
      console.error("Network error:", err);
      setSummary("Network error. Please check your connection.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleTranscript = () => {
    setShowTranscript(true);
    setShowSummary(false);
    setShowQuiz(false);
    setShowDoubt(false);
    
    // If transcript is not available, try to fetch it
    if (!transcript && !loadingTranscript) {
      const currentVideoData = getCurrentVideoData();
      if (currentVideoData && currentVideoData.video !== 'No video found') {
        fetchTranscript(currentVideoData.video);
      }
    }
  };
const handleQuiz = async () => {
  try {
    // update UI state
    setShowQuiz(true);
    setShowSummary(false);
    setShowDoubt(false);
    setShowTranscript(false);

    // send transcript to backend
    const response = await fetch("http://localhost:5000/generate-mcq", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript }), // assuming transcript is in state
    });

    if (!response.ok) {
      throw new Error("Failed to fetch quiz");
    }

    const data = await response.json();
    setMcqs(data); // update mcqs state with backend response
  } catch (error) {
    console.error("Error generating quiz:", error);
  }
};


  const handleDoubt = () => {
    setShowDoubt(true);
    setShowSummary(false);
    setShowQuiz(false);
    setShowTranscript(false);
  };

  const getVideoEmbedUrl = (videoUrl) => {
    if (videoUrl === 'No video found') return null;
    const videoId = videoUrl.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const Loader = () => (
    <div className="flex justify-center items-center py-10">
      <div className="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin"></div>
    </div>
  );

  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">
          Tell Us About Yourself - {serviceTitle}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            "age",
            "duration",
            "pace",
            "level",
            "experience",
            "summaryType",
            "goal",
          ].map((field) => (
            <div key={field}>
              <label className="block font-medium text-gray-700 mb-1 capitalize">
                {field}
              </label>
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
        {loadingRoadmap && <Loader />}
      </div>
    );
  }

  const currentVideoData = getCurrentVideoData();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} transition-all duration-300 bg-slate-800 text-white overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">📚 Contents</h3>
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="text-gray-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
          
          <div className="mb-4 p-3 bg-slate-700 rounded-lg">
            <h4 className="font-medium">{serviceTitle}</h4>
            <p className="text-sm text-gray-300">Course | Beginner</p>
          </div>

          {/* Week Dropdown Navigation */}
          <div className="space-y-2">
            {videos && videos.map((week, weekIndex) => {
              const weekKey = Object.keys(week)[0];
              const weekVideos = week[weekKey];
              const isExpanded = expandedWeeks[weekIndex];
              
              return (
                <div key={weekIndex}>
                  <button
                    onClick={() => toggleWeek(weekIndex)}
                    className="w-full flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span>{isExpanded ? '📂' : '📁'}</span>
                      <span className="font-medium">{weekKey}</span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {weekVideos.length} videos
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-4 mt-2 space-y-1">
                      {weekVideos.map((video, videoIndex) => (
                        <button
                          key={videoIndex}
                          onClick={() => selectVideo(weekIndex, videoIndex)}
                          className={`w-full text-left p-2 rounded text-sm hover:bg-slate-600 flex items-center gap-2 ${
                            currentWeek === weekIndex && currentVideo === videoIndex 
                              ? 'bg-blue-600' 
                              : ''
                          }`}
                        >
                          <span>🎥</span>
                          <span className="truncate">{video.topic}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                📚
              </button>
            )}
            <h1 className="text-xl font-bold">Zenith Learning</h1>
          </div>
          
          <nav className="flex items-center space-x-6">
            <a href="#" className="hover:text-blue-600">Home</a>
            <a href="#" className="hover:text-blue-600">Connect</a>
            <a href="#" className="hover:text-blue-600">About Us</a>
            <a href="#" className="hover:text-blue-600">Contact Us</a>
            <button className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-pink-600">
              Log Out
            </button>
          </nav>
        </header>

        {/* Video Content */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{currentVideoData?.topic}</h2>
            
            {/* Video Player */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              {currentVideoData && currentVideoData.video !== 'No video found' ? (
                <iframe
                  width="100%"
                  height="500"
                  src={getVideoEmbedUrl(currentVideoData.video)}
                  title={currentVideoData.topic}
                  frameBorder="0"
                  allowFullScreen
                  className="w-full"
                ></iframe>
              ) : (
                <div className="h-96 bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500 text-lg">No video available for this topic</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleSummarize}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                Summarize
              </button>
              <button
                onClick={handleTranscript}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                Transcript
              </button>
              <button
                onClick={handleQuiz}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                Quiz
              </button>
              <button
                onClick={handleDoubt}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                Ask Doubt
              </button>
            </div>

            {/* Content Panels */}
            {showSummary && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Video Summary</h3>
                {loadingSummary ? (
                  <Loader />
                ) : (
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{summary || "Click 'Summarize' to get the video summary."}</p>
                  </div>
                )}
              </div>
            )}

            {showTranscript && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Video Transcript</h3>
                {loadingTranscript ? (
                  <Loader />
                ) : transcriptError ? (
                  <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                    <p>{transcriptError}</p>
                    {transcriptError.includes("being processed") && (
                      <button
                        onClick={() => fetchTranscript(currentVideoData?.video)}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                ) : transcript ? (
                  <div className="prose max-w-none max-h-96 overflow-y-auto">
                    <p className="whitespace-pre-wrap leading-relaxed">{transcript}</p>
                  </div>
                ) : (
                  <p className="text-gray-600">No transcript available for this video.</p>
                )}
              </div>
            )}
{showQuiz && (
  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
    <h3 className="text-xl font-semibold mb-4">Quiz</h3>

    {mcqs.length > 0 ? (
      <div>
        {mcqs.map((mcq, index) => (
          <div key={index} className="mb-6">
            <p className="font-medium mb-2">
              {index + 1}. {mcq.question}
            </p>
            <div className="space-y-2">
              {mcq.options.map((option, i) => (
                <label
                  key={i}
                  className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name={`q-${index}`}
                    value={option}
                    onChange={() => handleAnswerSelect(index, option)}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={calculateScore}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Submit Quiz
        </button>

        {score !== null && (
          <div className="mt-4 text-lg font-semibold text-green-600">
            Your Score: {score}/{mcqs.length}
          </div>
        )}
      </div>
    ) : (
      <p className="text-gray-600">Loading quiz...</p>
    )}
  </div>
)}

            {showDoubt && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Ask Your Doubt</h3>
                <textarea
                  placeholder="Type your question or doubt about this topic..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                ></textarea>
                <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Submit Question
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => {
                  if (currentVideo > 0) {
                    selectVideo(currentWeek, currentVideo - 1);
                  } else if (currentWeek > 0) {
                    const prevWeekKey = Object.keys(videos[currentWeek - 1])[0];
                    const prevWeekLength = videos[currentWeek - 1][prevWeekKey].length;
                    selectVideo(currentWeek - 1, prevWeekLength - 1);
                  }
                }}
                disabled={currentWeek === 0 && currentVideo === 0}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              <button
                onClick={() => {
                  const currentWeekKey = Object.keys(videos[currentWeek])[0];
                  const currentWeekLength = videos[currentWeek][currentWeekKey].length;
                  
                  if (currentVideo < currentWeekLength - 1) {
                    selectVideo(currentWeek, currentVideo + 1);
                  } else if (currentWeek < videos.length - 1) {
                    selectVideo(currentWeek + 1, 0);
                  }
                }}
                disabled={
                  currentWeek === videos?.length - 1 && 
                  currentVideo === videos[currentWeek][Object.keys(videos[currentWeek])[0]].length - 1
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;