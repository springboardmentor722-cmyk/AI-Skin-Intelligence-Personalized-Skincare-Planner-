"""Reusable validation helpers used across controllers and services."""

import re
from pathlib import Path

from utils.constants import ALL_ROLES, ALLOWED_IMAGE_CONTENT_TYPES, ALLOWED_IMAGE_EXTENSIONS

PHONE_REGEX = re.compile(r"^\+?[0-9]{7,15}$")


def is_valid_phone(phone_number: str) -> bool:
    """Basic phone number format validation (digits, optional leading +)."""
    return bool(PHONE_REGEX.match(phone_number.replace(" ", "")))


def is_valid_role(role: str) -> bool:
    """Check that a role name is one of the four supported roles."""
    return role in ALL_ROLES


def is_valid_image_upload(filename: str, content_type: str | None) -> bool:
    """
    Validate that an uploaded file looks like a real image we accept.

    Checks both the file extension and the browser-reported content type
    as a lightweight, dependency-free defense; this is not a substitute
    for server-side content sniffing in a hardened production deployment.
    """
    extension = Path(filename or "").suffix.lower()
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        return False
    if content_type and content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        return False
    return True

