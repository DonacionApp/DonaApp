# sentiment_service.py

import os
import gc

os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:128"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["CUDA_VISIBLE_DEVICES"] = ""  
os.environ["OMP_NUM_THREADS"] = "1" 
os.environ["MKL_NUM_THREADS"] = "1" 

cache_dir = os.environ.get("HF_HOME", "/app/.cache/huggingface")
os.environ.setdefault("HF_HOME", cache_dir)
os.environ.setdefault("TRANSFORMERS_CACHE", os.path.join(cache_dir, "transformers"))
os.environ.setdefault("HF_DATASETS_CACHE", os.path.join(cache_dir, "datasets"))

sentiment_analyzer = None

def get_analyzer():
    """Devuelve una instancia singleton del analizador, inicializándolo
    en la primera llamada con optimizaciones de memoria."""
    global sentiment_analyzer
    if sentiment_analyzer is None:
        
        import torch
        from pysentimiento import create_analyzer
        
       
        torch.set_grad_enabled(False)
        
        
        torch.set_num_threads(1)
        
       
        sentiment_analyzer = create_analyzer(task="sentiment", lang="es")
        
        
        if hasattr(sentiment_analyzer, 'model'):
            sentiment_analyzer.model.eval()
            
            for param in sentiment_analyzer.model.parameters():
                param.requires_grad = False
        
        
        gc.collect()
    return sentiment_analyzer

def map_sentiment_to_stars(probabilities: dict, label: str) -> int:
    if label == 'NEU':
        return 3
    if label == 'POS':
        prob_pos = probabilities.get('POS', 0.0)
        if prob_pos > 0.90:
            return 5
        return 4
        
    if label == 'NEG':
        prob_neg = probabilities.get('NEG', 0.0)
        if prob_neg > 0.90:
            return 1
        return 2
        
    return 3


def analyze_review_sentiment(review_text: str) -> dict:
    """Analiza el sentimiento de una reseña con optimizaciones de memoria."""
   
    from pysentimiento.preprocessing import preprocess_tweet

    analyzer = get_analyzer()
    processed_text = preprocess_tweet(review_text)
    analysis_result = analyzer.predict(processed_text)
    sentiment_label = analysis_result.output
    sentiment_probabilities = analysis_result.probas
    star_rating = map_sentiment_to_stars(sentiment_probabilities, sentiment_label)
    
    result = {
        "review_data": {
            "text_original": review_text,
            "text_processed": processed_text
        },
        "sentiment_analysis": {
            "label": sentiment_label,  # Ej: "POS", "NEG", "NEU"
            "score_1_to_5": star_rating, # Ej: 5
            "probabilities": {
                "positive": round(sentiment_probabilities.get('POS', 0.0) * 100, 2), # %
                "negative": round(sentiment_probabilities.get('NEG', 0.0) * 100, 2), # %
                "neutral": round(sentiment_probabilities.get('NEU', 0.0) * 100, 2)  # %
            }
        },
        "summary": {
            "puntuacion_estrellas": f"{star_rating}/5 ⭐",
            "polaridad_completa": {
                "POS": "Positiva" if sentiment_label == 'POS' else "No Positiva",
                "NEG": "Negativa" if sentiment_label == 'NEG' else "No Negativa",
                "NEU": "Neutral" if sentiment_label == 'NEU' else "No Neutral"
            }
        }
    }
    
    del analysis_result, processed_text
    gc.collect()
    
    return result