"""Interactive administrator provisioning, without passwords in shell history."""
from __future__ import annotations

import argparse
from getpass import getpass

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.enums import UserRole


def provision_admin(db, username: str, password: str, *, reset_password: bool = False) -> None:
    if not username.strip() or not 12 <= len(password.encode()) <= 72:
        raise ValueError("Use a username and a password between 12 and 72 UTF-8 bytes.")
    user = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if user:
        if not reset_password or user.role != UserRole.admin:
            raise ValueError("Account exists. Use --reset-password only for an existing administrator.")
        user.password_hash = hash_password(password)
    else:
        if reset_password:
            raise ValueError("Administrator not found.")
        db.add(User(username=username, password_hash=hash_password(password), role=UserRole.admin))
    db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--username', default='admin')
    parser.add_argument('--reset-password', action='store_true')
    args = parser.parse_args()
    password = getpass('New administrator password (12–72 UTF-8 bytes): ')
    if password != getpass('Confirm password: '):
        parser.error('Passwords do not match.')
    with SessionLocal() as db:
        try:
            provision_admin(db, args.username, password, reset_password=args.reset_password)
        except ValueError as exc:
            parser.error(str(exc))
    print('Administrator password configured. Rotate JWT_SECRET to invalidate existing sessions after a reset.')


if __name__ == '__main__':
    main()
