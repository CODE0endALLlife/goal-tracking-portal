import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import logging

from ..config import settings

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self):
        self.smtp_configured = bool(settings.SMTP_HOST and settings.SMTP_USER)

    def send_email(self, to_email: str, subject: str, body: str) -> bool:
        if not self.smtp_configured:
            logger.info(f"[Email Not Configured] To: {to_email} | Subject: {subject}")
            return False
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.EMAILS_FROM_EMAIL
            msg["To"] = to_email
            msg.attach(MIMEText(body, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAILS_FROM_EMAIL, to_email, msg.as_string())
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    def notify_goal_submitted(self, manager_email: str, employee_name: str, goal_title: str):
        self.send_email(
            to_email=manager_email,
            subject=f"Goal Submitted for Review: {goal_title}",
            body=f"<p>{employee_name} has submitted a goal for your review: <strong>{goal_title}</strong></p>"
        )

    def notify_goal_approved(self, employee_email: str, goal_title: str):
        self.send_email(
            to_email=employee_email,
            subject=f"Goal Approved: {goal_title}",
            body=f"<p>Your goal <strong>{goal_title}</strong> has been approved.</p>"
        )

    def notify_goal_rejected(self, employee_email: str, goal_title: str, comment: str):
        self.send_email(
            to_email=employee_email,
            subject=f"Goal Returned for Revision: {goal_title}",
            body=f"<p>Your goal <strong>{goal_title}</strong> was returned. Manager comment: {comment}</p>"
        )
