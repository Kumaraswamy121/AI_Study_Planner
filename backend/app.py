"""
app.py - Main Flask application for the AI Study Planner.

This is the backend server that:
  1. Accepts study plan requests from the frontend
  2. Generates optimized timetables using the scheduler
  3. Stores plans and progress in SQLite
  4. Provides REST API endpoints for all features

Run this file to start the backend server:
    python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from models import get_db, init_db, dict_from_row, get_db_type, get_placeholder
from scheduler import generate_study_plan
from ai_service import suggest_topics
from datetime import datetime
import os
import json
import io
from flask import send_file
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# ============================================================
# App Setup
# ============================================================
app = Flask(__name__)

# CORS configuration - Allow specific origin in production, everything in dev
ALLOWED_ORIGIN = os.getenv('ALLOWED_ORIGIN', '*')
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGIN}})


# ============================================================
# Initialize database when app starts
# ============================================================
with app.app_context():
    init_db()

# Get the right placeholder for the current database
PH = get_placeholder()


# ============================================================
# API ROUTES
# ============================================================

# ------ Root Route ------
@app.route("/", methods=["GET"])
def index():
    """Welcome message for the API root."""
    return jsonify({
        "name": "StudyAI Planner API",
        "version": "1.0.0",
        "status": "online",
        "documentation": "all endpoints start with /api/",
        "health_check": "/api/health"
    })


# ------ Health Check ------
@app.route("/api/health", methods=["GET"])
def health_check():
    """Simple endpoint to check if the server is running."""
    return jsonify({"status": "ok", "message": "AI Study Planner API is running!"})


# ------ Generate Study Plan ------
@app.route("/api/plans", methods=["POST"])
def create_plan():
    """
    Create a new study plan.

    Expected JSON body:
    {
        "subjects": [
            {
                "name": "Mathematics",
                "priority": "high",
                "topics": ["Algebra", "Calculus", "Geometry"]
            },
            ...
        ],
        "hours_per_day": 4,
        "exam_date": "2026-05-15"
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        if not data:
            return jsonify({"error": "No data provided. Send a JSON body."}), 400

        subjects = data.get("subjects", [])
        hours_per_day = data.get("hours_per_day", 0)
        exam_date = data.get("exam_date", "")

        # Input validation
        errors = []
        if not subjects or len(subjects) == 0:
            errors.append("At least one subject is required.")
        if not hours_per_day or float(hours_per_day) <= 0:
            errors.append("Study hours per day must be greater than 0.")
        if not exam_date:
            errors.append("Exam date is required.")

        # Validate each subject
        for i, subj in enumerate(subjects):
            if not subj.get("name", "").strip():
                errors.append(f"Subject {i+1} must have a name.")

        if errors:
            return jsonify({"error": "Validation failed.", "details": errors}), 400

        # Generate the study plan
        hours_per_day = float(hours_per_day)
        plan_result = generate_study_plan(subjects, hours_per_day, exam_date)

        # Store in database
        conn = get_db()
        cursor = conn.cursor()
        
        db_type = get_db_type()
        created_at = datetime.now().isoformat()
        
        if db_type == 'postgres':
            cursor.execute(
                f"INSERT INTO study_plans (subjects, hours_per_day, exam_date, created_at, plan_data) VALUES ({PH}, {PH}, {PH}, {PH}, {PH}) RETURNING id",
                (json.dumps(subjects), hours_per_day, exam_date, created_at, json.dumps(plan_result))
            )
            plan_id = cursor.fetchone()['id']
        else:
            cursor.execute(
                f"INSERT INTO study_plans (subjects, hours_per_day, exam_date, created_at, plan_data) VALUES ({PH}, {PH}, {PH}, {PH}, {PH})",
                (json.dumps(subjects), hours_per_day, exam_date, created_at, json.dumps(plan_result))
            )
            plan_id = cursor.lastrowid

        # Also create progress entries for each study session
        for day in plan_result.get("schedule", []):
            for session in day.get("sessions", []):
                if session["type"] == "study":
                    cursor.execute(
                        f"INSERT INTO progress (plan_id, date, subject, topic, duration_minutes, completed) VALUES ({PH}, {PH}, {PH}, {PH}, {PH}, 0)",
                        (plan_id, day["date"], session["subject"], session["topic"], session["duration_minutes"])
                    )
        
        if db_type == 'sqlite':
            conn.commit()
        conn.close()

        return jsonify({
            "id": plan_id,
            "plan": plan_result,
            "message": "Study plan created successfully!"
        }), 201

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# ------ Get All Plans ------
@app.route("/api/plans", methods=["GET"])
def get_plans():
    """Get a list of all saved study plans."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM study_plans ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()

        plans = []
        for row in rows:
            plan = dict_from_row(row)
            plan["subjects"] = json.loads(plan["subjects"])
            plan["plan_data"] = json.loads(plan["plan_data"])
            plans.append(plan)

        return jsonify(plans), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# ------ Get Single Plan ------
@app.route("/api/plans/<int:plan_id>", methods=["GET"])
def get_plan(plan_id):
    """Get a specific study plan by ID."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM study_plans WHERE id = {PH}", (plan_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({"error": "Plan not found."}), 404

        plan = dict_from_row(row)
        plan["subjects"] = json.loads(plan["subjects"])
        plan["plan_data"] = json.loads(plan["plan_data"])

        return jsonify(plan), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# ------ Delete a Plan ------
@app.route("/api/plans/<int:plan_id>", methods=["DELETE"])
def delete_plan(plan_id):
    """Delete a study plan and all its progress entries."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM progress WHERE plan_id = {PH}", (plan_id,))
        cursor.execute(f"DELETE FROM reminders WHERE plan_id = {PH}", (plan_id,))
        cursor.execute(f"DELETE FROM study_plans WHERE id = {PH}", (plan_id,))
        
        if get_db_type() == 'sqlite':
            conn.commit()

        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Plan not found."}), 404

        conn.close()
        return jsonify({"message": "Plan deleted successfully."}), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# ------ Get Progress for a Plan ------
@app.route("/api/plans/<int:plan_id>/progress", methods=["GET"])
def get_progress(plan_id):
    """Get all progress entries for a specific plan."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            f"SELECT * FROM progress WHERE plan_id = {PH} ORDER BY date, id",
            (plan_id,)
        )
        rows = cursor.fetchall()
        conn.close()

        progress = [dict_from_row(row) for row in rows]

        # Calculate summary statistics
        total = len(progress)
        completed = sum(1 for p in progress if p["completed"])
        percentage = round((completed / total * 100), 1) if total > 0 else 0

        # Per-subject breakdown
        subject_progress = {}
        for p in progress:
            subj = p["subject"]
            if subj not in subject_progress:
                subject_progress[subj] = {"total": 0, "completed": 0}
            subject_progress[subj]["total"] += 1
            if p["completed"]:
                subject_progress[subj]["completed"] += 1

        for subj in subject_progress:
            s = subject_progress[subj]
            s["percentage"] = round((s["completed"] / s["total"] * 100), 1) if s["total"] > 0 else 0

        return jsonify({
            "progress": progress,
            "summary": {
                "total_tasks": total,
                "completed_tasks": completed,
                "percentage": percentage,
                "by_subject": subject_progress
            }
        }), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# ------ Toggle Task Completion ------
@app.route("/api/progress/<int:progress_id>/toggle", methods=["PATCH"])
def toggle_progress(progress_id):
    """Mark a task as completed or uncompleted."""
    try:
        conn = get_db()
        cursor = conn.cursor()

        # Get current status
        cursor.execute(f"SELECT completed FROM progress WHERE id = {PH}", (progress_id,))
        row = cursor.fetchone()

        if not row:
            conn.close()
            return jsonify({"error": "Progress entry not found."}), 404

        # Toggle: 0 -> 1 or 1 -> 0
        new_status = 0 if row["completed"] else 1
        cursor.execute(
            f"UPDATE progress SET completed = {PH} WHERE id = {PH}",
            (new_status, progress_id)
        )
        
        if get_db_type() == 'sqlite':
            conn.commit()
        conn.close()

        return jsonify({
            "id": progress_id,
            "completed": new_status,
            "message": "Task updated!"
        }), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# ------ Update a session (edit timetable) ------
@app.route("/api/progress/<int:progress_id>", methods=["PATCH"])
def update_progress_entry(progress_id):
    """Update a specific progress/session entry (for timetable editing)."""
    try:
        data = request.get_json()
        conn = get_db()
        cursor = conn.cursor()

        # Build dynamic update query
        updates = []
        values = []
        allowed_fields = ["subject", "topic", "duration_minutes", "date"]

        for field in allowed_fields:
            if field in data:
                updates.append(f"{field} = ?")
                values.append(data[field])

        if not updates:
            conn.close()
            return jsonify({"error": "No valid fields to update."}), 400

        values.append(progress_id)
        query = f"UPDATE progress SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()

        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Entry not found."}), 404

        conn.close()
        return jsonify({"message": "Entry updated successfully."}), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# ------ Reminders ------
@app.route("/api/plans/<int:plan_id>/reminders", methods=["GET"])
def get_reminders(plan_id):
    """Get all reminders for a plan."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM reminders WHERE plan_id = ? ORDER BY remind_date, remind_time",
            (plan_id,)
        )
        rows = cursor.fetchall()
        conn.close()

        return jsonify([dict_from_row(row) for row in rows]), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route("/api/plans/<int:plan_id>/reminders", methods=["POST"])
def create_reminder(plan_id):
    """Create a new reminder for a plan."""
    try:
        data = request.get_json()

        message = data.get("message", "").strip()
        remind_date = data.get("remind_date", "")
        remind_time = data.get("remind_time", "09:00")

        if not message:
            return jsonify({"error": "Reminder message is required."}), 400
        if not remind_date:
            return jsonify({"error": "Reminder date is required."}), 400

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            f"INSERT INTO reminders (plan_id, message, remind_date, remind_time, is_active, created_at) VALUES ({PH}, {PH}, {PH}, {PH}, 1, {PH})",
            (plan_id, message, remind_date, remind_time, datetime.now().isoformat())
        )
        if get_db_type() == 'sqlite':
            conn.commit()
        reminder_id = cursor.lastrowid
        conn.close()

        return jsonify({"id": reminder_id, "message": "Reminder created!"}), 201

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route("/api/reminders/<int:reminder_id>", methods=["DELETE"])
def delete_reminder(reminder_id):
    """Delete a reminder."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM reminders WHERE id = {PH}", (reminder_id,))
        if get_db_type() == 'sqlite':
            conn.commit()
        conn.close()

        return jsonify({"message": "Reminder deleted."}), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route("/api/reminders/<int:reminder_id>/dismiss", methods=["PATCH"])
