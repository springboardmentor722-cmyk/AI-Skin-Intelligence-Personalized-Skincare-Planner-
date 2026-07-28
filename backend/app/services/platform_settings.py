# app/services/platform_settings.py

"""
Platform Settings Configuration.
Provides the central configuration for system preferences, regional settings, and access control.
"""

from datetime import datetime

def get_platform_settings():
    return {
        "general": {
            "platform_name": "Skin AI Healthcare Platform",
            "support_email": "support@skinaiplatform.com",
            "support_phone": "+91 98765 43210",
        },
        "regional": {
            "time_zone": "(UTC+05:30) Asia/Kolkata",
            "date_format": "DD MMM YYYY",
            "language": "English",
        },
        "system_preferences": {
            "allow_user_registration": True,
            "email_verification_required": True,
            "maintenance_mode": False,
            "show_powered_by": True,
            "enable_recaptcha": True,
        },
        "session_access": {
            "session_timeout": "30 Minutes",
            "jwt_expiry": "7 Days",
            "max_login_attempts": 5,
        },
        "file_upload": {
            "max_file_size": "10 MB",
            "allowed_file_types": "jpg, jpeg, png, webp, pdf",
            "daily_upload_limit": 20,
        },
        "email_config": {
            "default_sender_name": "Skin AI Platform",
            "default_sender_email": "no-reply@skinaiplatform.com",
        },
        "infrastructure": {
            "databases": [
                {"name": "PostgreSQL", "status": "Connected", "ping": "120 ms"},
                {"name": "MongoDB", "status": "Connected", "ping": "150 ms"},
                {"name": "Redis", "status": "Connected", "ping": "80 ms"},
            ],
            "storage": {
                "cloudinary": {"status": "Connected", "used": "45.2 GB"},
                "aws_s3": {"status": "Connected", "used": "120.5 GB"},
                "total_used": "165.7 GB",
                "total_capacity": "500 GB",
                "usage_percent": 33,
            },
            "system_info": {
                "platform_version": "v2.5.1",
                "environment": "Production",
                "server_time": datetime.utcnow().strftime("%b %d, %Y %I:%M %p"),
                "uptime": "15d 6h 24m 12s"
            }
        }
    }
