"""Schemas for academic rollover / promotion."""
from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class ClassMapping(BaseModel):
    from_class: str
    to_class: str


class PromotionConfig(BaseModel):
    """Request body for the academic rollover endpoint."""

    from_academic_year_id: UUID
    to_academic_year_id: UUID
    class_mappings: list[ClassMapping]
    new_batch: str = Field(..., description="New batch label, e.g. '2026-2027'")
    code_pattern: str = Field(
        default="{class_num:02d}{serial:02d}",
        description="Pattern to generate student codes. Available vars: class_num, serial",
    )
    update_fees: bool = False
    fee_structure_id: UUID | None = None
    final_year_classes: list[str] = Field(
        default_factory=list,
        description="Classes where students graduate (e.g. ['X', 'XII'])",
    )
    carry_forward_arrears: bool = True
    new_billing_start_month: int = Field(default=6, ge=1, le=12, description="Billing start month for new year (1-12)")
    new_billing_end_month: int = Field(default=3, ge=1, le=12, description="Billing end month for new year (1-12)")


class PromotionDetail(BaseModel):
    student_id: UUID
    student_name: str
    from_class: str
    to_class: str
    old_code: str
    new_code: str
    arrears_amount: Decimal = Decimal("0")


class PromotionResult(BaseModel):
    """Response from the academic rollover endpoint."""

    promoted_count: int
    completed_count: int
    arrears_created: int
    errors: list[str]
    details: list[PromotionDetail]
