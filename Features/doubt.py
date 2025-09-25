import google.generativeai as genai
from flask import Flask, request, jsonify, render_template_string
import os
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Initialize Flask app
app = Flask(__name__)

# Initialize Gemini Pro API
genai.configure(api_key="AIzaSyCLaBBXT4IIOxcr0vtD7ZB21f9qqcHW64E")  # Replace with your Gemini API key

# Store the transcript for the bot to use
TRANSCRIPT = """Web development is the process of creating and maintaining websites or web applications, enabling users to access content and interact with online services. The field is broad, encompassing various essential concepts that form the foundation of the modern web.

One of the most important aspects of web development is *front-end development, which refers to the part of a website that users directly interact with. Front-end developers use technologies like **HTML* (HyperText Markup Language), *CSS* (Cascading Style Sheets), and *JavaScript* to structure, style, and add interactivity to webpages. HTML provides the content structure, CSS controls the visual appearance, and JavaScript enables dynamic behavior, making web pages more interactive and engaging.

*Back-end development* focuses on the server-side, handling the business logic, database interactions, and data processing. Key technologies in back-end development include *server-side programming languages* like Python, Ruby, Java, and Node.js, as well as databases such as *MySQL, **MongoDB, or **PostgreSQL*. The back-end is responsible for processing requests from users, retrieving data from databases, and sending responses to the front-end.

*Full-stack development* combines both front-end and back-end development, requiring proficiency in both areas. Full-stack developers can create end-to-end solutions, ensuring the website works seamlessly from the user interface to the server-side logic and databases.

Another crucial concept is *responsive design*, which ensures that websites function well on various devices, including desktops, tablets, and smartphones. With the increasing use of mobile devices, responsive web design has become essential for providing a consistent and user-friendly experience across different screen sizes.

*Web security* is another critical area of concern. As the internet becomes more integrated into daily life, protecting user data and preventing cyberattacks are paramount. Techniques like *encryption, **secure protocols (HTTPS), and **input validation* help safeguard websites from malicious activities.

Lastly, *web performance optimization* is vital for improving load times and ensuring a smooth user experience. Optimizing images, minifying code, and leveraging caching mechanisms are common strategies for enhancing web performance.

In conclusion, web development is a multifaceted discipline that requires a solid understanding of various technologies and concepts. By mastering front-end and back-end development, responsive design, security measures, and performance optimization, developers can create efficient, secure, and user-friendly websites and applications."""

# In-memory storage for conversations
conversations = []

# HTML Template for UI
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Doubt Clearing Bot</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
</head>
<body>
    <div class="container mt-5">
        <h1 class="text-center text-primary">AI Doubt Clearing Bot</h1>
        
        <!-- Clear All Button -->
        <form method="POST" action="/clear_all">
            <button type="submit" class="btn btn-danger mb-3">Clear All Conversations</button>
        </form>
        
        <!-- Question Form -->
        <form method="POST" action="/ask">
            <div class="mb-3">
                <label for="question" class="form-label">Enter your Question</label>
                <input type="text" id="question" name="question" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-primary">Ask</button>
        </form>

        <!-- Display Conversations -->
        {% if conversations %}
        <div class="mt-4">
            <h3>Past Conversations:</h3>
            <ul class="list-group">
                {% for question, answer in conversations %}
                    <li class="list-group-item">
                        <strong>Q:</strong> {{ question }}<br>
                        <strong>A:</strong> {{ answer }}
                    </li>
                {% endfor %}
            </ul>
        </div>
        {% endif %}
    </div>
</body>
</html>
"""

# Function to check if the question is semantically related to the transcript
def is_related_to_transcript(question):
    # Use CountVectorizer to convert text to vectors
    vectorizer = CountVectorizer().fit_transform([TRANSCRIPT, question])
    cosine_sim = cosine_similarity(vectorizer[0:1], vectorizer[1:2])
    
    # If the cosine similarity score is above a certain threshold, consider it related
    return cosine_sim[0][0] > 0.2  # 0.2 is an arbitrary threshold for relevance

# Function to check if the question is within the scope of the transcript
def is_within_scope(question):
    prompt = f"Check if the question is within the scope of the following transcript:\n\n{TRANSCRIPT}\n\nQuestion: {question}\nAnswer with 'Yes' or 'No'."
    response = genai.GenerativeModel('gemini-2.0-flash').generate_content(prompt)
    return response.text.strip().lower() == 'yes'

# Function to answer the question based on the transcript
def get_answer_from_transcript(question):
    prompt = f"Answer the following question based on this transcript:\n\n{TRANSCRIPT}\n\nQuestion: {question}\nAnswer concisely."
    response = genai.GenerativeModel('gemini-2.0-flash').generate_content(prompt)
    return response.text.strip()

@app.route("/", methods=["GET"])
def home():
    return render_template_string(HTML_TEMPLATE, conversations=conversations)

@app.route("/ask", methods=["POST"])
def ask():
    question = request.form["question"]
    
    # Check if the question is within the scope of the transcript
    if is_within_scope(question):
        answer = get_answer_from_transcript(question)
    elif is_related_to_transcript(question):
        answer = "Your question is related to the transcript, but it is not explicitly present in the content. Can you please clarify?"
    else:
        answer = "Your question doesn't lie within the covered concepts."
    
    # Store the question and answer
    conversations.append((question, answer))
    
    return render_template_string(HTML_TEMPLATE, conversations=conversations)

@app.route("/clear_all", methods=["POST"])
def clear_all():
    # Clear the conversations
    conversations.clear()
    return render_template_string(HTML_TEMPLATE, conversations=conversations)

if __name__ == "__main__":
    app.run(debug=True, port=8000)
