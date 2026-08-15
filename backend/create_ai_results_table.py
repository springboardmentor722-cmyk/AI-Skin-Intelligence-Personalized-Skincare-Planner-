# backend/create_ai_results_table.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine
from sqlalchemy import inspect, text

def create_table():
    print("=" * 60)
    print("🔧 CREATING AI ANALYSIS RESULTS TABLE")
    print("=" * 60)
    
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    if 'ai_analysis_results' not in existing_tables:
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE ai_analysis_results (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    image_url VARCHAR,
                    predicted_concern VARCHAR NOT NULL,
                    confidence FLOAT NOT NULL,
                    all_predictions JSONB DEFAULT '[]',
                    recommendations JSONB DEFAULT '[]',
                    routine_suggestions JSONB DEFAULT '[]',
                    general_instructions JSONB DEFAULT '[]',
                    user_feedback JSONB DEFAULT '{}',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
            print("✅ ai_analysis_results table created")
    else:
        print("✅ ai_analysis_results already exists")
    
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\n📊 Tables: {len(tables)}")
    for t in sorted(tables):
        print(f"  - {t}")
    
    print("\n✅ DONE!")

if __name__ == "__main__":
    create_table()