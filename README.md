# 🎬 Amazon Prime Movies & TV Shows — Analytics Dashboard

> End-to-end exploratory data analysis of Amazon Prime Video content using Python.

---

## 📌 Project Overview

This project performs a comprehensive analysis of the Amazon Prime Video content library — covering Movies and TV Shows. The goal is to uncover trends, patterns, and insights about content types, genres, countries, ratings, and more using Python-based data analysis and visualization.

---

## 📁 Project Structure

```
amazon-prime-analytics/
│
├── 📁 data/
│   ├── raw/                         ← Original dataset (amazon_prime_titles.csv)
│   └── processed/                   ← Cleaned dataset after preprocessing
│
├── 📁 notebooks/
│   ├── 01_data_cleaning.ipynb       ← Data loading, cleaning & preprocessing
│   ├── 02_eda.ipynb                 ← Exploratory Data Analysis
│   └── 03_visualizations.ipynb     ← Advanced charts & visual insights
│
├── 📁 visualizations/               ← Saved chart images (.png)
├── 📁 reports/                      ← Summary insights (optional PDF)
│
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 📊 Dataset

**Source:** [Kaggle — Amazon Prime Movies and TV Shows](https://www.kaggle.com/datasets/shivamb/amazon-prime-movies-and-tv-shows)

**File:** `amazon_prime_titles.csv`

| Column | Description |
|---|---|
| `show_id` | Unique ID for each title |
| `type` | Movie or TV Show |
| `title` | Name of the content |
| `director` | Director name(s) |
| `cast` | Main cast members |
| `country` | Country of production |
| `date_added` | Date added to Prime |
| `release_year` | Year of original release |
| `rating` | Content rating (PG, R, TV-MA, etc.) |
| `duration` | Runtime (minutes for movies, seasons for shows) |
| `listed_in` | Genre categories |
| `description` | Short plot description |

---

## 🔍 Analysis Performed

### Notebook 1 — Data Cleaning
- Load & inspect dataset
- Handle missing values
- Parse date columns
- Feature engineering (year_added, month_added, duration_int)
- Export cleaned data

### Notebook 2 — Exploratory Data Analysis (EDA)
- Movies vs TV Shows distribution
- Content added over the years
- Top 10 countries producing content
- Content rating analysis
- Genre frequency analysis
- Top directors & cast members

### Notebook 3 — Advanced Visualizations
- Interactive Plotly charts
- Heatmaps (country × genre, year × type)
- Treemap of genres
- Sunburst chart (type → rating → genre)
- Word cloud of titles/descriptions

---

## 🛠️ Tech Stack

| Tool | Purpose |
|---|---|
| Python 3.x | Core language |
| Pandas | Data manipulation |
| Matplotlib | Static charts |
| Seaborn | Statistical visualizations |
| Plotly | Interactive charts |
| WordCloud | Text visualizations |
| Jupyter Notebook | Development environment |

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/amazon-prime-analytics.git
cd amazon-prime-analytics
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Download the dataset
- Go to: https://www.kaggle.com/datasets/shivamb/amazon-prime-movies-and-tv-shows
- Download `amazon_prime_titles.csv`
- Place it in `data/raw/`

### 4. Run the notebooks in order
```
notebooks/01_data_cleaning.ipynb
notebooks/02_eda.ipynb
notebooks/03_visualizations.ipynb
```

---

## 📈 Key Insights (Preview)

- Amazon Prime has significantly more **Movies** than TV Shows
- Content additions peaked around **2019–2021**
- **USA, India, and UK** are the top content-producing countries
- **Drama** and **Comedy** are the most common genres
- Most content is rated **13+** or **16+**

---

## 👩‍💻 Author

**Your Name**
- GitHub: [@prasanthmax](https://github.com/prasanthmax)
- LinkedIn: [Prasanth Shanmugam](https://www.linkedin.com/in/prasanth-shanmugam-b9b84b23b/)

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
