import asyncio
from mongodb import mongodb

async def check():
    try:
        doc = await mongodb.analysis_history.find_one()
        print("MongoDB connection success. Sample document:", doc)
    except Exception as e:
        print("MongoDB connection failed:", e)

if __name__ == "__main__":
    asyncio.run(check())
