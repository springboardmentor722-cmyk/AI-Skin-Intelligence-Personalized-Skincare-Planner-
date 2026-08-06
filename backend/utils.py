from typing import Any, Optional


def get_display_name(user: Optional[Any] = None, profile: Optional[Any] = None) -> str:
    """
    Safely resolves user display name in priority order:
    1. profile.full_name
    2. user.full_name / user["full_name"]
    3. user.name / user["name"]
    4. user.username / user["username"]
    5. first_name + last_name
    6. email before '@'
    7. "User"
    Never raises KeyError or AttributeError.
    """
    # 1. Profile full_name
    if profile:
        if isinstance(profile, dict):
            p_name = profile.get("full_name") or profile.get("name")
        else:
            p_name = getattr(profile, "full_name", None) or getattr(profile, "name", None)

        if p_name and str(p_name).strip():
            return str(p_name).strip()

    # 2. User attributes or dictionary keys
    if user:
        if isinstance(user, dict):
            u_name = (
                user.get("full_name")
                or user.get("name")
                or user.get("username")
            )
            if not u_name and (user.get("first_name") or user.get("last_name")):
                u_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
            if not u_name and user.get("email"):
                u_name = str(user.get("email")).split("@")[0]
            
            if u_name and str(u_name).strip():
                return str(u_name).strip()
        else:
            u_name = (
                getattr(user, "full_name", None)
                or getattr(user, "name", None)
                or getattr(user, "username", None)
            )
            if not u_name:
                first = getattr(user, "first_name", "")
                last = getattr(user, "last_name", "")
                if first or last:
                    u_name = f"{first or ''} {last or ''}".strip()
            if not u_name and getattr(user, "email", None):
                u_name = str(getattr(user, "email")).split("@")[0]

            if u_name and str(u_name).strip():
                return str(u_name).strip()

    return "User"


def get_user_id(user: Optional[Any]) -> Optional[int]:
    """Safely extracts integer user_id from dict or object."""
    if not user:
        return None
    if isinstance(user, dict):
        uid = user.get("id") or user.get("user_id") or user.get("sub")
    else:
        uid = getattr(user, "id", None) or getattr(user, "user_id", None)
    
    try:
        return int(uid) if uid is not None else None
    except (ValueError, TypeError):
        return None


def get_user_email(user: Optional[Any]) -> str:
    """Safely extracts email from dict or object."""
    if not user:
        return ""
    if isinstance(user, dict):
        return str(user.get("email", ""))
    return str(getattr(user, "email", ""))


def get_user_role(user: Optional[Any]) -> str:
    """Safely extracts role from dict or object."""
    if not user:
        return "user"
    if isinstance(user, dict):
        return str(user.get("role", "user"))
    return str(getattr(user, "role", "user"))
