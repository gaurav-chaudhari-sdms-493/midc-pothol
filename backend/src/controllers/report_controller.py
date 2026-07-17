from fastapi import HTTPException, Depends, Response
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from src.schemas import report_dto, user_dto
from src.schemas import report as report_schema
from src.config.database import get_db
from src.models.user import UserRole

async def create_report(report: report_dto.ReportCreate, db_session: Session, user_id: int):
    new_report = report_schema.Report(**report.dict(), user_id=user_id)
    db_session.add(new_report)
    db_session.commit()
    db_session.refresh(new_report)
    return new_report

async def get_reports(
    reportedBy: Optional[str], 
    status: Optional[str], 
    db_session: Session,
    current_user: user_dto.UserOut
) -> List[report_dto.Report]:
    query = db_session.query(report_schema.Report)
    if current_user.role == UserRole.citizen:
        query = query.filter(report_schema.Report.user_id == current_user.id)
    if reportedBy:
        query = query.filter(report_schema.Report.reportedBy == reportedBy)
    if status:
        query = query.filter(report_schema.Report.status == status)
    return query.all()

async def get_report(report_id: int, db_session: Session, current_user: user_dto.UserOut) -> report_dto.Report:
    report = db_session.query(report_schema.Report).filter(report_schema.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if current_user.role == UserRole.citizen and report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this resource")
    return report

async def update_report(report_id: int, report_update: report_dto.ReportUpdate, db_session: Session):
    db_report = db_session.query(report_schema.Report).filter(report_schema.Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    update_data = report_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_report, key, value)
        
    db_report.reportedDate = datetime.datetime.utcnow() # Update date
    
    db_session.commit()
    db_session.refresh(db_report)
    return db_report

async def delete_report(report_id: int, db_session: Session):
    db_report = db_session.query(report_schema.Report).filter(report_schema.Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db_session.delete(db_report)
    db_session.commit()
    return Response(status_code=204)
