from app.utils.security import hash_password

password = "Admin@123"

print(hash_password(password))