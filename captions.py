from supadata import Supadata

# Initialize the client with your API key
supadata = Supadata(api_key="sd_8a5d95a2b1f30547a20d04b952380243")

# Fetch transcript for a YouTube video
transcript = supadata.transcript(
    url="https://www.youtube.com/watch?v=uLAGrLJFBt4",
    lang="en",  # Optional: preferred language
    text=True,  # Optional: return plain text instead of timestamped chunks
    mode="auto"  # Optional: 'native', 'auto', or 'generate'
)

# Check if the transcript has content
if hasattr(transcript, 'content'):
    print(f"Transcript: {transcript.content}")
    print(f"Language: {transcript.lang}")
else:
    print(f"Processing started with job ID: {transcript.job_id}")
