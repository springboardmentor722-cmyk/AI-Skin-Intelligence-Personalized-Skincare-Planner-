import os
from sqlalchemy import text
from backend.database import engine, SessionLocal
from backend.seed_admin import create_admin_user

def seed_routine_matrix():
    db = SessionLocal()
    try:
        db.execute(text("DELETE FROM routine_step_matrix"))
        db.commit()
        
        matrix_data = [
            ("Oily", "AM", 1, "Cleansing", "Use a foaming or salicylic acid cleanser", False),
            ("Oily", "AM", 2, "Treatment", "Apply niacinamide or salicylic acid serum", False),
            ("Oily", "AM", 3, "Sun Protection", "Apply oil-free SPF 50+ sunscreen", False),
            ("Oily", "PM", 1, "Cleansing", "Double cleanse with oil-based then water-based cleanser", False),
            ("Oily", "PM", 2, "Treatment", "Apply retinol or salicylic acid treatment", False),
            ("Oily", "PM", 3, "Night Care", "Apply oil-free moisturizer with niacinamide", False),
            ("Oily", "Weekly", 1, "Exfoliation", "Apply BHA or AHA exfoliant (2-3 times per week)", False),
            ("Oily", "Weekly", 2, "Treatment", "Use a clay mask once a week", False),
            
            ("Dry", "AM", 1, "Cleansing", "Use a hydrating cream cleanser", False),
            ("Dry", "AM", 2, "Moisturizing", "Apply hyaluronic acid serum", False),
            ("Dry", "AM", 3, "Sun Protection", "Apply moisturizing SPF 50+ sunscreen", False),
            ("Dry", "PM", 1, "Cleansing", "Use a milk or cream cleanser", False),
            ("Dry", "PM", 2, "Treatment", "Apply gentle retinol or peptides", False),
            ("Dry", "PM", 3, "Night Care", "Apply a rich moisturizer with ceramides", False),
            ("Dry", "Weekly", 1, "Exfoliation", "Apply gentle PHA exfoliant (once a week)", False),
            ("Dry", "Weekly", 2, "Treatment", "Use a hydrating mask once a week", False),
            
            ("Sensitive", "AM", 1, "Cleansing", "Use a gentle, fragrance-free cleanser", False),
            ("Sensitive", "AM", 2, "Moisturizing", "Apply calming serum with centella asiatica", False),
            ("Sensitive", "AM", 3, "Sun Protection", "Apply mineral SPF 50+ sunscreen", False),
            ("Sensitive", "PM", 1, "Cleansing", "Use a gentle micellar water", False),
            ("Sensitive", "PM", 2, "Treatment", "Apply cica or ceramide cream for repair", False),
            ("Sensitive", "PM", 3, "Night Care", "Apply a soothing night cream", False),
            ("Sensitive", "Weekly", 1, "Treatment", "Use a calming or hydrating sheet mask", False),
            
            ("Combination", "AM", 1, "Cleansing", "Use a balancing gel cleanser", False),
            ("Combination", "AM", 2, "Treatment", "Apply niacinamide serum", False),
            ("Combination", "AM", 3, "Sun Protection", "Apply lightweight SPF 50+ sunscreen", False),
            ("Combination", "PM", 1, "Cleansing", "Double cleanse with balancing cleansers", False),
            ("Combination", "PM", 2, "Treatment", "Apply retinol (2-3 times per week)", False),
            ("Combination", "PM", 3, "Night Care", "Apply lightweight moisturizer", False),
            ("Combination", "Weekly", 1, "Exfoliation", "Apply BHA exfoliant (once a week)", False),
            ("Combination", "Weekly", 2, "Treatment", "Use a clay mask on T-zone", False),
            
            ("Normal", "AM", 1, "Cleansing", "Use a gentle cleanser", False),
            ("Normal", "AM", 2, "Moisturizing", "Apply vitamin C serum", False),
            ("Normal", "AM", 3, "Sun Protection", "Apply SPF 50+ sunscreen", False),
            ("Normal", "PM", 1, "Cleansing", "Double cleanse", False),
            ("Normal", "PM", 2, "Treatment", "Apply retinol or peptides", False),
            ("Normal", "PM", 3, "Night Care", "Apply moisturizer", False),
            ("Normal", "Weekly", 1, "Exfoliation", "Apply AHA/BHA exfoliant (1-2 times per week)", False),
        ]
        
        for row in matrix_data:
            skin_type, time_of_day, step_order, step_category, step_description, is_harsh = row
            db.execute(
                text("""
                    INSERT INTO routine_step_matrix 
                    (skin_type, time_of_day, step_order, step_category, step_description, is_harsh)
                    VALUES (:skin_type, :time_of_day, :step_order, :step_category, :step_description, :is_harsh)
                """),
                {
                    "skin_type": skin_type,
                    "time_of_day": time_of_day,
                    "step_order": step_order,
                    "step_category": step_category,
                    "step_description": step_description,
                    "is_harsh": is_harsh
                }
            )
        
        db.commit()
        print(f"✅ Seeded {len(matrix_data)} rows into routine_step_matrix")
        
        result = db.execute(text("SELECT COUNT(*) FROM routine_step_matrix"))
        count = result.scalar()
        print(f"✅ Total rows in routine_step_matrix: {count}")
        
    except Exception as e:
        print(f"❌ Error seeding matrix: {e}")
        db.rollback()
    finally:
        db.close()

def run_migration():
    try:
        with engine.connect() as conn:
            sql_path = os.path.join(os.path.dirname(__file__), "migrations", "002_add_milestone2_tables.sql")
            with open(sql_path, "r") as f:
                sql = f.read()
            conn.execute(text(sql))
            conn.commit()
            print("✅ Tables created successfully!")
            seed_routine_matrix()
    except Exception as e:
        print(f"❌ Error running migration: {e}")

if __name__ == "__main__":
    print("🚀 Running Milestone 2 database migration...")
    run_migration()
    print("🎉 Migration done!")
    print("🚀 Creating admin user...")
    create_admin_user()
    print("🎉 Admin user created!")