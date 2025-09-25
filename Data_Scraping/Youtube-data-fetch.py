import google.generativeai as genai
import sys
import time
import os
import json
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
import re
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
import os
import google.generativeai as genai
from dotenv import load_dotenv



# Load environment variables
load_dotenv()

# Configure Google Generative AI
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

def extract_video_id(url):
    """
    Extracts video ID from YouTube URL.
    """
    match = re.search(r"(?:https?://)?(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]+)", url)
    if match:
        return match.group(1)
    return None

def fetch_transcript(video_id):
    """
    Fetch the transcript for a given YouTube video ID.
    """
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        formatter = TextFormatter()
        formatted_transcript = formatter.format_transcript(transcript)
        return formatted_transcript
    except Exception as e:
        return f"Error fetching transcript for video {video_id}: {str(e)}"

def generate_transcript(video_url):
    """
    Generates the transcript for a given YouTube video URL.
    """
    video_id = extract_video_id(video_url)
    if video_id:
        transcript = fetch_transcript(video_id)
        return transcript
    else:
        return f"Invalid URL: {video_url}"


# Load environment variables
from dotenv import load_dotenv

load_dotenv()

# Configure Google Generative AI
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

# Generate roadmap using Gemini Pro
def generate_roadmap(topic):
    prompt = f"""Create a detailed roadmap for learning the topic '{topic}' for someone starting from scratch.
    The roadmap should cover various topics and subtopics, with suggested deadlines (in weeks or days).
    Please provide the roadmap in the following format:

    1.Main Topic/Concept 1 (e.g., Introduction to Python)
       -(e.g., Syntax and Basic Programming)
       -(e.g., Data Types and Variables)
       - Suggested deadline: 2 weeks

    2.Main Topic/Concept 2 (e.g., Object-Oriented Programming)
       -(e.g., Classes and Objects)
       -(e.g., Inheritance and Polymorphism)
       - Suggested deadline: 3 weeks

    Format the response point by point, with each topic and subtopic properly indented and clearly separated. 
    Do not print the roadmap as a single paragraph;
     use a bullet-point structure with indentation to clearly separate topics and subtopics,print roadmap in the web page as the same format as the pdf and avoid using asterik symbol anywhere.
    """
    response = genai.GenerativeModel('gemini-2.0-flash').generate_content(prompt)
    return response.text.strip()


topic = "Object-Oriented Programming"
roadmap = generate_roadmap(topic)
print(roadmap)


import os
from googleapiclient.discovery import build
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get YouTube API key from environment variable
API_KEY = os.getenv('YOUTUBE_API_KEY')

# Check if the API key is loaded correctly
if not API_KEY:
    print("API Key not found. Please make sure you have set it in the .env file.")
    exit()

# Build the YouTube API client
youtube = build('youtube', 'v3', developerKey=API_KEY)

def get_video_details(query, max_results=10):
    """
    Fetches video details (like count and URL) for a given query.

    Args:
        query (str): The search query.
        max_results (int): The maximum number of videos to fetch.

    Returns:
        list: A list of dictionaries, each containing video URL and like count.
    """
    video_details = []
    results_count = 0
    next_page_token = None

    while results_count < max_results:
        search_response = youtube.search().list(
            q=query,
            part='snippet',
            maxResults=min(50, max_results - results_count), # Fetch up to 50 videos per page
            type='video',
            pageToken=next_page_token
        ).execute()

        for item in search_response.get('items', []):
            video_id = item['id']['videoId']
            video_url = f'https://www.youtube.com/watch?v={video_id}'

            # Fetch video statistics (including like count)
            video_data = youtube.videos().list(
                part='statistics',
                id=video_id
            ).execute()

            if video_data.get('items'):
                like_count = int(video_data['items'][0]['statistics'].get('likeCount', 0)) # Convert to int for comparison
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
    return video_details


# Extract topics and subtopics from the roadmap
def extract_topics(roadmap):
    topics = []
    lines = roadmap.split('\n')
    for line in lines:
        line = line.strip()
        if line:
            if line[0].isdigit() and '.' in line:
                topics.append(line.split('.', 1)[1].strip().split('(',1)[0].strip())
            elif line.startswith('-'):
                topics.append(line[1:].strip().split('(',1)[0].strip())
    return topics

topics = extract_topics(roadmap)
print(topics)

topic_video_data = []
for topic in topics:
    video_details = get_video_details(topic, max_results=10)
    if video_details:
        max_like_video = max(video_details, key=lambda x: x['like_count'])
        topic_video_data.append({"topic": topic, "url": max_like_video['url']})
        print(f"Topic: {topic}")
        print(f"Video with the most likes: {max_like_video['url']}")
    else:
        topic_video_data.append({"topic": topic, "url": None})
        print(f"No videos found for the topic: {topic}")

# Save the data to a JSON file
with open('OOP.json', 'w') as f:
    json.dump(topic_video_data, f, indent=4)

print("Data saved to topic_videos.json")
