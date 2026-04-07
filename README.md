# 🎓 AI Study Planner

A smart system that generates personalized study timetables based on your subjects, available time, and deadlines. Built with **React**, **Flask**, and **SQLite**.

## 🌟 Features

-   **Smart Scheduling**: Automatically divides study time based on subject priority.
-   **Pomodoro Integration**: Includes built-in breaks (25 min study / 5 min rest).
-   **Progress Tracking**: Mark topics as completed and view your progress percentage.
-   **Subject Analytics**: Visual breakdown of your progress per subject.
-   **Reminders**: Set custom alerts for important tasks.
-   **Timetable Editing**: Modify your schedule on the fly.
-   **Persistent Storage**: All your data is saved in a local SQLite database.

---

## 🛠️ Installation & Setup

Follow these steps to get the project running on your local machine.

### 1. Prerequisite Checks
-   Ensure you have **Node.js** (v18+) and **Python** (v3.9+) installed.
-   Open your terminal/command prompt.

### 2. Backend Setup (Flask)
```bash
# Navigate to backend folder
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv
# Activate it:
# On Windows: 
venv\Scripts\activate
# On Mac/Linux: 
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```
The backend will run at `http://localhost:5000`.

### 3. Frontend Setup (React + Vite)
```bash
# Open a NEW terminal window/tab
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend will run at `http://localhost:5173`.

---

## 📝 Sample Test Input

To test the generator, try the following values in the **Create Plan** tab:

1.  **Subjects**:
    -   Name: `Advanced Calculus` | Priority: `High` | Topics: `Limits, Derivatives, Integrals, Series`
    -   Name: `World History` | Priority: `Medium` | Topics: `French Revolution, Industrialization, Cold War`
    -   Name: `Python Programming` | Priority: `Low` | Topics: `Data Structures, OOP, Web Frameworks`
2.  **Study Hours Per Day**: `4`
3.  **Exam Date**: Select a date roughly **7 days** from today.
4.  **Click**: `🎯 Generate Study Plan`

---

## 📅 Example Output

Once generated, you will see a detailed day-wise timetable.
-   **Day 1**: 09:00 - 09:25 (Calculus), 09:30 - 09:55 (Calculus), 10:00 - 10:25 (History)...
-   **Progress**: Head to the **Progress** tab to see your cumulative completion bar and individual subject charts.
-   **Reminders**: Add a reminder like "Finish Calculus Integrals worksheet" for tomorrow.

---

## 📁 Folder Structure

```text
study_planner/
├── backend/
│   ├── app.py           # Flask Main Server
│   ├── models.py        # Database Schema (SQLite)
│   ├── scheduler.py     # AI Scheduling Logic
│   ├── requirements.txt # Python Dependencies
│   └── study_planner.db # Created automatically on first run
└── frontend/
    ├── src/
    │   ├── components/  # All UI Modules
    │   ├── api.js       # Backend integration layer
    │   ├── App.jsx      # Main Application UI
    │   ├── index.css    # Premium Styling
    │   └── main.jsx     # Logic Entry
    └── index.html       # HTML Root
```

---

## 💡 Troubleshooting

-   **CORS Error**: Ensure the Flask server is running at `http://localhost:5000`.
-   **Port Conflict**: If port 5000 or 5173 is occupied, you might need to change them in `app.py` or `vite.config.js`.
-   **Empty Input**: The app will show a red alert box if you try to generate a plan with missing fields.
