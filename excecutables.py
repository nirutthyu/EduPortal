from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import google.generativeai as genai
from googleapiclient.discovery import build
import json
import time
from googleapiclient.errors import HttpError

app = Flask(__name__)

# Load environment variables
load_dotenv()
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)


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


if __name__ == '__main__':
    app.run(debug=True)
