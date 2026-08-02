from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    staff = "staff"


class StudentStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    passed_out = "passed_out"
    withdrawn = "withdrawn"
    transferred = "transferred"
    completed = "completed"


class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class PaymentCycle(str, enum.Enum):
    monthly = "monthly"
    bi_monthly = "bi_monthly"
    tri_monthly = "tri_monthly"


class PaymentMode(str, enum.Enum):
    cash = "cash"
    upi = "upi"
    bank = "bank"


class StaffRole(str, enum.Enum):
    teacher = "teacher"
    admin_staff = "admin_staff"
    non_teaching = "non_teaching"
    part_time = "part_time"


class StaffStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    resigned = "resigned"


class ExamType(str, enum.Enum):
    monthly_test = "monthly_test"
    quarterly = "quarterly"
    half_yearly = "half_yearly"
    annual = "annual"
    special = "special"


class ContentType(str, enum.Enum):
    news = "news"
    event = "event"
    achievement = "achievement"
    gallery = "gallery"
    circular = "circular"
