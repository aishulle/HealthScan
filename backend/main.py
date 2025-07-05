from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ocr import extract_text_from_file
import re
from typing import Dict, List, Any
from datetime import datetime
from enum import Enum

app = FastAPI()

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific domain later for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BodyPart(Enum):
    HEAD = "Head"
    NECK = "Neck"
    CHEST = "Chest"
    ABDOMEN = "Abdomen"
    PELVIS = "Pelvis"
    ARM = "Arm"
    LEG = "Leg"
    FULL_BODY = "Full Body"
    BLOOD_SYSTEM = "Blood System"
    IMMUNE_SYSTEM = "Immune System"

def map_test_to_body_part(test_name: str) -> BodyPart:
    """Map medical tests to body parts/systems"""
    test_mapping = {
        # RBC Parameters
        "Hemoglobin": BodyPart.BLOOD_SYSTEM,
        "RBC Count": BodyPart.BLOOD_SYSTEM,
        "PCV": BodyPart.BLOOD_SYSTEM,
        "MCV": BodyPart.BLOOD_SYSTEM,
        "MCH": BodyPart.BLOOD_SYSTEM,
        "MCHC": BodyPart.BLOOD_SYSTEM,
        "RDW (CV)": BodyPart.BLOOD_SYSTEM,
        "RDW-SD": BodyPart.BLOOD_SYSTEM,
        
        # WBC Parameters
        "TLC": BodyPart.IMMUNE_SYSTEM,
        "Neutrophils": BodyPart.IMMUNE_SYSTEM,
        "Lymphocytes": BodyPart.IMMUNE_SYSTEM,
        "Monocytes": BodyPart.IMMUNE_SYSTEM,
        "Eosinophils": BodyPart.IMMUNE_SYSTEM,
        "Basophils": BodyPart.IMMUNE_SYSTEM,
        
        # Absolute Counts
        "Neutrophils Absolute": BodyPart.IMMUNE_SYSTEM,
        "Lymphocytes Absolute": BodyPart.IMMUNE_SYSTEM,
        "Monocytes Absolute": BodyPart.IMMUNE_SYSTEM,
        "Eosinophils Absolute": BodyPart.IMMUNE_SYSTEM,
        "Basophils Absolute": BodyPart.IMMUNE_SYSTEM,
        
        # Platelets
        "Platelet Count": BodyPart.BLOOD_SYSTEM,
        
        # Other common tests
        "WBC": BodyPart.IMMUNE_SYSTEM,
        "Platelets": BodyPart.BLOOD_SYSTEM,
        "ALT": BodyPart.ABDOMEN,
        "AST": BodyPart.ABDOMEN,
        "Bilirubin": BodyPart.ABDOMEN,
        "Creatinine": BodyPart.ABDOMEN,
        "BUN": BodyPart.ABDOMEN,
        "Troponin": BodyPart.CHEST,
        "CK-MB": BodyPart.CHEST,
        "TSH": BodyPart.NECK,
        "T3": BodyPart.NECK,
        "T4": BodyPart.NECK,
        "Glucose": BodyPart.ABDOMEN,
        "HbA1c": BodyPart.FULL_BODY,
    }
    return test_mapping.get(test_name, BodyPart.FULL_BODY)

