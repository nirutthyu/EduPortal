from flask import Flask, jsonify,request
from flask_cors import CORS
import yt_dlp
import speech_recognition as sr
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from supadata import Supadata
import os,json,re
import time
app = Flask(__name__)
CORS(app)
from dotenv import load_dotenv
from google import genai

load_dotenv()  
client=genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

def get_gemini_response(input_prompt):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=input_prompt
    )

    if not response.candidates:
        raise ValueError("Gemini API returned no candidates.")

    try:
        candidate_content = response.candidates[0].content.parts[0].text.strip()
        # Just return plain text
        return candidate_content
    except Exception as e:
        raise ValueError(f"Error extracting or parsing response: {e}")
    
from flask import request, jsonify

@app.route("/summarize", methods=["POST"])
def summarize():
    try:
        data = request.get_json()
        transcript = data.get("transcript")

        if not transcript:
            return jsonify({"error": "Transcript not provided"}), 400

        print("transcript:", transcript)

        prompt = f"""
You are an intelligent tutor helping a user learn efficiently. 
Here is the transcript of a YouTube video:

\"\"\"{transcript}\"\"\"

Based on this transcript, please do the following:

1. Provide a summary of the content in simple language that covers all contents of the video so that the user does not even have to view the video.
"""

        summary = get_gemini_response(prompt)

        return jsonify({
            "summary": summary
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


supadata = Supadata(api_key="sd_8a5d95a2b1f30547a20d04b952380243")
import google.generativeai as genai
# ---------------- ROADMAP GENERATION ----------------
def generate_roadmap(formData):
    prmpt = f""" You are an expert educational consultant. A student of age {formData['age']} wants to learn {formData['subject']}. 
    The student has a {formData['level']} level of knowledge in this subject and has {formData['experience']} prior experience. 
    The student is a {formData['pace']} learner and wants to achieve the goal of {formData['goal']} within a duration of {formData['duration']} months.
    Create a personalized learning roadmap for the student. The roadmap should include a list of topics to be covered each week.
    The roadmap should be structured in a way that is easy to follow and understand. The roadmap should be in the following format:

    Week 1:
    - Topic 1
    - Topic 2 
    ...
    Week N:
    - Topic 1
    - Topic 2

    Only the roadmap is required. Do not include any additional information or explanations.
    """

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prmpt)
    return response.text


# ---------------- PARSE ROADMAP ----------------
def parse_roadmap(roadmap):
    weeks = {}
    current_week = None
    for line in roadmap.split("\n"):
        line = line.strip()
        if line.lower().startswith("week"):
            current_week = line.split(":")[0].strip()
            weeks[current_week] = []
        elif line.startswith("-") and current_week:
            topic = line[1:].strip()
            weeks[current_week].append(topic)
    return weeks


# ---------------- YOUTUBE HELPERS ----------------
def get_video_details(query, max_results=10, retries=3, delay=2):
    video_details = []
    results_count = 0
    next_page_token = None

    while results_count < max_results:
        try:
            search_response = youtube.search().list(
                q=query,
                part='snippet',
                maxResults=min(50, max_results - results_count),
                type='video',
                pageToken=next_page_token
            ).execute()

            for item in search_response.get('items', []):
                video_id = item['id']['videoId']
                video_url = f'https://www.youtube.com/watch?v={video_id}'

                # Fetch video statistics with retry
                for attempt in range(retries):
                    try:
                        video_data = youtube.videos().list(
                            part='statistics',
                            id=video_id
                        ).execute()
                        break
                    except HttpError as e:
                        if e.resp.status in [500, 503]:
                            time.sleep(delay * (attempt + 1))  # exponential backoff
                        else:
                            raise
                else:
                    continue

                if video_data.get('items'):
                    like_count = int(video_data['items'][0]['statistics'].get('likeCount', 0))
                else:
                    like_count = 0

                video_details.append({
                    'url': video_url,
                    'like_count': like_count
                })
                results_count += 1
                if results_count >= max_results:
                    break

            next_page_token = search_response.get('nextPageToken')
            if not next_page_token:
                break

        except HttpError as e:
            if e.resp.status in [500, 503]:
                time.sleep(delay)
                continue
            else:
                raise
    return video_details


def get_best_video(topic):
    video_list = get_video_details(topic, max_results=10)
    if not video_list:
        return None
    best_video = max(video_list, key=lambda x: x['like_count'])
    return best_video['url']


def build_weekly_json(roadmap):
    weeks = parse_roadmap(roadmap)
    result = []

    for week, topics in weeks.items():
        week_data = []
        for topic in topics:
            video = get_best_video(topic+"in english")
            week_data.append({
                "topic": topic,
                "video": video if video else "No video found"
            })
        result.append({week: week_data})
    return result

def generate_mcq(transcript: str):
    prmpt=f"""You are an expert educational consultant.A student have given a video transcript and wants to create a multiple-choice quiz based on it.
    This is the transcript: {transcript}
    Create a multiple-choice quiz with 10 questions. Each question should have 4 options.
    The quiz should be structured in the following format:
    Question 1: Question
    a) Option 1 
    b) Option 2
    c) Option 3
    d) Option 4
    Correct Answer: Answer

    Only the quiz is required. Do not include any additional information or explanations.
    """

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prmpt)
    print(response.text)
    return response.text


def parse_to_json(quiz_text: str):
    quiz_data = []
    blocks = re.split(r"Question \d+:", quiz_text)
    for block in blocks:
        block = block.strip()
        if not block:
            continue

        lines = block.splitlines()
        if len(lines) < 5:
            continue

        question = lines[0].strip()
        options = [line.strip().split(" ", 1)[1] for line in lines[1:5]]
        answer_line = [line for line in lines if line.startswith("Correct Answer")]
        answer = answer_line[0].split(":", 1)[1].strip() if answer_line else ""

        quiz_data.append({
            "question": question,
            "options": options,
            "answer": answer
        })
    return quiz_data

# ---------------- FLASK ENDPOINT ----------------
@app.route('/generate-roadmap', methods=['POST'])
def generate():
    try:
        formData = request.json  # incoming JSON from React
        roadmap = generate_roadmap(formData)
        final_output = build_weekly_json(roadmap)

        # Save as JSON file
        with open("videos.json", "w", encoding="utf-8") as f:
            json.dump(final_output, f, indent=2, ensure_ascii=False)

        return jsonify({
            "roadmap": roadmap,
            "videos": final_output
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get-transcript", methods=["POST"])
def get_transcript():
    try:
        data = request.get_json()
        if not data or "url" not in data:
            return jsonify({"error": "URL is required"}), 400

        url = data["url"]
        transcript = supadata.transcript(
            url=url,
            lang="en",  
            text=True,  
            mode="auto"  
        )
        if hasattr(transcript, "content"):
            print(transcript.content)
            print(url)
            return jsonify({
                "url": url,
                "transcript": transcript.content,
                "language": transcript.lang
            })
        else:
            return jsonify({
                "message": "Transcript is being processed",
                "job_id": transcript.job_id
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route("/generate-mcq", methods=["POST"])
def generate_mcq_api():
    try:
        data = request.get_json()
        transcript = data.get("transcript", "")

        if not transcript.strip():
            return jsonify({"error": "Transcript is required"}), 400

        quiz_text = generate_mcq(transcript)
        quiz_json = parse_to_json(quiz_text)

        # Save to mcq.json
        with open("mcq.json", "w", encoding="utf-8") as f:
            json.dump(quiz_json, f, indent=2, ensure_ascii=False)

        return jsonify(quiz_json)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True)


