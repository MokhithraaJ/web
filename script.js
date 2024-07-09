let currentUser = null;
let currentRole = null;
let evaluationData = [];

function showPage(pageId, role) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
    if (role) currentRole = role;
    if (pageId === 'analysis') {
        showAnalysis();
    }
    if (pageId === 'marks') {
        generateMarksPage();
    }
}

async function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('login.csv');
        const csvData = await response.text();
        const users = parseCSV(csvData);

        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            currentUser = user;
            showPage(user.role + 'Dashboard');
            if (user.role === 'teacher') {
                document.getElementById('teacherInfo').textContent = `Welcome, ${user.name}!`;
            }
        } else {
            alert('Invalid username or password');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while logging in');
    }

    return false;
}

function parseCSV(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index].trim();
            return obj;
        }, {});
    });
}

function generateTopicFields() {
    const numTopics = parseInt(document.getElementById('numTopics').value);
    const topicFields = document.getElementById('topicFields');
    topicFields.innerHTML = '';

    for (let i = 1; i <= numTopics; i++) {
        const topicDiv = document.createElement('div');
        topicDiv.classList.add('topic');
        topicDiv.innerHTML = `
            <input type="text" id="topic${i}" placeholder="Topic ${i}">
            <input type="number" id="questions${i}" placeholder="Number of Questions" min="1">
        `;
        topicFields.appendChild(topicDiv);
    }

    document.getElementById('nextButton').style.display = 'block';
}

function generateMarksPage() {
    const topicButtons = document.getElementById('topicButtons');
    const questions = document.getElementById('questions');
    topicButtons.innerHTML = '';
    questions.innerHTML = '';

    const numTopics = parseInt(document.getElementById('numTopics').value);

    for (let i = 1; i <= numTopics; i++) {
        const topicName = document.getElementById(`topic${i}`).value;
        const numQuestions = parseInt(document.getElementById(`questions${i}`).value);

        const topicButton = document.createElement('button');
        topicButton.textContent = topicName;
        topicButton.onclick = () => showQuestions(i);
        topicButtons.appendChild(topicButton);

        const questionsDiv = document.createElement('div');
        questionsDiv.id = `questions${i}`;
        questionsDiv.style.display = 'none';

        for (let j = 1; j <= numQuestions; j++) {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('question-container');
            questionDiv.innerHTML = `
                <span class="question-text">Q${j}:</span>
                <div class="options">
                    <label><input type="radio" name="q${i}_${j}" value="correct"> Correct</label>
                    <label><input type="radio" name="q${i}_${j}" value="partial"> Partial</label>
                    <label><input type="radio" name="q${i}_${j}" value="wrong"> Wrong</label>
                </div>
            `;
            questionsDiv.appendChild(questionDiv);
        }

        questions.appendChild(questionsDiv);
    }

    document.getElementById('finishButton').style.display = 'block';
}

function showQuestions(topicIndex) {
    document.querySelectorAll('[id^="questions"]').forEach(div => div.style.display = 'none');
    document.getElementById(`questions${topicIndex}`).style.display = 'block';
}

async function finish() {
    const examType = document.getElementById('examType').value;
    const numTopics = parseInt(document.getElementById('numTopics').value);
    const data = [];

    for (let i = 1; i <= numTopics; i++) {
        const topicName = document.getElementById(`topic${i}`).value;
        const numQuestions = parseInt(document.getElementById(`questions${i}`).value);

        for (let j = 1; j <= numQuestions; j++) {
            const answer = document.querySelector(`input[name="q${i}_${j}"]:checked`);
            if (answer) {
                data.push({
                    examType,
                    topic: topicName,
                    question: j,
                    answer: answer.value
                });
            }
        }
    }

    try {
        const response = await fetch('evaluation_data.csv', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/csv'
            },
            body: data.map(row => Object.values(row).join(',')).join('\n')
        });

        if (response.ok) {
            alert('Evaluation data saved successfully');
            showPage(currentRole + 'Dashboard');
        } else {
            throw new Error('Failed to save evaluation data');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while saving evaluation data');
    }
}

function logout() {
    currentUser = null;
    currentRole = null;
    showPage('home');
}

function showAnalysis() {
    generateErrorAnalysis();
    generatePerformanceBySection();
    generateAnswerDistribution();
    generateOverallUnderstanding();
}

function generateErrorAnalysis() {
    const ctx = document.getElementById('errorAnalysisChart').getContext('2d');
    new Chart(ctx, {
        type: 'heatmap',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
            datasets: [{
                label: 'Error Frequency',
                data: [
                    {x: 'Topic 1', y: 'Q1', v: 10},
                    {x: 'Topic 1', y: 'Q2', v: 20},
                    {x: 'Topic 2', y: 'Q1', v: 30},
                    {x: 'Topic 2', y: 'Q2', v: 40},
                    {x: 'Topic 3', y: 'Q1', v: 50},
                ],
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'category',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Topics'
                    }
                },
                y: {
                    type: 'category',
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Questions'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return `${context[0].raw.x}, ${context[0].raw.y}`;
                        },
                        label: function(context) {
                            return `Error Frequency: ${context.raw.v}`;
                        }
                    }
                }
            }
        }
    });
}

function generatePerformanceBySection() {
    const ctx = document.getElementById('performanceBySectionChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Section 1', 'Section 2', 'Section 3'],
            datasets: [
                {
                    label: 'Correct',
                    data: [65, 59, 80],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                },
                {
                    label: 'Partial',
                    data: [28, 48, 40],
                    backgroundColor: 'rgba(255, 206, 86, 0.6)',
                },
                {
                    label: 'Wrong',
                    data: [15, 15, 10],
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}

function generateAnswerDistribution() {
    const ctx = document.getElementById('answerDistributionChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Correct', 'Partial', 'Wrong'],
            datasets: [{
                data: [300, 50, 100],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Answer Distribution'
                }
            }
        }
    });
}

function generateOverallUnderstanding() {
    const ctx = document.getElementById('overallUnderstandingChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
            datasets: [{
                label: 'Understanding Level',
                data: [85, 72, 90, 60, 75],
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Understanding Level (%)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Overall Understanding by Question'
                }
            }
        }
    });
}