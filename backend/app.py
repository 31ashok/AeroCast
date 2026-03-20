import os
import requests
from flask import Flask, render_template, request, jsonify, Response
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, template_folder='../templates', static_folder='../static')

OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
BASE_URL = 'https://api.openweathermap.org/data/2.5'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/weather', methods=['GET'])
def get_weather():
    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == 'your_api_key_here':
        return jsonify({'error': 'API key not configured. Please set OPENWEATHER_API_KEY in backend/.env'}), 500

    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    params = {
        'appid': OPENWEATHER_API_KEY,
        'units': 'metric' # Use metric by default (Celsius)
    }

    if city:
        params['q'] = city
    elif lat and lon:
        params['lat'] = lat
        params['lon'] = lon
    else:
        return jsonify({'error': 'Please provide a city or coordinates'}), 400

    try:
        # Fetch current weather
        weather_response = requests.get(f'{BASE_URL}/weather', params=params)
        
        if weather_response.status_code == 401:
             return jsonify({'error': 'Invalid API Key. Please check your OpenWeather API key.'}), 401
        elif weather_response.status_code == 404:
             return jsonify({'error': 'Location not found. Please try another city.'}), 404
             
        weather_response.raise_for_status()
        weather_data = weather_response.json()

        # Improve location name accuracy when using coordinates
        if lat and lon:
            try:
                geo_response = requests.get('http://api.openweathermap.org/geo/1.0/reverse', params={'lat': lat, 'lon': lon, 'limit': 1, 'appid': OPENWEATHER_API_KEY})
                if geo_response.status_code == 200:
                    geo_data = geo_response.json()
                    if geo_data and len(geo_data) > 0:
                        exact_name = geo_data[0].get('name')
                        if exact_name:
                            weather_data['name'] = exact_name
                            if 'country' in geo_data[0]:
                                weather_data['sys']['country'] = geo_data[0]['country']
            except Exception:
                pass

            # Fetch hyper-local climate data from Open-Meteo for exact coordinate accuracy
            try:
                om_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m&wind_speed_unit=ms"
                om_resp = requests.get(om_url, timeout=3)
                if om_resp.status_code == 200:
                    om_curr = om_resp.json().get('current', {})
                    if 'temperature_2m' in om_curr:
                        weather_data['main']['temp'] = om_curr['temperature_2m']
                    if 'relative_humidity_2m' in om_curr:
                        weather_data['main']['humidity'] = om_curr['relative_humidity_2m']
                    if 'apparent_temperature' in om_curr:
                        weather_data['main']['feels_like'] = om_curr['apparent_temperature']
                    if 'wind_speed_10m' in om_curr:
                        weather_data['wind']['speed'] = om_curr['wind_speed_10m']
            except Exception:
                pass

        # Fetch forecast (5 day / 3 hour)
        forecast_response = requests.get(f'{BASE_URL}/forecast', params=params)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()

        return jsonify({
            'current': weather_data,
            'forecast': forecast_data
        })

    except requests.exceptions.RequestException as err:
        return jsonify({'error': 'Failed to communicate with Weather API', 'details': str(err)}), 500
    except Exception as e:
        return jsonify({'error': 'An internal error occurred', 'details': str(e)}), 500

@app.route('/api/tiles/<layer>/<z>/<x>/<y>')
def get_tile(layer, z, x, y):
    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == 'your_api_key_here':
        return jsonify({'error': 'API key not configured.'}), 500

    tile_url = f"https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={OPENWEATHER_API_KEY}"
    
    try:
        resp = requests.get(tile_url)
        resp.raise_for_status()
        r = Response(resp.content, mimetype=resp.headers.get('Content-Type', 'image/png'))
        r.headers['Cache-Control'] = 'public, max-age=86400'
        return r
    except requests.exceptions.RequestException as err:
        return '', 404

if __name__ == '__main__':
    # Run the application
    app.run(debug=True, port=5000)
