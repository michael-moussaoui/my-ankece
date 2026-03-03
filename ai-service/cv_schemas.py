from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class CVTier(str, Enum):
    ESSENTIEL = "essentiel"
    PRO = "pro"
    ELITE = "elite"

class ClubInfo(BaseModel):
    clubName: str
    season: str
    category: Optional[str] = None
    league: Optional[str] = None
    number: Optional[int] = None

class PlayerStats(BaseModel):
    pointsPerGame: Optional[float] = None
    reboundsPerGame: Optional[float] = None
    assistsPerGame: Optional[float] = None
    stealsPerGame: Optional[float] = None
    blocksPerGame: Optional[float] = None
    fieldGoalPercentage: Optional[float] = None
    threePointPercentage: Optional[float] = None
    freeThrowPercentage: Optional[float] = None
    gamesPlayed: Optional[int] = None
    minutesPerGame: Optional[float] = None

class CVPlayerData(BaseModel):
    firstName: str
    lastName: str
    age: int
    position: str
    height: Optional[int] = None
    wingspan: Optional[int] = None
    verticalLeap: Optional[int] = None
    dominantHand: Optional[str] = None
    strengths: List[str] = []
    currentClub: ClubInfo
    clubHistory: List[ClubInfo] = []
    stats: Optional[PlayerStats] = None
    
    # Media URLs (Cloudinary/Firebase)
    profilePhotoUrl: Optional[str] = None
    offensiveVideoUrls: List[str] = []
    defensiveVideoUrls: List[str] = []
    presentationVideoUrl: Optional[str] = None
    clubLogoUrl: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    facebook: Optional[str] = None
    primaryColor: Optional[str] = None
    accentColor: Optional[str] = None
    transitionType: Optional[str] = "fade"
    jobId: Optional[str] = None
    exportToCapCut: bool = False
    tier: CVTier = CVTier.ESSENTIEL
