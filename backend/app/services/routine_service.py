from datetime import date

from app.models import RoutineLog


def mark_step_completed(db, user_id, routine_time, step,completed):

    existing = (
        db.query(RoutineLog)
        .filter(
            RoutineLog.user_id == user_id,
            RoutineLog.date == date.today(),
            RoutineLog.routine_time == routine_time,
            RoutineLog.step == step,
            
            
        )
        .first()
    )

    if existing:
     existing.completed = completed

    else:
        log = RoutineLog(
            user_id=user_id,
            date=date.today(),
            routine_time=routine_time,
            step=step,
           completed=completed,
        )

        db.add(log)

    db.commit()


from datetime import date

def get_completed_steps(db, user_id):

    logs = (
        db.query(RoutineLog)
        .filter(
            RoutineLog.user_id == user_id,
            RoutineLog.date == date.today(),
            RoutineLog.completed == True,
        )
        .all()
    )

    completed = {}

    for log in logs:

        if log.routine_time not in completed:
            completed[log.routine_time] = []

        completed[log.routine_time].append(log.step)

    return completed