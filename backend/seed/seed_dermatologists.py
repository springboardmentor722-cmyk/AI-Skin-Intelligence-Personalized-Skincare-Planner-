"""
One-time script: creates User (role=dermatologist) + DermatologistProfile
records for the Rajahmundry clinics listed in seed/dermatologists.json.

Run from the backend/ directory, with your venv active:
    python -m seed.seed_dermatologists
"""
import json
import re
from pathlib import Path

from app.database import SessionLocal
from app.auth import hash_password
from app import models

TEMP_PASSWORD = "TempPass2026!Derm"  # meets the 12-char minimum; change per-account later

DATA_FILE = Path(__file__).with_name("dermatologists.json")


def slugify(text: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return text


def get_phones(clinic: dict) -> list[str]:
    phone_str = clinic.get("phone", "")
    if not phone_str:
        return []
    return [p.strip() for p in phone_str.split(";") if p.strip()]


def build_bio(clinic: dict) -> str:
    phones = get_phones(clinic)
    if len(phones) > 1:
        return "Additional numbers: " + ", ".join(phones[1:])
    return ""


def load_clinics() -> list[dict]:
    with DATA_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def seed():
    clinics = load_clinics()
    db = SessionLocal()
    created = 0
    try:
        for clinic in clinics:
            slug = slugify(clinic["clinic"])
            email = f"{slug}@dermatologists.example"

            existing = db.query(models.User).filter(models.User.email == email).first()
            if existing:
                print(f"Skipping (already exists): {clinic['name']} <{email}>")
                continue

            user = models.User(
                full_name=clinic["name"],
                email=email,
                hashed_password=hash_password(TEMP_PASSWORD),
                role=models.RoleEnum.dermatologist,
                is_active=True,
            )
            db.add(user)
            db.flush()  # get user.id before creating the profile

            phones = get_phones(clinic)
            address_str = f"{clinic.get('street_address', '')}, {clinic.get('city', '')}, {clinic.get('state', '')} {clinic.get('zip', '')}".strip(", ")

            profile = models.DermatologistProfile(
                user_id=user.id,
                phone=phones[0] if phones else None,
                clinic_name=clinic["clinic"],
                specialty="; ".join(clinic["specialties"]),
                bio=build_bio(clinic) or None,
                address=address_str,
                website=clinic["website"],
                accepting_new_patients=True,
            )
            db.add(profile)
            created += 1
            print(f"Created: {clinic['name']} ({clinic['clinic']}) <{email}>")

        db.commit()
        print(f"\nDone. {created} dermatologist account(s) created.")
        print(f"Temporary password for all seeded accounts: {TEMP_PASSWORD}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()