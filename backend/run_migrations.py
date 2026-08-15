# backend/run_migrations.py

"""
MILESTONE 3 - Database Migration Script
Creates all new tables for Products & Recommendations without touching existing tables.
Run this once to add the new tables to your database.
"""

import sys
import os
from pathlib import Path

# Add the project root to Python path
sys.path.append(str(Path(__file__).parent.parent))

from backend.database import engine, Base
from backend import models  # This imports all models including the new ones

def run_migration():
    """Create all tables that don't already exist in the database"""
    print("=" * 60)
    print("🚀 Running Milestone 3 Database Migration")
    print("=" * 60)
    
    print("\n📋 Tables to be created (if they don't exist):")
    print("   - products")
    print("   - ingredient_knowledge")
    print("   - product_recommendations")
    print("   - reviews")
    print("\n⚠️  Existing tables will NOT be modified.")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("\n✅ All tables created successfully!")
        
        # Verify which tables exist
        from sqlalchemy import inspect
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        print("\n📊 Existing tables in database:")
        for table in sorted(existing_tables):
            print(f"   - {table}")
        
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        print("=" * 60)
        sys.exit(1)

if __name__ == "__main__":
    run_migration()