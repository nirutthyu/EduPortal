import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

const CourseForm = () => {
  const { title } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    age: "",
    duration: "",
    pace: "",
    level: "",
    experience: "",
    summaryType: "",
    goal: "",
    subject: title === "Other Domains" ? "" : title,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (res.ok) {
        navigate(`/course/${title}/videos`, { state: { roadmap: result.roadmap, videos: result.videos, title } });
      } else {
        alert(result.error || "Failed to generate roadmap");
      }
    } catch (err) {
      alert("Network error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-2xl">
      <h2 className="text-2xl font-bold text-center mb-6">Tell Us About Yourself - {title}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {["age","duration","pace","level","experience","summaryType","goal"].map(field => (
          <div key={field}>
            <label className="block font-medium text-gray-700 mb-1 capitalize">{field === "summaryType" ? "Preferred Summary Type" : field}</label>
            {field === "goal" ? (
              <textarea name={field} value={formData[field]} onChange={handleChange} rows="4" className="w-full border p-2 rounded-lg" placeholder="Enter your reason for pursuing this course" required/>
            ) : field === "pace" || field === "level" ? (
              <select name={field} value={formData[field]} onChange={handleChange} className="w-full border p-2 rounded-lg" required>
                <option value="">Select {field}</option>
                {field === "pace" ? <>
                  <option value="fast">Fast Learner</option>
                  <option value="slow">Slow Learner</option>
                </> : <>
                  <option value="average">Average</option>
                  <option value="topper">Topper</option>
                </>}
              </select>
            ) : (
              <input type={field==="age"?"number":"text"} name={field} value={formData[field]} onChange={handleChange} className="w-full border p-2 rounded-lg" placeholder={field} required />
            )}
          </div>
        ))}
        {title === "Other Domains" && (
          <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="w-full border p-2 rounded-lg" placeholder="Enter your subject" required/>
        )}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{loading?"Generating...":"Generate Roadmap"}</button>
      </form>
    </div>
  );
};

export default CourseForm;
