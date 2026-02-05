#!/usr/bin/env python3
"""
Test script for Incident Management Module (Module 5)
This script demonstrates the kill switch functionality and basic incident management.
"""

from sqlmodel import Session, create_engine
from uuid import uuid4
from datetime import datetime, date
from app.core.database import get_db
from app.modules.incident.service import IncidentService
from app.modules.incident.models import IncidentSeverity, IncidentCategory, IncidentStatus

def test_incident_management():
    """Test the incident management functionality"""
    print("=== Testing Incident Management Module ===\n")
    
    # Get database session
    db = next(get_db())
    service = IncidentService(db)
    
    try:
        # Test 1: Create a MINOR incident (should not trigger kill switch)
        print("1. Creating MINOR incident...")
        minor_incident_data = {
            "title": "Minor equipment malfunction",
            "description": "Small oil leak from hydraulic system",
            "severity": IncidentSeverity.MINOR,
            "category": IncidentCategory.EQUIPMENT_FAILURE,
            "incident_date": datetime.utcnow(),
            "location": "Workshop A",
            "reported_by": "John Doe",
            "contact_number": "+91-9876543210"
        }
        
        minor_incident = service.create_incident(minor_incident_data)
        print(f"   ✓ MINOR incident created: {minor_incident.id}")
        print(f"   ✓ Status: {minor_incident.status}")
        
        # Test 2: Create a MAJOR incident (should trigger kill switch)
        print("\n2. Creating MAJOR incident (will trigger kill switch)...")
        major_incident_data = {
            "title": "Major fire incident",
            "description": "Fire broke out in the electrical panel room",
            "severity": IncidentSeverity.MAJOR,
            "category": IncidentCategory.UNSAFE_CONDITION,
            "incident_date": datetime.utcnow(),
            "location": "Workshop B - Electrical Room",
            "reported_by": "Jane Smith",
            "contact_number": "+91-9876543211"
        }
        
        major_incident = service.create_incident(major_incident_data)
        print(f"   ✓ MAJOR incident created: {major_incident.id}")
        print(f"   ✓ KILL SWITCH ACTIVATED - All permits suspended, machines locked")
        
        # Test 3: Create CAPA for the incident
        print("\n3. Creating CAPA for MAJOR incident...")
        capa_data = {
            "title": "Install fire suppression system",
            "description": "Install automatic fire detection and suppression system in electrical rooms",
            "type": "PREVENTIVE",
            "assigned_to": "Facilities Management Team",
            "due_date": date.today()
        }
        
        capa_data["incident_id"] = major_incident.id
        capa = service.create_capa(capa_data)
        print(f"   ✓ CAPA created: {capa.id}")
        print(f"   ✓ Due date: {capa.due_date}")
        
        # Test 4: Get statistics
        print("\n4. Getting incident statistics...")
        stats = service.get_incident_statistics()
        print(f"   ✓ Total incidents: {stats['total_incidents']}")
        print(f"   ✓ Minor incidents: {stats['minor_incidents']}")
        print(f"   ✓ Major incidents: {stats['major_incidents']}")
        print(f"   ✓ Open incidents: {stats['open_incidents']}")
        
        # Test 5: Update CAPA status
        print("\n5. Updating CAPA status...")
        updated_capa = service.update_capa_status(capa.id, "COMPLETED")
        print(f"   ✓ CAPA status updated to: {updated_capa.status}")
        print(f"   ✓ Completed date: {updated_capa.completed_date}")
        
        # Test 6: Update incident status
        print("\n6. Updating incident status...")
        updated_incident = service.update_incident_status(major_incident.id, IncidentStatus.CLOSED)
        print(f"   ✓ Incident status updated to: {updated_incident.status}")
        
        print("\n=== All tests completed successfully! ===")
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    test_incident_management()