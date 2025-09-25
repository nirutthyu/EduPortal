from flask import Flask, jsonify,request
from flask_cors import CORS
import yt_dlp
import speech_recognition as sr
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import os,json,re
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
        model="gemini-1.5-flash",
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

    
def download_audio(video_id, output_file="youtube_audio.wav"):
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": "temp_audio.%(ext)s",
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
                "preferredquality": "192",
            }
        ],
        "quiet": True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    
    os.rename("temp_audio.wav", output_file)
    return output_file

def transcribe_audio_in_chunks(audio_file, chunk_length=60):
    recognizer = sr.Recognizer()
    full_transcript = []
    
    with sr.AudioFile(audio_file) as source:
        total_duration = int(source.DURATION)
        offset = 0
        
        while offset < total_duration:
            audio_chunk = recognizer.record(source, duration=chunk_length)
            
            try:
                text = recognizer.recognize_google(audio_chunk)
                full_transcript.append(text)
            except sr.UnknownValueError:
                full_transcript.append("[Unintelligible]")
            except sr.RequestError as e:
                full_transcript.append(f"[API error: {e}]")
            
            offset += chunk_length
    
    return " ".join(full_transcript)

def get_transcript(video_id):
    audio_file = download_audio(video_id)
    transcript = transcribe_audio_in_chunks(audio_file)
    os.remove(audio_file)
    return transcript  # just return string
    
@app.route("/summarize/<video_id>", methods=["GET"])
def summarize(video_id):
    try:
        transcript = get_transcript(video_id)
        print("transcript:"+transcript)
        prompt = f"""
You are an intelligent tutor helping a user learn efficiently. 
Here is the transcript of a YouTube video:

\"\"\"{transcript}\"\"\"

Based on this transcript, please do the following:

1. Provide a **concise summary** of the content in simple language that covers all contents of the video."""
        summary = get_gemini_response(prompt)
        return jsonify({
        "video_id": video_id,
        "summary": summary
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

    roadmap=get_gemini_response(prmpt)
    return roadmap

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

@app.route('/generate-roadmap', methods=['POST'])
def generate():
    try:
        formData = request.json  # incoming JSON from React
        roadmap = generate_roadmap(formData)
        final_output = build_weekly_json(roadmap)
        print(final_output)

        # Save as JSON file
        with open("videos.json", "w", encoding="utf-8") as f:
            json.dump(final_output, f, indent=2, ensure_ascii=False)

        return jsonify({
            "roadmap": roadmap,
            "videos": final_output
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)