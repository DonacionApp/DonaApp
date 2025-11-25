# main.py

from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel
from typing import Dict, Any
import os

from sentiment_service import analyze_review_sentiment

app = FastAPI(
    title="Microservicio de Análisis de Sentimientos",
    version="1.0.0",
    description="API mínima para evaluar el sentimiento de reseñas en español usando pysentimiento.",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Sirve la página de inicio."""
    html_path = os.path.join(os.path.dirname(__file__), "index.html")
    if os.path.exists(html_path):
        return FileResponse(html_path)
    else:
        return HTMLResponse(content="""
        <html>
            <head><title>PySentiment</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0;">
                <div>
                    <h1 style="font-size: 4rem; margin-bottom: 1rem;">PySentiment</h1>
                    <p style="font-size: 1.5rem;">Análisis de Sentimientos en Español</p>
                </div>
            </body>
        </html>
        """)


class Review(BaseModel):
    review_text: str
    
@app.post("/analyze-sentiment", response_model=Dict[str, Any])
async def analyze_sentiment(review: Review):
    result = analyze_review_sentiment(review.review_text)
    
    return result

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Sentiment Analyzer"}


if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 8000))
    
    if os.environ.get("PORT"):
        host = os.environ.get("HOST", "0.0.0.0")
    else:
        host = os.environ.get("HOST", "127.0.0.1")

    uvicorn.run(
        "main:app", 
        host=host, 
        port=port, 
        reload=False,
        workers=1,  
        loop="asyncio",
        log_level="info"
    )