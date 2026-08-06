import csv

csv_path = r"C:\AI_Skincare_Project\database\datasets\ingredients\ingredientsList.csv"

print(f"📁 Checking file: {csv_path}")

try:
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=',')
        
        print(f"📋 Column names: {reader.fieldnames}")
        
        count = 0
        for row in reader:
            name = row.get('name', '').strip()
            what_does = row.get('what_does_it_do', '').strip()
            
            if count < 3:
                print(f"\n Row {count + 1}:")
                print(f"  Name: {name}")
                print(f"  Benefits: {what_does[:100]}...")
            
            count += 1
        
        print(f"\n✅ Total rows in CSV: {count}")
        
except FileNotFoundError:
    print(f"❌ File not found: {csv_path}")
except Exception as e:
    print(f"❌ Error: {e}")