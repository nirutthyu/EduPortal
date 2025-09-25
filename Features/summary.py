from langchain.text_splitter import RecursiveCharacterTextSplitter
import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import LLMChain
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Configure Google Generative AI
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

prmt_temp = """
    You are a teacher of a student. 
    You have to teach the student about the following paragraph: 
    {transcript} 
    so that he/she can understand it very clearly.
    Dont format the response.
    Generate as paragraphs.
"""

def get_recommendation(transcript: str):
    # Initialize the Chat model
    llm = ChatGoogleGenerativeAI(model='gemini-2.0-flash', temperature=0.3)

    # Create the LLMChain
    llm_chain = LLMChain(llm=llm, prompt=PromptTemplate.from_template(prmt_temp))

    # Inputs for the LLM chain
    inputs = {
        "transcript": transcript,
    }
    # Run the chain
    response = llm_chain.run(inputs)
    return response

# Example usage
def main():
    # Load JSON data from file
    try:
        with open('Data_Scraping/Data/web.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Error: data.json not found.")
        return
    except json.JSONDecodeError:
        print("Error: Invalid JSON format in data.json")
        return
    
    if not isinstance(data, list):
        print("Error: JSON data must be a list of objects.")
        return

    processed_count = 0
    for item in data:
        if processed_count >= 2:
            break
        
        transcript = item.get("transcript")
        if not transcript:
            print("Error: 'transcript' key not found in JSON object.")
            continue
        
        if "Error fetching transcrip" in transcript or "foreign" in transcript:
            print("Skipping transcript due to filter.")
            continue
        
        recommendation = get_recommendation(transcript)
        print("*")
        print(recommendation)
        processed_count += 1
main()