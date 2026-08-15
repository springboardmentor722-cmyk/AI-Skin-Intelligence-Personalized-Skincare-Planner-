# backend/progress_tracking.py

"""
MILESTONE 3 - Progress Tracking Engine

This module provides:
1. Routine adherence calculation (7-day, 30-day, 90-day)
2. User progress analytics
3. Improvement tracking over time
"""

import logging
from datetime import datetime, timedelta, date
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from backend.models import User, SkinProfile, SkincareRoutine, RoutineLog, SkinAssessment

logger = logging.getLogger(__name__)


# ============================================================
# 1. ADHERENCE CALCULATION
# ============================================================

def calculate_adherence(
    db: Session,
    user_id: int,
    days: int = 7
) -> Dict[str, Any]:
    """
    Calculate routine adherence for a user over a specified number of days.
    
    Args:
        db: Database session
        user_id: User ID
        days: Number of days to look back (7, 30, 90)
    
    Returns:
        Dict with adherence metrics
    """
    # Get user's routine steps
    routines = db.query(SkincareRoutine).filter(
        SkincareRoutine.user_id == user_id,
        SkincareRoutine.is_active == True
    ).all()
    
    if not routines:
        return {
            'adherence_percentage': 0,
            'completed_steps': 0,
            'total_steps': 0,
            'days': days,
            'message': 'No routine found'
        }
    
    # Calculate date range
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)
    
    # Get all logs for this user in date range
    logs = db.query(RoutineLog).filter(
        RoutineLog.user_id == user_id,
        RoutineLog.log_date >= start_date,
        RoutineLog.log_date <= end_date
    ).all()
    
    # Group logs by date
    logs_by_date = {}
    for log in logs:
        if log.log_date not in logs_by_date:
            logs_by_date[log.log_date] = []
        logs_by_date[log.log_date].append(log)
    
    # Calculate total possible steps per day
    total_possible = len(routines) * days
    completed_count = 0
    
    for log in logs:
        if log.completed_at is not None:
            completed_count += 1
    
    adherence_percentage = round((completed_count / total_possible) * 100, 1) if total_possible > 0 else 0
    
    return {
        'adherence_percentage': adherence_percentage,
        'completed_steps': completed_count,
        'total_steps': total_possible,
        'days': days,
        'daily_breakdown': get_daily_breakdown(db, user_id, start_date, end_date, routines)
    }


def get_daily_breakdown(
    db: Session,
    user_id: int,
    start_date: date,
    end_date: date,
    routines: List[SkincareRoutine]
) -> List[Dict[str, Any]]:
    """
    Get daily breakdown of completed steps.
    """
    daily_data = []
    
    current_date = start_date
    while current_date <= end_date:
        # Get logs for this date
        logs = db.query(RoutineLog).filter(
            RoutineLog.user_id == user_id,
            RoutineLog.log_date == current_date
        ).all()
        
        completed = len([l for l in logs if l.completed_at is not None])
        total = len(routines)
        
        daily_data.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'completed': completed,
            'total': total,
            'percentage': round((completed / total) * 100, 1) if total > 0 else 0
        })
        
        current_date += timedelta(days=1)
    
    return daily_data


# ============================================================
# 2. PROGRESS OVER TIME
# ============================================================

def get_score_history(
    db: Session,
    user_id: int,
    limit: int = 30
) -> List[Dict[str, Any]]:
    """
    Get user's skin health score history.
    """
    assessments = db.query(SkinAssessment).filter(
        SkinAssessment.user_id == user_id
    ).order_by(SkinAssessment.created_at.desc()).limit(limit).all()
    
    # Reverse to get chronological order
    assessments.reverse()
    
    return [
        {
            'date': a.created_at.strftime('%Y-%m-%d'),
            'score': a.overall_score,
            'detected_concerns': a.detected_concerns
        }
        for a in assessments
    ]


