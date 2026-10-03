from sqlalchemy import Column, String, Integer, Float
from app.models.base import Base

class RegionalStat(Base):
    __tablename__ = "regional_stats"

    powiat_code = Column(String, primary_key=True, index=True)
    powiat_name = Column(String, nullable=False, unique=True, index=True)
    population = Column(Integer, default=0)
    senior_share_pct = Column(Float, default=0.0)
    youth_share_pct = Column(Float, default=0.0)
    demographic_trend = Column(String, default="stabilny")  # 'depopulacja', 'stabilny', 'dynamiczny wzrost'
    reported_problems_count = Column(Integer, default=0)
    active_innovations_count = Column(Integer, default=0)
    key_social_challenge = Column(String, default="")
