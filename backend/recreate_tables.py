from database import engine, Base
from models import ConsultantProfile, DermatologistProfile, ConsultationBooking

def recreate():
    print("Re-creating specialist profiles & bookings tables...")
    # Drop in correct order (dependency order)
    try:
        ConsultationBooking.__table__.drop(engine, checkfirst=True)
        ConsultantProfile.__table__.drop(engine, checkfirst=True)
        DermatologistProfile.__table__.drop(engine, checkfirst=True)
        print("Dropped old tables.")
    except Exception as e:
        print("Error dropping tables:", e)

    try:
        Base.metadata.create_all(bind=engine)
        print("Tables re-created successfully!")
    except Exception as e:
        print("Error creating tables:", e)

if __name__ == "__main__":
    recreate()
