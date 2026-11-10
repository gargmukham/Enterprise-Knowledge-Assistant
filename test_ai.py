
import requests
import json

from backend.app.core.config import settings


# ==========================================
# 1. CONFIGURATION CHECK
# ==========================================

def check_configuration():

    print("\n========== CONFIGURATION CHECK ==========")

    print("Application:", settings.app_name)

    print("Chat Model:", settings.ai_chat_model)
    print("Embedding Model:", settings.ai_embedding_model)

    print("Chat URL Configured:", bool(settings.ai_chat_url))
    print("Embedding URL Configured:", bool(settings.ai_embedding_url))

    print("Chat API Key Loaded:", bool(settings.ai_chat_api_key))
    print("Embedding API Key Loaded:", bool(settings.ai_embedding_api_key))

    print("=========================================\n")


# ==========================================
# 2. COMMON API REQUEST FUNCTION
# ==========================================

def test_api(url, api_key, payload, api_name):

    print(f"\n========== TESTING {api_name} ==========")

    if not url or not api_key:
        print("ERROR: API URL or API Key is missing.")
        return None

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    try:

        response = requests.post(
            url=url,
            headers=headers,
            json=payload,
            timeout=60
        )

        print("Status Code:", response.status_code)

        try:
            response_data = response.json()

            print("\nResponse:")
            print(json.dumps(response_data, indent=4))

        except ValueError:
            response_data = None
            print("\nResponse:")
            print(response.text[:4000])

        if response.ok:

            print(f"\n{api_name} SUCCESS!")

            return response_data

        else:

            print(f"\n{api_name} FAILED!")

            return None

    except requests.exceptions.Timeout:

        print("ERROR: Request timed out.")

    except requests.exceptions.ConnectionError:

        print("ERROR: Could not connect to API server.")

    except requests.exceptions.RequestException as e:

        print("REQUEST ERROR:", str(e))

    return None


# ==========================================
# 3. TEST EMBEDDING API
# ==========================================

def test_embedding_api():

    payload = {
        "model": settings.ai_embedding_model,
        "input": [
            "Enterprise Knowledge Assistant is an AI-powered document management system."
        ]
    }

    result = test_api(
        url=settings.ai_embedding_url,
        api_key=settings.ai_embedding_api_key,
        payload=payload,
        api_name="EMBEDDING API"
    )

    if result and "data" in result:

        embedding = result["data"][0]["embedding"]

        print("\nEmbedding Generated Successfully!")
        print("Embedding Dimensions:", len(embedding))
        print("First 5 Values:", embedding[:5])

    return result


# ==========================================
# 4. TEST CHAT COMPLETION API
# ==========================================

def test_chat_api():

    payload = {
        "model": settings.ai_chat_model,
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful AI assistant."
            },
            {
                "role": "user",
                "content": "Explain what an Enterprise Knowledge Assistant is in simple words."
            }
        ],
        "max_completion_tokens": 150
    }

    result = test_api(
        url=settings.ai_chat_url,
        api_key=settings.ai_chat_api_key,
        payload=payload,
        api_name="CHAT API"
    )

    if result and "choices" in result:

        answer = result["choices"][0]["message"]["content"]

        print("\nAI RESPONSE:")
        print(answer)

    return result


# ==========================================
# 5. MAIN FUNCTION
# ==========================================

def main():

    print("\n")
    print("*" * 55)
    print(" ENTERPRISE KNOWLEDGE ASSISTANT - AI API TEST ")
    print("*" * 55)

    check_configuration()

    print("\nTesting Embedding API...")

    embedding_result = test_embedding_api()

    print("\n\nTesting Chat API...")

    chat_result = test_chat_api()

    print("\n")
    print("*" * 55)
    print(" FINAL TEST REPORT ")
    print("*" * 55)

    print(
        "Embedding API:",
        "SUCCESS" if embedding_result else "FAILED"
    )

    print(
        "Chat API:",
        "SUCCESS" if chat_result else "FAILED"
    )

    print("*" * 55)


if __name__ == "__main__":
    main()
