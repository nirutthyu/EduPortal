from dotenv import load_dotenv
import os
import google.generativeai as genai
from googleapiclient.discovery import build

age=input("Enter your age: ")
duration=input("Enter the duration (in months): ")
pace=input("Enter your pace (fast or slow learner): ")
level=input("Enter your current level (beginner, intermediate, advanced): ")
exp=input("Enter your prior experience (none, some, extensive): ")
summary=input("para or bulletins : ")
goal=input("Enter your goal (e.g., Better grades, clear understanding, competitive exam prep, practical use): ")
subject=input("Enter the subject (e.g., web,mobile,ai, Programming): ")


load_dotenv()

genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

def generate_roadmap():
    prmpt=f""" You are an expert educational consultant. A student of age {age} wants to learn {subject}. 
    The student has a {level} level of knowledge in this subject and has {exp} prior experience. 
    The student is a {pace} learner and wants to achieve the goal of {goal} within a duration of {duration} months.
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




roadmap = generate_roadmap()
