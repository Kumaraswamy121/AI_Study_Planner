"""
scheduler.py - The core scheduling engine for the AI Study Planner.

This module takes user input (subjects, hours, deadline) and generates
an optimized daily study timetable. It uses a smart algorithm that:
  1. Distributes time based on subject priority/weight
  2. Rotates subjects to avoid monotony
  3. Includes breaks between study sessions
  4. Handles edge cases (too many subjects, too little time, etc.)
"""

from datetime import datetime, timedelta
import math


def generate_study_plan(subjects, hours_per_day, exam_date_str):
    """
    Generate a complete study plan.

    Args:
        subjects: list of dicts, each with:
            - name (str): Subject name
            - priority (str): 'high', 'medium', or 'low'
            - topics (list of str): Topics/chapters to cover
        hours_per_day: float, available study hours per day
        exam_date_str: str, deadline in 'YYYY-MM-DD' format

    Returns:
        dict with:
            - schedule: list of daily plans
            - summary: overview statistics
            - warnings: any issues found
    """
    warnings = []

    # --- Validate inputs ---
    if not subjects:
        return {"schedule": [], "summary": {}, "warnings": ["No subjects provided."]}

    if hours_per_day <= 0:
        return {"schedule": [], "summary": {}, "warnings": ["Study hours must be greater than 0."]}

    # Parse the exam date
    try:
        exam_date = datetime.strptime(exam_date_str, "%Y-%m-%d").date()
    except ValueError:
        return {"schedule": [], "summary": {}, "warnings": ["Invalid date format. Use YYYY-MM-DD."]}

    today = datetime.now().date()

    # Calculate available days (at least 1 day, max 180 days for performance)
    days_available = (exam_date - today).days
    
    if days_available > 180:
        days_available = 180
        warnings.append("Target date refined: System generates a maximum of 180 days (6 months) for optimal performance.")
    
    if days_available <= 0:
        days_available = 1
        warnings.append("Exam date is today or in the past! Creating a 1-day crash plan.")

    # --- Calculate priority weights ---
    # Higher priority = more study time
    priority_weights = {"high": 3, "medium": 2, "low": 1}

    # Build a list of all topics with their subject info
    all_topics = []
    for subject in subjects:
        weight = priority_weights.get(subject.get("priority", "medium"), 2)
        topics = subject.get("topics", [])
        if not topics:
            # If no topics provided, create a default one
            topics = [f"{subject['name']} - General Study"]
        for topic in topics:
            all_topics.append({
                "subject": subject["name"],
                "topic": topic,
                "priority": subject.get("priority", "medium"),
                "weight": weight
            })

    if not all_topics:
        return {"schedule": [], "summary": {}, "warnings": ["No topics to schedule."]}

    # --- Calculate time allocation ---
    total_weight = sum(t["weight"] for t in all_topics)
    total_study_minutes = int(hours_per_day * 60)

    # We subtract break time: 5 min break every 25 min (Pomodoro-style)
    effective_minutes = int(total_study_minutes * 0.85)  # ~15% for breaks

    if effective_minutes < 15:
        warnings.append("Very little study time available per day. Consider increasing hours.")

    # --- Distribute topics across days ---
    # Strategy: Round-robin with weighted repetition
    # High priority topics appear more frequently

    # Create a weighted topic pool
    weighted_pool = []
    for topic in all_topics:
        # Repeat based on weight (high=3x, med=2x, low=1x)
        weighted_pool.extend([topic] * topic["weight"])

    # Calculate how many sessions per day we can fit
    # Each session is ~25 minutes (Pomodoro) + 5 min break
    session_duration = 30  # 25 study + 5 break
    sessions_per_day = max(1, effective_minutes // 25)

    # Generate the daily schedule
    schedule = []
    topic_index = 0  # Cycles through the weighted pool

    for day_num in range(days_available):
        current_date = today + timedelta(days=day_num)
        day_plan = {
            "date": current_date.strftime("%Y-%m-%d"),
            "day_name": current_date.strftime("%A"),
            "day_number": day_num + 1,
            "sessions": [],
            "total_minutes": 0
        }

        # Track time used for this day
        minutes_used = 0
        start_hour = 9  # Default start time: 9:00 AM
        start_minute = 0

        for session_num in range(sessions_per_day):
            if minutes_used >= effective_minutes:
                break

            # Get the next topic from the weighted pool
            topic = weighted_pool[topic_index % len(weighted_pool)]
            topic_index += 1

            # Calculate session time
            remaining = effective_minutes - minutes_used
            study_time = min(25, remaining)  # Pomodoro: 25 min max

            if study_time < 5:
                break  # Not enough time for a meaningful session

            # Calculate start and end times
            session_start = f"{start_hour:02d}:{start_minute:02d}"
            end_total_minutes = start_hour * 60 + start_minute + study_time
            end_hour = end_total_minutes // 60
            end_min = end_total_minutes % 60
            session_end = f"{end_hour:02d}:{end_min:02d}"

            session = {
                "session_number": session_num + 1,
                "subject": topic["subject"],
                "topic": topic["topic"],
                "priority": topic["priority"],
                "start_time": session_start,
                "end_time": session_end,
                "duration_minutes": study_time,
                "type": "study"
            }
            day_plan["sessions"].append(session)

            minutes_used += study_time

            # Add break after study session
            break_duration = 5  # 5 min break
            break_start_total = end_total_minutes
            break_end_total = break_start_total + break_duration
            break_start_h = break_start_total // 60
            break_start_m = break_start_total % 60
            break_end_h = break_end_total // 60
            break_end_m = break_end_total % 60

            if session_num < sessions_per_day - 1:  # No break after last session
                day_plan["sessions"].append({
                    "session_number": session_num + 1,
                    "subject": "Break",
                    "topic": "Rest & Refresh",
                    "priority": "none",
                    "start_time": f"{break_start_h:02d}:{break_start_m:02d}",
                    "end_time": f"{break_end_h:02d}:{break_end_m:02d}",
                    "duration_minutes": break_duration,
                    "type": "break"
                })

            # Update start time for next session
            next_start = break_end_total if session_num < sessions_per_day - 1 else end_total_minutes
            start_hour = next_start // 60
            start_minute = next_start % 60

        day_plan["total_minutes"] = minutes_used
        schedule.append(day_plan)

    # --- Generate summary ---
    total_sessions = sum(
        len([s for s in day["sessions"] if s["type"] == "study"])
        for day in schedule
    )

    # Count sessions per subject
    subject_sessions = {}
    for day in schedule:
        for session in day["sessions"]:
            if session["type"] == "study":
                subj = session["subject"]
                if subj not in subject_sessions:
                    subject_sessions[subj] = {"sessions": 0, "minutes": 0}
                subject_sessions[subj]["sessions"] += 1
                subject_sessions[subj]["minutes"] += session["duration_minutes"]

    summary = {
        "total_days": days_available,
        "total_sessions": total_sessions,
        "total_study_hours": round(sum(
            day["total_minutes"] for day in schedule
        ) / 60, 1),
        "subjects_breakdown": subject_sessions,
        "hours_per_day": hours_per_day,
        "exam_date": exam_date_str
    }

    return {
        "schedule": schedule,
        "summary": summary,
        "warnings": warnings
    }
