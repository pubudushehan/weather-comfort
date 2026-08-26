import asyncio
from app.clients.openweather_client import OpenWeatherClient
from app.services.city_service import CityService

async def main():
    print("Initializing CityService...")
    city_service = CityService()
    city_ids = city_service.get_city_ids()
    print(f"Extracted city IDs: {city_ids}")
    
    print("\nInitializing OpenWeatherClient...")
    client = OpenWeatherClient()
    
    print("\nFetching weather for Colombo (1248991) directly...")
    try:
        colombo_weather = await client.get_current_weather(1248991)
        print("Success! Colombo weather:")
        print(f"Name: {colombo_weather.get('name')}")
        print(f"Country: {colombo_weather.get('sys', {}).get('country')}")
        print(f"Temp (metric): {colombo_weather.get('main', {}).get('temp')} °C")
        print(f"Description: {colombo_weather.get('weather', [{}])[0].get('description')}")
    except Exception as e:
        print(f"Error fetching Colombo weather: {e}")

    print("\nFetching weather for all cities concurrently...")
    try:
        results, failed_count = await client.get_multiple_weather(city_ids)
        print(f"Success! Fetched {len(results)} cities. Failed count: {failed_count}")
        for cid, data in results.items():
            print(f"- {data.get('name')} (ID: {cid}): {data.get('main', {}).get('temp')} °C, {data.get('weather', [{}])[0].get('description')}")
    except Exception as e:
        print(f"Error fetching multiple cities: {e}")

if __name__ == "__main__":
    asyncio.run(main())
