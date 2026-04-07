"""
models.py - Database models and helper functions for the AI Study Planner.
Uses SQLite for simplicity and portability.
"""

import sqlite3
import os
import json
from datetime import datetime

# Path to the SQLite database file
# Defaults to local directory in dev, can be set to a persistent volume path in production
DATABASE_PATH = os.getenv('DATABASE_PATH', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'study_planner.db'))


def get_db():
    """
    Create and return a database connection.
    Uses row_factory so we can access columns by name.
    """
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Allows dict-like access to rows
    conn.execute("PRAGMA foreign_keys = ON")  # Enable foreign key support
    return conn


def init_db():
    """
    Initialize the database by creating all required tables.
    Called once when the app starts.
    """
    conn = get_db()
    cursor = conn.cursor()

    # ---- Study Plans table ----
    # Stores each generated study plan along with user input
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS study_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subjects TEXT NOT NULL,           -- JSON array of subject objects
            hours_per_day REAL NOT NULL,      -- Available study hours per day
            exam_date TEXT NOT NULL,          -- Target exam/deadline date (YYYY-MM-DD)
            created_at TEXT NOT NULL,         -- When the plan was created
            plan_data TEXT NOT NULL           -- JSON of the generated timetable
        )
    ''')

    # ---- Progress table ----
    # Tracks completion status for each task in a study plan
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id INTEGER NOT NULL,         -- Which study plan this belongs to
            date TEXT NOT NULL,               -- The date of this task (YYYY-MM-DD)
            subject TEXT NOT NULL,            -- Subject name
            topic TEXT NOT NULL,              -- Topic/chapter name
            duration_minutes INTEGER NOT NULL, -- Planned duration in minutes
            completed INTEGER DEFAULT 0,      -- 0 = not done, 1 = done
            FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
        )
    ''')

    # ---- Reminders table ----
    # Stores simple reminders for the user
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            remind_date TEXT NOT NULL,         -- Date to show reminder (YYYY-MM-DD)
            remind_time TEXT DEFAULT '09:00',  -- Time to remind (HH:MM)
            is_active INTEGER DEFAULT 1,       -- 1 = active, 0 = dismissed
            created_at TEXT NOT NULL,
            FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()
    print("Database initialized successfully!")


def dict_from_row(row):
    """Convert a sqlite3.Row object to a plain dictionary."""
    if row is None:
        return None
    return dict(row)
