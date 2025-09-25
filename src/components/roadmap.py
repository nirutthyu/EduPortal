import google.generativeai as genai
import sys
import time
from flask import Flask, request, jsonify, render_template_string, send_from_directory
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

# Initialize Flask app
app = Flask(__name__)

# Initialize Gemini Pro API
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

# Create a directory for saving the generated PDFs
pdf_directory = "generated_pdfs"
if not os.path.exists(pdf_directory):
    os.makedirs(pdf_directory)

# HTML Template for UI
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Learning Roadmap Generator</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
</head>
<body>
    <div class="container mt-5">
        <h1 class="text-center text-primary">Learning Roadmap Generator</h1>
        <form method="POST" action="/generate">
            <div class="mb-3">
                <label for="topic" class="form-label">Enter Topic Domain</label>
                <input type="text" id="topic" name="topic" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-primary">Generate Roadmap</button>
        </form>
        {% if roadmap %}
        <div class="alert alert-info mt-4" role="alert">
            <strong>Learning Roadmap:</strong> <br>{{ roadmap }}
        </div>
        <a href="{{ url_for('download_pdf', filename=filename) }}" class="btn btn-success mt-4">Download PDF</a>
        {% endif %}
    </div>
</body>
</html>
"""

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

# Save the roadmap to a PDF file
def save_roadmap_to_pdf(roadmap, filename):
    pdf_path = os.path.join(pdf_directory, filename)
    c = canvas.Canvas(pdf_path, pagesize=letter)
    c.setFont("Helvetica", 12)
    
    # Start adding text to the PDF
    y_position = 750  # Start position from top
    for line in roadmap.split("\n"):
        c.drawString(40, y_position, line)
        y_position -= 15  # Adjust line height
        
        # Ensure we don't exceed page height
        if y_position < 50:
            c.showPage()
            c.setFont("Helvetica", 12)
            y_position = 750

    c.save()
    return pdf_path

@app.route("/", methods=["GET"])
def home():
    return render_template_string(HTML_TEMPLATE, roadmap=None)

@app.route("/generate", methods=["POST"])
def generate():
    topic = request.form["topic"]
    roadmap = generate_roadmap(topic)
    
    # Save the roadmap as a PDF
    filename = f"roadmap_{topic.replace(' ', '_')}.pdf"
    save_roadmap_to_pdf(roadmap, filename)
    
    return render_template_string(HTML_TEMPLATE, roadmap=roadmap, filename=filename)

@app.route("/download/<filename>")
def download_pdf(filename):
    return send_from_directory(pdf_directory, filename)

if __name__ == "__main__":
    app.run(debug=True, port=8080)
