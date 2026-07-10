"""Seed script to populate CMS with data scraped from myacademychennai.com.

Run: python -m tools.seed_cms
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.cms import WebContent
from app.models.enums import ContentType


ACHIEVEMENTS = [
    {"student_name": "PRIYADHARSHINI.M", "class_name": "XII", "rank": "1st", "marks": "572/600", "year": "2023-2024"},
    {"student_name": "HAREENEE.D.A", "class_name": "XII", "rank": "2nd", "marks": "562/600", "year": "2023-2024"},
    {"student_name": "PRAGADEESH.S", "class_name": "XII", "rank": "3rd", "marks": "557/600", "year": "2023-2024"},
    {"student_name": "MAITHILI.P", "class_name": "X", "rank": "1st", "marks": "473/500", "year": "2023-2024"},
    {"student_name": "RESIKA.A", "class_name": "X", "rank": "2nd", "marks": "466/500", "year": "2023-2024"},
    {"student_name": "DHARSHIKA.S", "class_name": "X", "rank": "3rd", "marks": "454/500", "year": "2023-2024"},
]

EVENTS = [
    {"title": "15th Annual Day", "event_date": "2024-12-29"},
    {"title": "12th Exam Date", "event_date": "2025-03-03"},
    {"title": "11th Exam Date", "event_date": "2025-03-05"},
    {"title": "10th Exam Date", "event_date": "2025-03-28"},
    {"title": "Admission Open 2025-2026", "event_date": "2025-04-14"},
    {"title": "Alumni Day", "event_date": "2025-10-15"},
]

NEWS = [
    {"title": "MY Academy celebrates 15 years of excellence", "description": "Founded in 2009, MY Academy has grown from 10 students to 200+ students with 22 teaching staff."},
    {"title": "100% pass rate achieved again", "description": "All students from X and XII standard have passed the board examinations with flying colors."},
    {"title": "New Smart Classes introduced", "description": "Modern smart class facilities have been set up to enhance the learning experience for all students."},
]

GALLERY = [
    {"title": "Annual Day 2024", "description": "Highlights from our 15th Annual Day celebration"},
    {"title": "Classroom Activities", "description": "Students engaged in learning"},
]


def seed():
    db = SessionLocal()
    try:
        # Check if already seeded — only skip if gallery exists too
        existing_gallery = db.query(WebContent).filter(WebContent.content_type == ContentType.gallery).first()
        existing_achievements = db.query(WebContent).filter(WebContent.content_type == ContentType.achievement).first()

        if existing_achievements and existing_gallery:
            print("CMS already has full data. Skipping seed.")
            return

        # Add gallery if missing
        if not existing_gallery:
            for i, g in enumerate(GALLERY):
                content = WebContent(
                    content_type=ContentType.gallery,
                    title=g["title"],
                    description=g.get("description"),
                    is_published=True,
                    display_order=i,
                )
                db.add(content)
            db.commit()
            print(f"Added {len(GALLERY)} gallery albums")

        if existing_achievements:
            print("Achievements/news/events already exist. Only gallery was added.")
            return

        # Achievements
        for i, a in enumerate(ACHIEVEMENTS):
            content = WebContent(
                content_type=ContentType.achievement,
                title=f"{a['student_name']} - {a['class_name']} - {a['year']}",
                student_name=a["student_name"],
                class_name=a["class_name"],
                rank=a["rank"],
                marks=a["marks"],
                year=a["year"],
                is_published=True,
                display_order=i,
            )
            db.add(content)

        # Events
        from datetime import date
        for i, e in enumerate(EVENTS):
            parts = e["event_date"].split("-")
            content = WebContent(
                content_type=ContentType.event,
                title=e["title"],
                event_date=date(int(parts[0]), int(parts[1]), int(parts[2])),
                is_published=True,
                display_order=i,
            )
            db.add(content)

        # News
        for i, n in enumerate(NEWS):
            content = WebContent(
                content_type=ContentType.news,
                title=n["title"],
                description=n["description"],
                is_published=True,
                display_order=i,
            )
            db.add(content)

        # Gallery
        for i, g in enumerate(GALLERY):
            content = WebContent(
                content_type=ContentType.gallery,
                title=g["title"],
                description=g.get("description"),
                is_published=True,
                display_order=i,
            )
            db.add(content)

        db.commit()
        print(f"Seeded: {len(ACHIEVEMENTS)} achievements, {len(EVENTS)} events, {len(NEWS)} news, {len(GALLERY)} gallery albums")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
