import psycopg2
import csv
from datetime import datetime

conn = psycopg2.connect(
    dbname="ai_skincare_db",
    user="postgres",
    password="admin123",
    host="localhost"
)
cur = conn.cursor()

csv_path = r"C:\AI_Skincare_Project\database\datasets\ingredients\ingredientsList.csv"

try:
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=',')
        
        count = 0
        for row in reader:
            name = row.get('name', '').strip()
            scientific_name = row.get('scientific_name', '').strip()
            short_description = row.get('short_description', '').strip()
            what_is_it = row.get('what_is_it', '').strip()
            what_does_it_do = row.get('what_does_it_do', '').strip()
            who_is_it_good_for = row.get('who_is_it_good_for', '').strip()
            who_should_avoid = row.get('who_should_avoid', '').strip()
            url = row.get('url', '').strip()
            
            # Skip empty rows
            if not name:
                continue
            
            cur.execute("""
                INSERT INTO ingredients 
                (name, scientific_name, short_description, what_is_it, what_does_it_do, 
                 who_is_it_good_for, who_should_avoid, url, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                name,
                scientific_name if scientific_name else None,
                short_description if short_description else None,
                what_is_it if what_is_it else None,
                what_does_it_do if what_does_it_do else None,
                who_is_it_good_for if who_is_it_good_for else None,
                who_should_avoid if who_should_avoid else None,
                url if url else None,
                datetime.now()
            ))
            
            count += 1
            if count % 100 == 0:
                print(f"✅ Imported {count} ingredients...")

    conn.commit()
    print(f"\n✅ SUCCESS! Imported {count} ingredients total!")
    
except Exception as e:
    conn.rollback()
    print(f"❌ Error: {e}")
    
finally:
    cur.close()
    conn.close()