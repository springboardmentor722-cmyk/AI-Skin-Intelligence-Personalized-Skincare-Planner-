from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")

mongodb = client["skin_intelligence"]