def dismiss_reminder(reminder_id):
    """Dismiss/deactivate a reminder."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE reminders SET is_active = 0 WHERE id = {PH}",
            (reminder_id,)
        )
        if get_db_type() == 'sqlite':
            conn.commit()
        conn.close()

        return jsonify({"message": "Reminder dismissed."}), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# ------ AI Topic Suggestions ------
@app.route("/api/ai/suggest", methods=["POST"])
def suggest_subject_topics():
    """Return suggested topics for a given subject name."""
    try:
        data = request.get_json()
        subject_name = data.get("subject_name", "").strip()
        
        if not subject_name:
            return jsonify({"topics": []}), 200
            
        topics = suggest_topics(subject_name)
        return jsonify({"topics": topics}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------ PDF Export ------
@app.route("/api/plans/<int:plan_id>/export", methods=["GET"])
def export_plan_pdf(plan_id):
    """Generate and return a PDF version of the study plan."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM study_plans WHERE id = {PH}", (plan_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({"error": "Plan not found."}), 404

        plan = dict_from_row(row)
        plan_data = json.loads(plan["plan_data"])
        subjects = json.loads(plan["subjects"])

        # Create a byte buffer for the PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
        
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        subtitle_style = styles['Heading2']
        normal_style = styles['Normal']
        
        # Add custom style for "StudyAI" branding
        brand_style = ParagraphStyle(
            'BrandStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.grey,
            spaceAfter=20
        )

        elements = []

        # --- Header ---
        elements.append(Paragraph("StudyAI: Smart Study Schedule", title_style))
        elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y')}", brand_style))
        elements.append(Spacer(1, 12))

        # --- Summary Section ---
        elements.append(Paragraph("Plan Overview", subtitle_style))
        summary = plan_data.get("summary", {})
        summary_text = [
            f"<b>Target Date:</b> {plan['exam_date']}",
            f"<b>Daily Study Load:</b> {plan['hours_per_day']} hours",
            f"<b>Total Sessions:</b> {summary.get('total_sessions', 0)}",
            f"<b>Estimated Study Time:</b> {summary.get('total_study_hours', 0)} hours"
        ]
        for line in summary_text:
            elements.append(Paragraph(line, normal_style))
        elements.append(Spacer(1, 20))

        # --- Timetable Section ---
        elements.append(Paragraph("Daily Timetable", subtitle_style))
        
        for day in plan_data.get("schedule", []):
            elements.append(Paragraph(f"Day {day['day_number']} - {day['day_name']} ({day['date']})", styles['Heading3']))
            
            # Table Data
            data = [["Time", "Subject", "Topic", "Duration"]]
            for session in day.get("sessions", []):
                # Highlight breaks differently if needed, but here just simple list
                data.append([
                    f"{session['start_time']} - {session['end_time']}",
                    session['subject'],
                    session['topic'][:40] + ("..." if len(session['topic']) > 40 else ""),
                    f"{session['duration_minutes']}m"
                ])
            
            # Create Table
            t = Table(data, colWidths=[100, 100, 200, 60])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('TOPPADDING', (0, 0), (-1, 0), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 15))

        # Build PDF
        doc.build(elements)
        buffer.seek(0)

        filename = f"StudyPlan_{plan_id}.pdf"
        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )

    except Exception as e:
        return jsonify({"error": f"PDF Generation failed: {str(e)}"}), 500


# ============================================================
# Run the Server
# ============================================================
if __name__ == "__main__":
    # Get port from environment (Render/Heroku set this automatically)
    port = int(os.getenv("PORT", 5001))
    
    print(f"\nAI Study Planner Backend starting on port {port}...")
    print("=" * 40)
    print(f"Server accessible at: http://0.0.0.0:{port}")
    print("=" * 40 + "\n")
    
    # In production, this file is usually run by gunicorn, not directly.
    # If run directly (dev), we use debug mode.
    app.run(host='0.0.0.0', port=port, debug=(os.getenv('FLASK_ENV') != 'production'))
