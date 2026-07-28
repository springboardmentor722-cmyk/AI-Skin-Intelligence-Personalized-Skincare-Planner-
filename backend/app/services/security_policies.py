# app/services/security_policies.py

"""
Security and Compliance Policies Configuration.
This acts as the single source of truth for platform security settings,
mimicking real database configurations for the admin dashboard.
"""

from datetime import datetime, timedelta

def get_security_policies():
    base_date = datetime.utcnow()
    
    return [
        {
            "id": "pol_access_control",
            "name": "Data Access Control Policy",
            "description": "Defines data access levels and user permissions",
            "type": "Access Control",
            "status": "Active",
            "priority": "High",
            "last_updated": (base_date - timedelta(days=2)).isoformat()
        },
        {
            "id": "pol_password",
            "name": "Password Policy",
            "description": "Password complexity and expiration rules",
            "type": "Authentication",
            "status": "Active",
            "priority": "High",
            "last_updated": (base_date - timedelta(days=3)).isoformat()
        },
        {
            "id": "pol_data_retention",
            "name": "Data Retention Policy",
            "description": "Data retention and deletion guidelines",
            "type": "Data Protection",
            "status": "Active",
            "priority": "Medium",
            "last_updated": (base_date - timedelta(days=4)).isoformat()
        },
        {
            "id": "pol_session_mgmt",
            "name": "Session Management Policy",
            "description": "User session timeout and management",
            "type": "Session Security",
            "status": "Active",
            "priority": "Medium",
            "last_updated": (base_date - timedelta(days=5)).isoformat()
        },
        {
            "id": "pol_privacy",
            "name": "Privacy Policy",
            "description": "User privacy and data handling policy",
            "type": "Privacy",
            "status": "Pending Review",
            "priority": "High",
            "last_updated": (base_date - timedelta(days=6)).isoformat()
        },
        {
            "id": "pol_api_rate",
            "name": "API Rate Limiting Policy",
            "description": "API usage limits and throttling rules",
            "type": "API Security",
            "status": "Expired",
            "priority": "Low",
            "last_updated": (base_date - timedelta(days=8)).isoformat()
        },
        {
            "id": "pol_mfa",
            "name": "MFA Enforcement",
            "description": "Multi-factor authentication rules for admins",
            "type": "Authentication",
            "status": "Active",
            "priority": "High",
            "last_updated": (base_date - timedelta(days=1)).isoformat()
        },
        {
            "id": "pol_audit",
            "name": "Audit Logging Policy",
            "description": "Retention and detail level for audit logs",
            "type": "Data Protection",
            "status": "Active",
            "priority": "Medium",
            "last_updated": (base_date - timedelta(days=12)).isoformat()
        },
        {
            "id": "pol_encryption",
            "name": "Data Encryption Standards",
            "description": "Encryption requirements for data at rest",
            "type": "Access Control",
            "status": "Active",
            "priority": "High",
            "last_updated": (base_date - timedelta(days=20)).isoformat()
        },
        {
            "id": "pol_network",
            "name": "Network Security Policy",
            "description": "Firewall and inbound traffic rules",
            "type": "Access Control",
            "status": "Active",
            "priority": "High",
            "last_updated": (base_date - timedelta(days=15)).isoformat()
        },
        {
            "id": "pol_thirdparty",
            "name": "Third-Party Integrations",
            "description": "Security checks for external API usage",
            "type": "API Security",
            "status": "Pending Review",
            "priority": "Medium",
            "last_updated": (base_date - timedelta(days=2)).isoformat()
        },
        {
            "id": "pol_incident",
            "name": "Incident Response Plan",
            "description": "Steps and procedures during a breach",
            "type": "Access Control",
            "status": "Active",
            "priority": "High",
            "last_updated": (base_date - timedelta(days=30)).isoformat()
        }
    ]
