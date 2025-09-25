import google.generativeai as genai
from flask import Flask, request, render_template_string
import logging
import os

# Initialize Flask app
app = Flask(__name__)

# Initialize Gemini Pro API
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))  # Replace with your Gemini API key

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Store the transcript for the quiz generator
TRANSCRIPT = """Web development is the work involved in developing a website for the Internet (World Wide Web) or an intranet (a private network).[1] Web development can range from developing a simple single static page of plain text to complex web applications, electronic businesses, and social network services. A more comprehensive list of tasks to which Web development commonly refers, may include Web engineering, Web design, Web content development, client liaison, client-side/server-side scripting, Web server and network security configuration, and e-commerce development.
Among Web professionals, "Web development" usually refers to the main non-design aspects of building Web sites: writing markup and coding.[2] Web development may use content management systems (CMS) to make content changes easier and available with basic technical skills.
For larger organizations and businesses, Web development teams can consist of hundreds of people (Web developers) and follow standard methods like Agile methodologies while developing Web sites.[1] Smaller organizations may only require a single permanent or contracting developer, or secondary assignment to related job positions such as a graphic designer or information systems technician. Web development may be a collaborative effort between departments rather than the domain of a designated department. There are three kinds of Web developer specialization: front-end developer, back-end developer, and full-stack developer.[3] Front-end developers are responsible for behavior and visuals that run in the user browser, while back-end developers deal with the servers.[4] Since the commercialization of the Web, the industry has boomed and has become one of the most used technologies ever."""  # Truncated for brevity

# HTML Template for Quiz UI
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Quiz Generator</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
</head>
<body>
    <div class="container mt-5">
        <h1 class="text-center text-primary">AI Quiz Generator</h1>

        {% if not quiz_submitted %}
        <form method="POST" action="/submit_quiz">
            {% for idx, (question, options) in enumerate(quiz_questions.items()) %}
            <div class="mb-4">
                <strong>Q{{ idx + 1 }}. {{ question }}</strong>
                <div class="mt-2">
                    {% for option in options %}
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="q{{ idx }}" id="q{{ idx }}_{{ loop.index }}" value="{{ option }}" required>
                        <label class="form-check-label" for="q{{ idx }}_{{ loop.index }}">
                            {{ option }}
                        </label>
                    </div>
                    {% endfor %}
                </div>
            </div>
            {% endfor %}
            <button type="submit" class="btn btn-primary">Submit Quiz</button>
        </form>
        {% else %}
        <div class="text-center">
            <h2 class="text-success">Quiz Completed!</h2>
            <p>You scored {{ score }}/{{ total_questions }}</p>
            <div class="progress mb-4" style="height: 30px;">
                <div class="progress-bar" role="progressbar" style="width: {{ (score / total_questions) * 100 }}%;" aria-valuenow="{{ score }}" aria-valuemin="0" aria-valuemax="{{ total_questions }}">
                    {{ (score / total_questions) * 100 }}%
                </div>
            </div>
            <h3 class="text-primary">Correct Answers</h3>
            <ul class="list-group">
                {% for idx, question in enumerate(quiz_questions.keys()) %}
                <li class="list-group-item">
                    <strong>Q{{ idx + 1 }}. {{ question }}</strong><br>
                    Your Answer: <span class="text-{{ 'success' if user_answers[question] == correct_answers[question] else 'danger' }}">
                        {{ user_answers[question] or 'Not answered' }}</span><br>
                    Correct Answer: <span class="text-success">{{ correct_answers[question] }}</span>
                </li>
                {% endfor %}
            </ul>
        </div>
        {% endif %}
    </div>
</body>
</html>
"""

# Generate MCQs based on the transcript
def generate_quiz_questions():
    prompt = (
        f"Generate 8-10 multiple-choice questions with 4 options each from the following transcript. "
        f"Each question should have the following format:\n\n"
        f"Q: [Question Text]\n"
        f"A. [Option 1]\n"
        f"B. [Option 2]\n"
        f"C. [Option 3]\n"
        f"D. [Option 4]\n"
        f"Correct Answer: [Correct Option]\n\n"
        f"Transcript:\n\n{TRANSCRIPT}"
    )
    response = genai.GenerativeModel("gemini-2.0-flash").generate_content(prompt)

    # Debug: Print the API response
    logging.debug("API Response:\n%s", response.text)

    # Parse the response into questions, options, and correct answers
    questions = {}
    correct_answers = {}
    current_question = None
    correct_option = None

    for line in response.text.splitlines():
        line = line.strip()
        if line.startswith("Q:"):
            current_question = line[2:].strip()
            questions[current_question] = []
        elif line.startswith(("A.", "B.", "C.", "D.")):
            questions[current_question].append(line[2:].strip())
        elif line.startswith("Correct Answer:"):
            correct_option = line.split(":")[1].strip()
            correct_answers[current_question] = correct_option

    # Normalize the question and correct answer for easy comparison
    questions = {key.strip().lower(): value for key, value in questions.items()}
    correct_answers = {key.strip().lower(): value for key, value in correct_answers.items()}

    return questions, correct_answers

# Global variables
QUIZ_QUESTIONS, CORRECT_ANSWERS = {}, {}
QUIZ_SUBMITTED = False
SCORE = 0

@app.route("/", methods=["GET"])
def home():
    global QUIZ_QUESTIONS, QUIZ_SUBMITTED, SCORE
    if not QUIZ_QUESTIONS:
        QUIZ_QUESTIONS, CORRECT_ANSWERS = generate_quiz_questions()
    return render_template_string(
        HTML_TEMPLATE,
        quiz_questions=QUIZ_QUESTIONS,
        quiz_submitted=QUIZ_SUBMITTED,
        score=SCORE,
        total_questions=len(QUIZ_QUESTIONS),
        enumerate=enumerate,
    )

@app.route("/submit_quiz", methods=["POST"])
def submit_quiz():
    global QUIZ_QUESTIONS, CORRECT_ANSWERS, QUIZ_SUBMITTED, SCORE
    QUIZ_SUBMITTED = True
    SCORE = 0
    user_answers = {}

    # Calculate score
    for idx, question in enumerate(QUIZ_QUESTIONS.keys()):
        user_answer = request.form.get(f"q{idx}")
        user_answers[question.strip().lower()] = user_answer  # Store user's answer
        
        correct_answer = CORRECT_ANSWERS.get(question.strip().lower())
        
        # Log user answer and correct answer for debugging
        logging.debug("User Answer for Q%d: %s", idx, user_answer)
        logging.debug("Correct Answer for Q%d: %s", idx, correct_answer)
        
        # Normalize both answers for comparison
        if user_answer and correct_answer:
            if user_answer.strip().lower() == correct_answer.strip().lower():
                SCORE += 1

    # Log the final score
    logging.debug("Final Score: %d", SCORE)

    return render_template_string(
        HTML_TEMPLATE,
        quiz_questions=QUIZ_QUESTIONS,
        correct_answers=CORRECT_ANSWERS,
        user_answers=user_answers,
        quiz_submitted=QUIZ_SUBMITTED,
        score=SCORE,
        total_questions=len(QUIZ_QUESTIONS),
        enumerate=enumerate,
    )

if __name__ == "__main__":
    app.run(debug=True, port=5000)
