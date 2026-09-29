# Testify â€” AI-Powered UAT Platform

> Enterprise SaaS platform that automates User Acceptance Testing (UAT) and audits Product Requirement Documents (PRDs) using the **Google Gemini 1.5 Flash** API.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 |
| **AI** | Google Gemini 1.5 Flash (`google-generativeai`) |
| **Frontend** | React 18, Vite 5, Tailwind CSS 3 |
| **Communication** | REST API â€” `POST /api/generate-uat` |

---

## Features

- ðŸ” **PRD Requirement Auditor** â€” Flags vague phrasing, logical gaps, missing business rules
- ðŸ§ª **UAT Matrix Generator** â€” Structured test suite with Test ID, title, preconditions, steps, expected results, and test type
- ðŸ“Š **Risk Analysis** â€” High / Medium / Low risk classification per finding
- ðŸ“¥ **One-Click CSV Export** â€” Download the full test matrix instantly
- ðŸŽ¨ **Premium Dark UI** â€” Glassmorphism, cyan/indigo gradients, animated loading states

---

## Quick Start

### 1. Configure API Key

Edit `backend/.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```
Get your free key at: https://aistudio.google.com/app/apikey

### 2. Start Backend

```powershell
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Start Frontend

```powershell
cd frontend
npm install
npm run dev
```

### 4. Open App

Visit: **http://localhost:5173**

---

## API Reference

### `POST /api/generate-uat`

**Request:**
```json
{
  "prd_text": "Your PRD or user stories here..."
}
```

**Response:**
```json
{
  "audit_findings": [
    {
      "issue": "Password policy is vague",
      "risk_level": "High",
      "suggestion": "Define min/max length, required character types"
    }
  ],
  "overall_risk": "Medium",
  "test_cases": [
    {
      "test_id": "TC_001",
      "title": "Successful user registration",
      "preconditions": "User is on the registration page",
      "steps": ["Step 1: Navigate to /register", "Step 2: Fill in valid email and password"],
      "expected_result": "User account is created and confirmation email is sent",
      "test_type": "Positive"
    }
  ],
  "summary": "Generated 12 test cases covering authentication flows..."
}
```

### `GET /health`
Returns backend health status and API key configuration state.

---

## Project Structure

```
testify/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ main.py          # FastAPI app + Gemini integration
â”‚   â”œâ”€â”€ requirements.txt # Python dependencies
â”‚   â””â”€â”€ .env             # API key (never commit this!)
â””â”€â”€ frontend/
    â”œâ”€â”€ src/
    â”‚   â”œâ”€â”€ App.jsx                    # Root app with state management
    â”‚   â”œâ”€â”€ index.css                  # Global Tailwind + custom styles
    â”‚   â””â”€â”€ components/
    â”‚       â”œâ”€â”€ Header.jsx             # Sticky nav header
    â”‚       â”œâ”€â”€ PRDInput.jsx           # PRD textarea + generate button
    â”‚       â”œâ”€â”€ AuditPanel.jsx         # Risk findings display
    â”‚       â”œâ”€â”€ UATMatrix.jsx          # Test table + CSV export
    â”‚       â”œâ”€â”€ StatsBar.jsx           # Summary metric cards
    â”‚       â””â”€â”€ LoadingOverlay.jsx     # Animated AI processing UI
    â”œâ”€â”€ index.html
    â”œâ”€â”€ vite.config.js
    â”œâ”€â”€ tailwind.config.js
    â””â”€â”€ package.json
```
