from fastapi import HTTPException, Depends, Response
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from ..schemas import report_dto
from ..schemas import report as report_schema
from ..config.database import get_db

async def create_report(report: report_dto.ReportCreate, db_session: Session = Depends(get_db)):
    new_report = report_schema.Report(**report.dict())
    db_session.add(new_report)
    db_session.commit()
    db_session.refresh(new_report)
    return new_report

async def get_reports(
    reportedBy: Optional[str] = None, 
    status: Optional[str] = None, 
    db_session: Session = Depends(get_db)
) -> List[report_dto.Report]:
    query = db_session.query(report_schema.Report)
    if reportedBy:
        query = query.filter(report_schema.Report.reportedBy == reportedBy)
    if status:
        query = query.filter(report_schema.Report.status == status)
    return query.all()

async def get_report(report_id: int, db_session: Session = Depends(get_db)) -> report_dto.Report:
    report = db_session.query(report_schema.Report).filter(report_schema.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

async def update_report(report_id: int, report_update: report_dto.ReportUpdate, db_session: Session = Depends(get_db)):
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

async def delete_report(report_id: int, db_session: Session = Depends(get_db)):
    db_report = db_session.query(report_schema.Report).filter(report_schema.Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db_session.delete(db_report)
    db_session.commit()
    return Response(status_code=204)
