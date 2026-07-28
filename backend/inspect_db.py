import os
from sqlalchemy import create_engine, inspect

# Load env variables manually from .env
db_url = "postgresql://neondb_owner:npg_7cQXIOfyH1VP@ep-frosty-sea-atxgioma-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

engine = create_engine(db_url)
inspector = inspect(engine)

print("Tables in PostgreSQL:")
for table_name in inspector.get_table_names():
    print(f"\nTable: {table_name}")
    for column in inspector.get_columns(table_name):
        print(f" - {column['name']}: {column['type']} (nullable={column['nullable']})")
