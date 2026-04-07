"""
models.py - Database models and helper functions for the AI Study Planner.
Uses SQLite for simplicity and portability.
"""

import sqlite3
import os
import json
from datetime import datetime

# Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL')
DATABASE_PATH = os.getenv('DATABASE_PATH', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'study_planner.db'))

def get_db_type():
    """Returns 'postgres' or 'sqlite' based on environment."""
    if DATABASE_URL and (DATABASE_URL.startswith('postgres://') or DATABASE_URL.startswith('postgresql://')):
        return 'postgres'
    return 'sqlite'

def get_db():
    """Create and return a database connection based on environment."""
    db_type = get_db_type()
    
    if db_type == 'postgres':
        import psycopg2
        from psycopg2.extras import RealDictCursor
        # Handle Render's postgres:// vs postgresql://
        url = DATABASE_URL.replace('postgres://', 'postgresql://')
        conn = psycopg2.connect(url, cursor_factory=RealDictCursor)
        conn.autocommit = True
    else:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        
    return conn

def get_placeholder():
    """Returns '?' for SQLite or '%s' for Postgres."""
    return '%s' if get_db_type() == 'postgres' else '?'

def init_db():
    """Initialize the database tables for either SQLite or Postgres."""
    conn = get_db()
    cursor = conn.cursor()
    db_type = get_db_type()
    
    # Type mapping for database compatibility
    pk_type = "SERIAL PRIMARY KEY" if db_type == 'postgres' else "INTEGER PRIMARY KEY AUTOINCREMENT"
    text_type = "TEXT"
    json_type = "TEXT" # Both treat JSON as text in this simple implementation

    # ---- Study Plans table ----
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS study_plans (
            id {pk_type},
            subjects {text_type} NOT NULL,
            hours_per_day REAL NOT NULL,
            exam_date {text_type} NOT NULL,
            created_at {text_type} NOT NULL,
            plan_data {json_type} NOT NULL
        )
    ''')

    # ---- Progress table ----
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS progress (
            id {pk_type},
            plan_id INTEGER NOT NULL,
            date {text_type} NOT NULL,
            subject {text_type} NOT NULL,
            topic {text_type} NOT NULL,
            duration_minutes INTEGER NOT NULL,
            completed INTEGER DEFAULT 0,
            FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
        )
    ''')

    # ---- Reminders table ----
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS reminders (
            id {pk_type},
            plan_id INTEGER NOT NULL,
            message {text_type} NOT NULL,
            remind_date {text_type} NOT NULL,
            remind_time {text_type} DEFAULT '09:00',
            is_active INTEGER DEFAULT 1,
            created_at {text_type} NOT NULL,
            FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
        )
    ''')

    if db_type == 'sqlite':
        conn.commit()
    conn.close()
    print(f"Database ({db_type}) initialized successfully!")

def dict_from_row(row):
    """Convert a row object to a plain dictionary."""
    if row is None: return None
    # RealDictCursor in Postgres already returns a dict or dict-like
    return dict(row)