def analyze_medical_report(text: str) -> Dict[str, Any]:
    """Analyze extracted medical report text and structure the data"""
    analysis = {
        "patient_info": {},
        "test_results": [],
        "summary": {},
        "flags": [],
        "body_analysis": {}
    }
    
    # Extract patient information with more flexible patterns
    patient_match = re.search(r"Patient\s*(?:NAME|Name)\s*:\s*([^\n]+)", text, re.IGNORECASE)
    if patient_match:
        analysis["patient_info"]["name"] = patient_match.group(1).strip()
    
    # Extract date from multiple possible fields
    date_fields = ["Sample Collected", "Report Date", "Date"]
    for field in date_fields:
        date_match = re.search(fr"{field}\s*:\s*([^\n,]+)", text, re.IGNORECASE)
        if date_match:
            analysis["patient_info"]["date"] = date_match.group(1).strip()
            break
    
    # Comprehensive test patterns for CBC reports
    test_patterns = [
        # RBC Parameters
        (r"Hemoglobin\s*[^0-9]*([0-9.]+)\s*g/dL\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "Hemoglobin", "g/dL", 13.0, 17.0),
        (r"RBC\s*(?:Count)?\s*[^0-9]*([0-9.]+)\s*10\^?[6]?/?μ?l?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "RBC Count", "10^6/μl", 4.5, 5.5),
        (r"PCV\s*[^0-9]*([0-9.]+)\s*%\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "PCV", "%", 40, 50),
        (r"MCV\s*[^0-9]*([0-9.]+)\s*f?l?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "MCV", "fl", 83, 101),
        (r"MCH\s*[^0-9]*([0-9.]+)\s*pg?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "MCH", "pg", 27, 32),
        (r"MCHC\s*[^0-9]*([0-9.]+)\s*g/dL\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "MCHC", "g/dL", 31.5, 34.5),
        (r"RDW\s*\(?CV\)?\s*[^0-9]*([0-9.]+)\s*%\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "RDW (CV)", "%", 11.6, 14.0),
        (r"RDW-SD\s*[^0-9]*([0-9.]+)\s*f?l?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "RDW-SD", "fl", 35.1, 43.9),
        
        # WBC Parameters
        (r"TLC\s*[^0-9]*([0-9.]+)\s*10\^?3/?μ?l?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "TLC", "10^3/μl", 4, 10),
        (r"Neutrophils\s*[^0-9]*([0-9.]+)\s*%\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "Neutrophils", "%", 40, 80),
        (r"Lymphocytes\s*[^0-9]*([0-9.]+)\s*%\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "Lymphocytes", "%", 20, 40),
        (r"Monocytes\s*[^0-9]*([0-9.]+)\s*%\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "Monocytes", "%", 2, 10),
        (r"Eosinophils\s*[^0-9]*([0-9.]+)\s*%\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "Eosinophils", "%", 1, 6),
        (r"Basophils\s*[^0-9]*([0-9.]+)\s*%\s*(?:[^0-9]*<\s*([0-9.]+))?", "Basophils", "%", 0, 2),
        
        # Absolute Counts
        (r"Neutrophils\.?\s*(?:Absolute)?\s*[^0-9]*([0-9.]+)\s*10\^?3/?μ?l?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "Neutrophils Absolute", "10^3/μl", 2, 7),
        (r"Lymphocytes\.?\s*(?:Absolute)?\s*[^0-9]*([0-9.]+)\s*10\^?3/?μ?l?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "Lymphocytes Absolute", "10^3/μl", 1, 3),
        (r"Monocytes\.?\s*(?:Absolute)?\s*[^0-9]*([0-9.]+)\s*10\^?3/?μ?l?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "Monocytes Absolute", "10^3/μl", 0.2, 1.0),
        (r"Eosinophils\.?\s*(?:Absolute)?\s*[^0-9]*([0-9.]+)\s*10\^?3/?μ?l?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "Eosinophils Absolute", "10^3/μl", 0.02, 0.5),
        (r"Basophils\.?\s*(?:Absolute)?\s*[^0-9]*([0-9.]+)\s*10\^?3/?μ?l?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "Basophils Absolute", "10^3/μl", 0.02, 0.5),
        
        # Platelets
        (r"Platelet\s*(?:Count)?\s*[^0-9]*([0-9.]+)\s*10\^?3/?μ?l?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "Platelet Count", "10^3/μl", 150, 410),
        
        # Other common tests
        (r"WBC\s*[^0-9]*([0-9.]+)\s*10\^?3/?u?l?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "WBC", "10^3/μl", 4.0, 11.0),
        (r"Platelets\s*[^0-9]*([0-9.]+)\s*10\^?3?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "Platelets", "10^3/μl", 150, 450),
        (r"ALT\s*[^0-9]*([0-9.]+)\s*U/?L?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "ALT", "U/L", 7, 56),
        (r"AST\s*[^0-9]*([0-9.]+)\s*U/?L?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "AST", "U/L", 8, 48),
        (r"Glucose\s*[^0-9]*([0-9.]+)\s*mg/?dL?\s*(?:[^0-9]*([0-9.]+)\s*-\s*([0-9.]+))?", "Glucose", "mg/dL", 70, 100),
    ]
    
    # Track affected body parts
    affected_body_parts = set()
    
    for pattern_info in test_patterns:
        if len(pattern_info) == 5:
            pattern, test_name, unit, min_normal, max_normal = pattern_info
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = float(match.group(1))
                
                # Extract reference range if available, otherwise use defaults
                ref_range = f"{min_normal}-{max_normal}"
                if len(match.groups()) >= 3 and match.group(2) and match.group(3):
                    ref_range = f"{match.group(2)}-{match.group(3)}"
                
                status = "Normal"
                flag = ""
                status_type = "normal"
                
                if value < min_normal:
                    status = "Low"
                    flag = "Below normal range"
                    status_type = "low"
                elif value > max_normal:
                    status = "High"
                    flag = "Above normal range"
                    status_type = "high"
                
                test_result = {
                    "test": test_name,
                    "value": value,
                    "unit": unit,
                    "status": status,
                    "status_type": status_type,
                    "normal_range": ref_range,
                    "flag": flag,
                    "flag_message": flag,
                    "body_part": map_test_to_body_part(test_name).value
                }
                
                analysis["test_results"].append(test_result)
                
                if flag:
                    analysis["flags"].append({
                        "test": test_name,
                        "message": flag,
                        "severity": "warning" if status_type in ["low", "high"] else "info",
                        "body_part": map_test_to_body_part(test_name).value
                    })
                    affected_body_parts.add(map_test_to_body_part(test_name))
    
    # Generate body analysis
    analysis["body_analysis"] = {
        "affected_parts": [part.value for part in affected_body_parts],
        "most_affected_part": max(
            affected_body_parts, 
            key=lambda x: len([t for t in analysis["test_results"] 
                            if map_test_to_body_part(t["test"]) == x and t["status"] != "Normal"]), 
            default=BodyPart.FULL_BODY
        ).value if affected_body_parts else "None",
        "full_body_affected": BodyPart.FULL_BODY in affected_body_parts
    }
    
    # Generate summary
    total_tests = len(analysis["test_results"])
    abnormal_tests = len([t for t in analysis["test_results"] if t["status"] != "Normal"])
    
    analysis["summary"] = {
        "total_tests": total_tests,
        "normal_tests": total_tests - abnormal_tests,
        "abnormal_tests": abnormal_tests,
        "overall_status": "Normal" if abnormal_tests == 0 else "Attention Required",
        "severity": "normal" if abnormal_tests == 0 else "warning",
        "body_impact": analysis["body_analysis"]
    }
    
    return analysis

def generate_medical_insights(analysis: Dict[str, Any]) -> List[Dict[str, str]]:
    """Generate medical insights based on the analysis"""
    insights = []
    
    for test in analysis["test_results"]:
        if test["status"] == "Low":
            if test["test"] == "Hemoglobin":
                insights.append({
                    "message": "Low hemoglobin may indicate anemia. Consider iron supplementation and dietary changes.",
                    "severity": "warning",
                    "test": "Hemoglobin",
                    "body_part": test["body_part"]
                })
            elif test["test"] in ["TLC", "WBC"]:
                insights.append({
                    "message": "Low white blood cell count may indicate immune system concerns. Monitor for infections.",
                    "severity": "warning",
                    "test": test["test"],
                    "body_part": test["body_part"]
                })
            elif test["test"] == "Platelet Count":
                insights.append({
                    "message": "Low platelet count may affect blood clotting. Avoid activities with bleeding risk.",
                    "severity": "danger",
                    "test": test["test"],
                    "body_part": test["body_part"]
                })
            elif test["test"] == "RBC Count":
                insights.append({
                    "message": "Low red blood cell count may indicate anemia or blood loss. Follow up with healthcare provider.",
                    "severity": "warning",
                    "test": test["test"],
                    "body_part": test["body_part"]
                })
            elif test["test"] == "Monocytes":
                insights.append({
                    "message": "Low monocyte count may indicate immune suppression or bone marrow issues.",
                    "severity": "warning",
                    "test": test["test"],
                    "body_part": test["body_part"]
                })
            elif test["test"] == "Monocytes Absolute":
                insights.append({
                    "message": "Low absolute monocyte count may suggest immune system suppression.",
                    "severity": "warning",
                    "test": test["test"],
                    "body_part": test["body_part"]
                })
        
        elif test["status"] == "High":
            if test["test"] == "Hemoglobin":
                insights.append({
                    "message": "High hemoglobin may indicate dehydration or other conditions. Ensure adequate hydration.",
                    "severity": "warning",
                    "test": "Hemoglobin",
                    "body_part": test["body_part"]
                })
            elif test["test"] in ["TLC", "WBC"]:
                insights.append({
                    "message": "High white blood cell count may indicate infection or inflammation. Consider medical evaluation.",
                    "severity": "danger",
                    "test": test["test"],
                    "body_part": test["body_part"]
                })
            elif test["test"] == "Platelet Count":
                insights.append({
                    "message": "High platelet count may increase clotting risk. Monitor cardiovascular health.",
                    "severity": "warning",
                    "test": test["test"],
                    "body_part": test["body_part"]
                })
            elif test["test"] == "Neutrophils":
                insights.append({
                    "message": "High neutrophil percentage may indicate bacterial infection or inflammation.",
                    "severity": "warning",
                    "test": test["test"],
                    "body_part": test["body_part"]
                })
            elif test["test"] == "Lymphocytes":
                insights.append({
                    "message": "High lymphocyte percentage may indicate viral infection or immune response.",
                    "severity": "warning",
                    "test": test["test"],
                    "body_part": test["body_part"]
                })
            elif test["test"] == "Lymphocytes Absolute":
                insights.append({
                    "message": "High absolute lymphocyte count may suggest viral infection or chronic lymphocytic leukemia.",
                    "severity": "danger",
                    "test": test["test"],
                    "body_part": test["body_part"]
                })
            elif test["test"] == "MCHC":
                insights.append({
                    "message": "High MCHC may indicate dehydration or hereditary spherocytosis. Monitor hydration levels.",
                    "severity": "warning",
                    "test": test["test"],
                    "body_part": test["body_part"]
                })
    
    # Add body-specific insights
    if analysis["body_analysis"]["affected_parts"]:
        affected_parts = analysis["body_analysis"]["affected_parts"]
        most_affected = analysis["body_analysis"]["most_affected_part"]
        
        if most_affected != "None":
            insights.append({
                "message": f"Most affected system: {most_affected}. Pay special attention to this area.",
                "severity": "info",
                "test": "Body Analysis",
                "body_part": most_affected
            })
    
    if not insights:
        insights.append({
            "message": "All test results appear within normal ranges. Maintain current health practices.",
            "severity": "success",
            "test": "Overall",
            "body_part": "Full Body"
        })
    
    return insights

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        filename = file.filename.lower()
        content = await file.read()

        # Extract text from file
        text = extract_text_from_file(filename, content)
        
        if not text.strip():
            return {"error": "No text could be extracted from the file"}
        
        # Analyze the medical report
        analysis = analyze_medical_report(text)
        
        # Generate insights
        insights = generate_medical_insights(analysis)
        
        return {
            "filename": file.filename,
            "extracted_text": text,
            "analysis": analysis,
            "insights": insights,
            "processed_at": datetime.now().isoformat()
        }

    except Exception as e:
        return {"error": str(e)}

@app.get("/")
async def root():
    return {"message": "Medical Report Analysis API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}