def get_progress_summary(
    db: Session,
    user_id: int
) -> Dict[str, Any]:
    """
    Get a comprehensive progress summary for a user.
    """
    # Get current and previous scores
    assessments = db.query(SkinAssessment).filter(
        SkinAssessment.user_id == user_id
    ).order_by(SkinAssessment.created_at.desc()).limit(2).all()
    
    current_score = assessments[0].overall_score if assessments else 0
    previous_score = assessments[1].overall_score if len(assessments) > 1 else current_score
    
    score_change = round(current_score - previous_score, 1)
    
    # Get adherence for different time periods
    adherence_7d = calculate_adherence(db, user_id, 7)
    adherence_30d = calculate_adherence(db, user_id, 30)
    adherence_90d = calculate_adherence(db, user_id, 90)
    
    # Get primary concern
    primary_concern = None
    if assessments and assessments[0].detected_concerns:
        primary_concern = assessments[0].detected_concerns[0] if assessments[0].detected_concerns else None
    
    return {
        'current_score': current_score,
        'previous_score': previous_score,
        'score_change': score_change,
        'score_trend': 'improving' if score_change > 0 else 'declining' if score_change < 0 else 'stable',
        'primary_concern': primary_concern,
        'adherence': {
            '7_days': adherence_7d,
            '30_days': adherence_30d,
            '90_days': adherence_90d
        },
        'total_assessments': db.query(SkinAssessment).filter(SkinAssessment.user_id == user_id).count()
    }


# ============================================================
# 3. INSIGHT GENERATION
# ============================================================

def generate_progress_insights(
    db: Session,
    user_id: int
) -> List[Dict[str, str]]:
    """
    Generate actionable insights based on user progress.
    """
    insights = []
    summary = get_progress_summary(db, user_id)
    
    # Score-based insights
    if summary['score_change'] > 5:
        insights.append({
            'type': 'positive',
            'icon': '📈',
            'title': 'Great Progress!',
            'description': f'Your skin health score has improved by {summary["score_change"]} points. Keep up the good work!'
        })
    elif summary['score_change'] < -5:
        insights.append({
            'type': 'warning',
            'icon': '⚠️',
            'title': 'Score Declining',
            'description': f'Your skin health score has dropped by {abs(summary["score_change"])} points. Consider reviewing your routine consistency.'
        })
    else:
        insights.append({
            'type': 'info',
            'icon': 'ℹ️',
            'title': 'Stable Progress',
            'description': 'Your skin health score is stable. Consistency is key to improvement.'
        })
    
    # Adherence insights
    adherence_7d = summary['adherence']['7_days']['adherence_percentage']
    
    if adherence_7d >= 80:
        insights.append({
            'type': 'positive',
            'icon': '✅',
            'title': 'Excellent Routine Consistency',
            'description': f'You\'ve completed {adherence_7d}% of your routine in the last 7 days. This consistency is great for your skin health!'
        })
    elif adherence_7d >= 50:
        insights.append({
            'type': 'info',
            'icon': '📋',
            'title': 'Good Routine Consistency',
            'description': f'You\'ve completed {adherence_7d}% of your routine in the last 7 days. Try to be more consistent for better results.'
        })
    else:
        insights.append({
            'type': 'warning',
            'icon': '🔔',
            'title': 'Low Routine Consistency',
            'description': f'You\'ve only completed {adherence_7d}% of your routine in the last 7 days. Building a consistent routine is key to seeing results.'
        })
    
    # Concern-specific insights
    if summary['primary_concern']:
        concern = summary['primary_concern'].lower()
        concern_tips = {
            'acne': 'Consider using salicylic acid or benzoyl peroxide in your routine for acne management.',
            'hyperpigmentation': 'Consider adding vitamin C or niacinamide to help with hyperpigmentation.',
            'dry skin': 'Focus on hydrating ingredients like hyaluronic acid and ceramides.',
            'oily skin': 'Use niacinamide and salicylic acid to help control oil production.',
            'sensitive skin': 'Focus on gentle, fragrance-free products with calming ingredients like centella asiatica.',
            'wrinkles': 'Consider adding retinol or peptides to your evening routine.',
            'redness': 'Look for soothing ingredients like aloe vera, chamomile, and green tea.'
        }
        
        tip = concern_tips.get(concern, f'Continue addressing your {concern} concern with targeted ingredients.')
        insights.append({
            'type': 'info',
            'icon': '💡',
            'title': f'Tip for {summary["primary_concern"]}',
            'description': tip
        })
    
    return insights