import sys
import json
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'users.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            primary_concern TEXT DEFAULT 'Combined acne & hyperpigmentation',
            skin_type TEXT DEFAULT 'Combination',
            created_at TEXT NOT NULL
        )
    ''')
    
    # Pre-seed default demo accounts if table is empty
    cursor.execute('SELECT COUNT(*) as count FROM users')
    if cursor.fetchone()['count'] == 0:
        now = datetime.now().isoformat()
        cursor.executemany('''
            INSERT INTO users (id, name, email, password, role, primary_concern, skin_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', [
            ('a-1', 'Admin User', 'admin@gmail.com', '12345', 'admin', 'System Operations', 'N/A', now),
            ('u-1', 'Ananya Verma', 'ananya@dermat.com', 'password123', 'user', 'Acne & Sensitivity', 'Combination', now),
            ('c-1', 'Dr. Priya Sharma', 'priya.consultant@dermat.com', 'password123', 'consultant', 'Consultant Specialist', 'Normal', now),
            ('d-1', 'Dr. Sarah Johnson', 'dr.sarah@dermat.com', 'password123', 'dermatologist', 'Clinical Derm Specialist', 'Normal', now),
            ('d-2', 'Dr. Arjun Shah', 'arjun.shah@dermat.com', 'password123', 'dermatologist', 'Clinical Derm Specialist', 'Normal', now),
            ('u-2', 'Rohan Mehta', 'rohan@example.com', 'password123', 'user', 'Post-acne scars', 'Oily', now),
            ('u-3', 'Maya Patel', 'maya@example.com', 'password123', 'user', 'Rosacea & Flushing', 'Sensitive', now)
        ])
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Database initialized"}

def register_user(name, email, password, role, primary_concern="Acne & Hyperpigmentation", skin_type="Combination"):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if user already exists with this email
    cursor.execute('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', (email,))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return {"status": "error", "message": "An account with this email already exists. Please login instead."}
    
    prefix = 'u' if role == 'user' else ('c' if role == 'consultant' else 'd')
    user_id = f"{prefix}-{int(datetime.now().timestamp() * 1000)}"
    now = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO users (id, name, email, password, role, primary_concern, skin_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, name, email, password, role, primary_concern, skin_type, now))
    
    conn.commit()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = dict(cursor.fetchone())
    conn.close()
    
    # Exclude password in return
    user.pop('password', None)
    return {"status": "success", "user": user}

def login_user(email, password, role):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', (email,))
    user_row = cursor.fetchone()
    conn.close()
    
    if not user_row:
        return {
            "status": "error",
            "message": "Account not found. You are not registered yet! Please click 'Create Account' to sign up first."
        }
    
    user = dict(user_row)
    
    # Validate password
    if user['password'] != password:
        return {
            "status": "error",
            "message": "Invalid password. Please verify your credentials."
        }
        
    if user['role'].lower() != role.lower() and user['role'] != 'admin':
        return {
            "status": "error",
            "message": f"Role mismatch. This account is registered as a '{user['role']}', not '{role}'."
        }
        
    user.pop('password', None)
    return {"status": "success", "user": user}

def list_users(role=None):
    conn = get_db()
    cursor = conn.cursor()
    if role:
        cursor.execute('SELECT id, name, email, role, primary_concern, skin_type, created_at FROM users WHERE LOWER(role) = LOWER(?)', (role,))
    else:
        cursor.execute('SELECT id, name, email, role, primary_concern, skin_type, created_at FROM users')
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"status": "success", "users": users}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "No command provided"}))
        sys.exit(1)
        
    cmd = sys.argv[1]
    init_db()
    
    if cmd == 'init':
        res = {"status": "success", "message": "Database initialized"}
    elif cmd == 'register' and len(sys.argv) >= 6:
        name = sys.argv[2]
        email = sys.argv[3]
        password = sys.argv[4]
        role = sys.argv[5]
        concern = sys.argv[6] if len(sys.argv) > 6 else "Acne & Hyperpigmentation"
        stype = sys.argv[7] if len(sys.argv) > 7 else "Combination"
        res = register_user(name, email, password, role, concern, stype)
    elif cmd == 'login' and len(sys.argv) >= 5:
        email = sys.argv[2]
        password = sys.argv[3]
        role = sys.argv[4]
        res = login_user(email, password, role)
    elif cmd == 'list' and len(sys.argv) >= 3:
        res = list_users(sys.argv[2])
    else:
        res = {"status": "error", "message": "Invalid command or arguments"}
        
    print(json.dumps(res))
