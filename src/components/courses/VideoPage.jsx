import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

const VideoPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Data passed from CourseForm
  const serviceTitle = location.state?.title || "Course";
  const initialRoadmap = location.state?.roadmap || null;
  const initialVideos = location.state?.videos || null;
  const initialFormData = location.state?.formData || {
    age: "",
    duration: "",
    pace: "",
    level: "",
    experience: "",
    summaryType: "",
    goal: "",
    subject: serviceTitle === "Other Domains" ? "" : serviceTitle,
  };

  // States
  const [roadmap, setRoadmap] = useState(initialRoadmap);
  const [videos, setVideos] = useState(initialVideos);
  const [formData, setFormData] = useState(initialFormData);

  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(0);

  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState({ 0: true });

  const [showSummary, setShowSummary] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showDoubt, setShowDoubt] = useState(false);
  const [mcqs, setMcqs] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  const [transcript, setTranscript] = useState("");
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  const [doubtText, setDoubtText] = useState("");
  const [botReply, setBotReply] = useState("");
  const [loadingDoubt, setLoadingDoubt] = useState(false);

  // Normalize string for quiz comparison
  const normalize = (str) => String(str).replace(/`/g, "").trim().toLowerCase();

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: selectedOption }));
  };

  const calculateScore = () => {
    let newScore = 0;
    mcqs.forEach((mcq, index) => {
      const selected = answers[index];
      if (!selected) return;

      let correctAnswer = mcq.answer.replace(/^[a-dA-D]\)\s*/, "");
      if (normalize(selected) === normalize(correctAnswer)) newScore++;
    });
    setScore(newScore);
  };

  const toggleWeek = (weekIndex) => {
    setExpandedWeeks((prev) => ({ ...prev, [weekIndex]: !prev[weekIndex] }));
  };

  const selectVideo = (weekIndex, videoIndex) => {
    setCurrentWeek(weekIndex);
    setCurrentVideo(videoIndex);
    setShowSummary(false);
    setShowQuiz(false);
    setShowDoubt(false);
    setShowTranscript(false);
    setSummary("");
    setTranscript("");
    setTranscriptError("");
  };

  const getCurrentVideoData = () => {
    if (!videos || !videos[currentWeek]) return null;
    const weekKey = Object.keys(videos[currentWeek])[0];
    return videos[currentWeek][weekKey][currentVideo];
  };

  // Fetch transcript
  const fetchTranscript = async (videoUrl) => {
    if (!videoUrl || videoUrl === "No video found") {
      setTranscriptError("No video URL available for transcript");
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
        if (data.transcript) setTranscript(data.transcript);
        else if (data.job_id)
          setTranscriptError(
            "Transcript is being processed. Please try again in a moment."
          );
        else setTranscriptError("Transcript not available");
      } else {
        setTranscriptError(data.error || "Error fetching transcript");
      }
    } catch (err) {
      console.error(err);
      setTranscriptError("Network error. Please check your connection.");
    } finally {
      setLoadingTranscript(false);
    }
  };

  // Auto-fetch transcript when video changes
  useEffect(() => {
    const currentVideoData = getCurrentVideoData();
    if (currentVideoData && currentVideoData.video !== "No video found") {
      if (!transcript) fetchTranscript(currentVideoData.video);
    }
  }, [currentWeek, currentVideo, videos]);

  const handleSummarize = async () => {
    const currentVideoData = getCurrentVideoData();
    if (!currentVideoData || currentVideoData.video === "No video found") return alert("No video available");

    if (!transcript) return alert("Transcript not available yet");

    setLoadingSummary(true);
    setShowSummary(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, type: formData.summaryType }),
      });
      const data = await res.json();
      if (res.ok) setSummary(data.summary);
      else setSummary("Error loading summary. Please try again.");
    } catch (err) {
      console.error(err);
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

    if (!transcript && !loadingTranscript) {
      const currentVideoData = getCurrentVideoData();
      if (currentVideoData && currentVideoData.video !== "No video found") fetchTranscript(currentVideoData.video);
    }
  };

  const handleQuiz = async () => {
    try {
      setShowQuiz(true);
      setShowSummary(false);
      setShowDoubt(false);
      setShowTranscript(false);

      const response = await fetch("http://localhost:5000/generate-mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) throw new Error("Failed to fetch quiz");
      const data = await response.json();
      setMcqs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDoubt = () => {
    setShowDoubt(true);
    setShowSummary(false);
    setShowQuiz(false);
    setShowTranscript(false);
  };

  const getVideoEmbedUrl = (videoUrl) => {
    if (videoUrl === "No video found") return null;
    const videoId = videoUrl.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const Loader = () => (
    <div className="flex justify-center items-center py-10">
      <div className="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin"></div>
    </div>
  );

  const currentVideoData = getCurrentVideoData();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? "w-0" : "w-80"} transition-all duration-300 bg-slate-800 text-white overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">📚 Contents</h3>
            <button onClick={() => setSidebarCollapsed(true)} className="text-gray-400 hover:text-white p-1">✕</button>
          </div>

          <div className="mb-4 p-3 bg-slate-700 rounded-lg">
            <h4 className="font-medium">{serviceTitle}</h4>
            <p className="text-sm text-gray-300">Course </p>
          </div>

          {/* Week Navigation */}
          <div className="space-y-2">
            {videos && videos.map((week, weekIndex) => {
              const weekKey = Object.keys(week)[0];
              const weekVideos = week[weekKey];
              const isExpanded = expandedWeeks[weekIndex];

              return (
                <div key={weekIndex}>
                  <button onClick={() => toggleWeek(weekIndex)} className="w-full flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-left">
                    <div className="flex items-center gap-2">
                      <span>{isExpanded ? "📂" : "📁"}</span>
                      <span className="font-medium">{weekKey}</span>
                    </div>
                    <span className="text-gray-400 text-sm">{weekVideos.length} videos</span>
                  </button>

                  {isExpanded && (
                    <div className="ml-4 mt-2 space-y-1">
                      {weekVideos.map((video, videoIndex) => (
                        <button key={videoIndex} onClick={() => selectVideo(weekIndex, videoIndex)}
                          className={`w-full text-left p-2 rounded text-sm hover:bg-slate-600 flex items-center gap-2 ${currentWeek === weekIndex && currentVideo === videoIndex ? "bg-blue-600" : ""}`}>
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
        <header className="bg-white shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {sidebarCollapsed && <button onClick={() => setSidebarCollapsed(false)} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700">📚</button>}
            <h1 className="text-xl font-bold">Zenith Learning</h1>
          </div>

          <nav className="flex items-center space-x-6">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <Link to="/" className="hover:text-blue-600">Connect</Link>
            <Link to="/" className="hover:text-blue-600">About Us</Link>
            <Link to="/" className="hover:text-blue-600">Contact Us</Link>
          </nav>
        </header>

        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{currentVideoData?.topic}</h2>

            {/* Video Player */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              {currentVideoData && currentVideoData.video !== "No video found" ? (
                <iframe width="100%" height="500" src={getVideoEmbedUrl(currentVideoData.video)} title={currentVideoData.topic} frameBorder="0" allowFullScreen className="w-full"></iframe>
              ) : (
                <div className="h-96 bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500 text-lg">No video available for this topic</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <button onClick={handleSummarize} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">Summarize</button>
              <button onClick={handleTranscript} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">Transcript</button>
              <button onClick={handleQuiz} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">Quiz</button>
              <button onClick={handleDoubt} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">Ask Doubt</button>
            </div>

            {/* Panels */}
            {showSummary && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Video Summary</h3>
                {loadingSummary ? <Loader /> : <p className="whitespace-pre-wrap">{summary}</p>}
              </div>
            )}

            {showTranscript && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Video Transcript</h3>
                {loadingTranscript ? <Loader /> : transcriptError ? <p className="text-red-600">{transcriptError}</p> : <p className="whitespace-pre-wrap">{transcript}</p>}
              </div>
            )}

            {showQuiz && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Quiz</h3>
                {mcqs.length > 0 ? (
                  <>
                    {mcqs.map((mcq, index) => (
                      <div key={index} className="mb-4">
                        <p className="font-medium mb-2">{index + 1}. {mcq.question}</p>
                        <div className="space-y-2">
                          {mcq.options.map((option, i) => (
                            <label key={i} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                              <input type="radio" name={`q-${index}`} value={option} onChange={() => handleAnswerSelect(index, option)} className="mr-2" />
                              {option}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button onClick={calculateScore} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Submit Quiz</button>
                    {score !== null && <p className="mt-4 font-semibold text-green-600">Score: {score}/{mcqs.length}</p>}
                  </>
                ) : <p>Loading quiz...</p>}
              </div>
            )}

            {showDoubt && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Ask Your Doubt</h3>
                <textarea value={doubtText} onChange={(e) => setDoubtText(e.target.value)} placeholder="Type your doubt..." className="w-full h-32 p-4 border rounded-lg mb-2"></textarea>
                <button onClick={async () => {
                  if (!doubtText.trim()) return;
                  setLoadingDoubt(true);
                  setBotReply("");
                  try {
                    const res = await fetch("http://127.0.0.1:5000/chat", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ subject: serviceTitle, message: doubtText }),
                    });
                    const data = await res.json();
                    setBotReply(res.ok ? data.reply : "Error: " + (data.error || "Unable to get reply"));
                  } catch (err) {
                    console.error(err);
                    setBotReply("Network error. Please try again.");
                  } finally { setLoadingDoubt(false); }
                }} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Submit Question</button>

                {loadingDoubt && <p className="mt-2">Thinking...</p>}
                {botReply && <p className="mt-2 whitespace-pre-wrap">{botReply}</p>}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => {
                  if (currentVideo > 0) selectVideo(currentWeek, currentVideo - 1);
                  else if (currentWeek > 0) {
                    const prevWeekKey = Object.keys(videos[currentWeek - 1])[0];
                    const prevWeekLength = videos[currentWeek - 1][prevWeekKey].length;
                    selectVideo(currentWeek - 1, prevWeekLength - 1);
                  }
                }}
                disabled={currentWeek === 0 && currentVideo === 0}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                ← Previous
              </button>

              <button
                onClick={() => {
                  const currentWeekKey = Object.keys(videos[currentWeek])[0];
                  const currentWeekLength = videos[currentWeek][currentWeekKey].length;
                  if (currentVideo < currentWeekLength - 1) selectVideo(currentWeek, currentVideo + 1);
                  else if (currentWeek < videos.length - 1) selectVideo(currentWeek + 1, 0);
                }}
                disabled={currentWeek === videos?.length - 1 && currentVideo === videos[currentWeek][Object.keys(videos[currentWeek])[0]].length - 1}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
