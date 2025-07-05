# Lab Report Analyzer

A full-stack AI-powered health analytics platform that allows users to upload medical lab reports (PDFs or images) and receive structured insights, body system analysis, and trend visualizations — all via a responsive and secure web interface.


[Demo](https://drive.google.com/file/d/18l3iOO87NWQQMe9n72Jngxkf6j38MLeT/view?usp=sharing)

---

## Features

### Frontend (React + Next.js)
- Secure login-protected dashboard
- Upload support for PDF and image lab reports
- Complete Blood Count (CBC) analysis with flag detection
- Body system impact mapping and insights
- Bar graph visualization comparing key health metrics against ideal values
- Responsive design and smooth transitions with Tailwind and Framer Motion

### Backend (FastAPI / Python)
- Accepts and processes lab reports
- Extracts:
  - Patient Information
  - Test Results with ranges, units, and status
  - Key Medical Insights
  - Affected Body Systems
- Returns structured JSON for frontend use

---

## Tech Stack

| Layer        | Tech Used                         |
|--------------|-----------------------------------|
| Frontend     | React, Next.js, Tailwind CSS, Framer Motion |
| Backend      | FastAPI, Python                   |
| File Parsing | PyMuPDF, Pillow, Pytesseract   |
| Charting     | Recharts (Bar Graph for metrics) |

---
## Authentication

The frontend uses a simple localStorage-based check. Unauthenticated users are redirected to the login page.

---

## Workflow Summary

1. User logs in and uploads a lab report.
2. Backend extracts relevant values using file parsing and custom rules.
3. Frontend displays:

   * Flagged test values
   * Patient details
   * Body system summary
   * Key medical insights
   * Bar graph comparing actual vs ideal values for key health parameters

---

## License

This project is licensed under the MIT License.
