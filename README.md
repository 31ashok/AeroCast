# AeroCast - Premium Weather Dashboard

A full-stack, beautifully designed, and responsive weather application built with Python (Flask) and a modern HTML/CSS/JS frontend.

## ✨ Features
- **Real-time Weather**: Accurate current temperature, humidity, wind speed, feels-like temperature, and sunrise/sunset times.
- **5-Day Forecast**: Look ahead with a detailed daily forecast tracking high and low temperatures.
- **Interactive Visualizations**: Dynamic temperature trend charts built utilizing `Chart.js`.
- **Geolocation Support**: Instantly view your local weather using your device's built-in Geolocation API.
- **Premium UI/UX**: A sleek, dark-mode aesthetic featuring glassmorphism, responsive design (desktop/tablet/mobile), and smooth CSS animations.

## 🛠️ Tech Stack
- **Backend**: Python 3, Flask, `requests`
- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS (Flexbox/Grid/Variables)
- **APIs**: OpenWeather API, Browser Geolocation API
- **Assets**: FontAwesome Icons, Google Fonts (Outfit), Chart.js

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8+
- An [OpenWeather API Key](https://openweathermap.org/api) (Free Tier works perfectly)

### Installation

1. **Navigate to the Backend Directory**
   From the root of the project, change into the `backend` directory:
   ```bash
   cd backend
   ```

2. **Install Dependencies**
   It's recommended to use a virtual environment, but you can install directly via pip:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure your API Key**
   - In the `backend` directory, duplicate the `.env.example` file and rename it to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open the `.env` file and replace `your_api_key_here` with your actual OpenWeather API key.

4. **Run the Flask Application**
   ```bash
   python app.py
   ```
   The backend will start running on your machine (usually on port 5000).

5. **View the Application**
   Open your preferred modern web browser and visit:
   [http://localhost:5000](http://localhost:5000)

## 📁 Directory Structure
```
weather-app/
├── backend/
│   ├── app.py           # Main Flask application and API route mapping
│   ├── requirements.txt # Python dependencies
│   └── .env.example     # Environment variable template
├── static/
│   ├── css/
│   │   └── style.css    # Premium stylesheets
│   └── js/
│       └── app.js       # Core frontend logic
└── templates/
    └── index.html       # Application markup and structure
```

Enjoy tracking the weather with AeroCast!
