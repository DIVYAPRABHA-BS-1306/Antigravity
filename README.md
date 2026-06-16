# BigQuery Release Notes Dashboard & X (Twitter) Share Tool

A sleek, responsive Flask web application that aggregates the official Google Cloud BigQuery release notes feed, parses individual updates, and lets you select and tweet them to X (Twitter) with intelligent formatting and character limit protection.

---

## 🎨 Preview & Aesthetics
- **Futuristic Dark Theme:** Powered by glassmorphism, Outfit & Inter typography, glowing accents, and smooth micro-animations.
- **Search & Filters:** Real-time text search and category filters (Features, Breaking Changes, Issues, Changes, and Announcements).
- **Tweet Preview Modal:** Generates auto-truncated tweet templates to guarantee X's **280-character limit** is never breached. 

---

## 📁 Repository Structure

```
├── app.py                  # Flask server and XML/HTML parsing logic
├── templates/
│   └── index.html          # Web dashboard structure & Tweet modal
├── static/
│   ├── css/
│   │   └── styles.css      # Dark theme stylesheets and animations
│   └── js/
│       └── app.js          # App state, filters, search & share logic
├── .gitignore              # Ignore virtual environment and cache folders
└── README.md               # Repository documentation
```

---

## ⚙️ How to Setup and Run Locally

### Prerequisites
- Python 3.10+
- `pip`

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DIVYAPRABHA-BS-1306/Antigravity.git
   cd Antigravity
   ```

2. **Set up a Virtual Environment:**
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install flask requests beautifulsoup4
   ```

4. **Launch the Application:**
   ```bash
   python app.py
   ```

5. Open your browser and navigate to:
   👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🏗️ Technical Architecture

- **Backend (`app.py`):** Pulls feed data from `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`, handles XML namespaces safely, and uses `BeautifulSoup` to break down daily blocks into individual updates so they can be isolated for tweeting.
- **Frontend (`app.js`):** Intercepts selections, matches query criteria, manages counting logic, and routes formatted content directly to Twitter's web share intent.
