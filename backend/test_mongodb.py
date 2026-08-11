from app.database.mongodb import mongodb

print("Connected Successfully!")
print(mongodb.list_collection_names())