
import httpx

from backend.app.core.config import settings


# =========================================================
# 1. COMMON API HEADERS
# =========================================================

def _get_headers(api_key: str) -> dict:

    if not api_key:
        raise RuntimeError("API key is missing in .env")

    return {
        "Content-Type": "application/json",
        "X-API-KEY": api_key
    }


# =========================================================
# 2. TEXT EMBEDDING API
# =========================================================

async def create_embedding(text: str) -> list[float]:
    """
    Generate embedding using Coforge Text Embeddings API.
    """

    if not text or not text.strip():
        raise ValueError("Text cannot be empty")

    if not settings.ai_embedding_api_key:
        raise RuntimeError("AI_EMBEDDING_API_KEY is missing")

    if not settings.ai_embedding_url:
        raise RuntimeError("AI_EMBEDDING_URL is missing")

    payload = {
        "texts": [text],
        "dimensions": settings.ai_embedding_dimensions
    }

    headers = _get_headers(settings.ai_embedding_api_key)

    async with httpx.AsyncClient(timeout=60) as client:

        response = await client.post(
            settings.ai_embedding_url,
            headers=headers,
            json=payload
        )

        print("Embedding Status:", response.status_code)
        print("Embedding Response:", response.text[:1000])

        response.raise_for_status()

        data = response.json()

        embedding = data.get("embeddings")

        if not isinstance(embedding, list) or not embedding:
            raise ValueError(
                f"Invalid embedding response: {data}"
            )

        # Extract vector if API returns nested vectors
        if isinstance(embedding[0], list):
            if len(embedding) != 1:
                raise ValueError(
                    "Expected one embedding for one input text"
                )
            embedding = embedding[0]

        if not all(
            isinstance(value, (int, float)) and not isinstance(value, bool)
            for value in embedding
        ):
            raise ValueError("Invalid embedding values")

        if len(embedding) != settings.ai_embedding_dimensions:
            raise ValueError(
                f"Expected {settings.ai_embedding_dimensions} dimensions, "
                f"received {len(embedding)}"
            )

        print("Embedding generated successfully!")
        print("Embedding Dimensions:", len(embedding))

        return [float(value) for value in embedding]


# =========================================================
# 3. CHAT COMPLETION API
# =========================================================

async def generate_answer(question: str, context: str) -> str:
    """
    Generate an answer using Coforge GPT-5 Mini.
    """

    if not question or not question.strip():
        raise ValueError("Question cannot be empty")

    if not settings.ai_chat_api_key:
        raise RuntimeError("AI_CHAT_API_KEY is missing")

    if not settings.ai_chat_url:
        raise RuntimeError("AI_CHAT_URL is missing")

    if not settings.ai_chat_model:
        raise RuntimeError("AI_CHAT_MODEL is missing")

    payload = {
        "model": settings.ai_chat_model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an Enterprise Knowledge Assistant. "
                    "Answer using only the supplied document context. "
                    "Do not invent facts. If the answer is unavailable "
                    "in the context, clearly say so."
                )
            },
            {
                "role": "user",
                "content": (
                    f"DOCUMENT CONTEXT:\n{context}\n\n"
                    f"QUESTION:\n{question}"
                )
            }
        ],
        "max_completion_tokens": 1000
    }

    headers = _get_headers(settings.ai_chat_api_key)

    async with httpx.AsyncClient(timeout=90) as client:

        response = await client.post(
            settings.ai_chat_url,
            headers=headers,
            json=payload
        )

        print("Chat Status:", response.status_code)
        print("Chat Response:", response.text[:2000])

        response.raise_for_status()

        data = response.json()

        choices = data.get("choices")

        if not isinstance(choices, list) or not choices:
            raise ValueError(
                f"Invalid Chat API response: {data}"
            )

        answer = choices[0].get("message", {}).get("content")

        if not isinstance(answer, str):
            raise ValueError(
                f"Chat API returned invalid content: {data}"
            )

        return answer.strip()


# =========================================================
# 4. TEST BOTH AI SERVICES
# =========================================================

async def test_ai_services():

    print("\n==========================================")
    print(" ENTERPRISE KNOWLEDGE ASSISTANT - AI TEST")
    print("==========================================")

    # Embedding API Test
    try:
        print("\nTesting Embedding API...")

        embedding = await create_embedding(
            "Enterprise Knowledge Assistant test document"
        )

        print("Embedding API: SUCCESS")
        print("Vector Dimensions:", len(embedding))

    except Exception as error:
        print("Embedding API: FAILED")
        print("Error:", str(error))

    # Chat API Test
    try:
        print("\nTesting Chat API...")

        answer = await generate_answer(
            question="What is artificial intelligence?",
            context=(
                "Artificial intelligence is a field of computer science "
                "that focuses on creating intelligent machines."
            )
        )

        print("Chat API: SUCCESS")
        print("AI Answer:", answer)

    except Exception as error:
        print("Chat API: FAILED")
        print("Error:", str(error))

    print("\n==========================================")
    print(" AI SERVICE TEST COMPLETED")
    print("==========================================")


# =========================================================
# 5. DIRECT EXECUTION
# =========================================================

if __name__ == "__main__":

    import asyncio

    asyncio.run(test_ai_services())
