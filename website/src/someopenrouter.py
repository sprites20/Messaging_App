import requests
import json
import random  # Import the random module

# Define your API key and other optional parameters
OPENROUTER_API_KEY = "your_openrouter_api_key"
YOUR_SITE_URL = "https://yourappsite.com"
YOUR_APP_NAME = "YourAppName"

# Generate a random temperature between 0.5 and 1.0 (adjust as needed)
random_temperature = round(random.uniform(0.5, 1.0), 2)  # Generates a float with two decimal places

# Make a POST request to OpenRouter's chat completions endpoint
response = requests.post(
    url="https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": f"{YOUR_SITE_URL}",  # Optional: for app inclusion in rankings.
        "X-Title": f"{YOUR_APP_NAME}",       # Optional: for showing your app in rankings.
    },
    data=json.dumps({
        "model": "mistralai/mistral-7b-instruct:free",  # Specify the model to use.
        "messages": [
            {"role": "user", "content": "What is the meaning of life?"}
        ],
        # Include sampling parameters here
        "top_p": 0.85,          # Nucleus sampling parameter
        "top_k": 50,            # Top-k sampling parameter
        "temperature": random_temperature,  # Random temperature between 0.5 and 1.0
        "max_tokens": 150       # Maximum tokens to generate in the response
    })
)

# Print the response and random temperature used
print(f"Random temperature used: {random_temperature}")
print(response.json())
