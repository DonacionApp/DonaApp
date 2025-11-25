
FROM python:3.11-slim AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTORCH_CUDA_ALLOC_CONF="max_split_size_mb:128" \
    TOKENIZERS_PARALLELISM="false" \
    CUDA_VISIBLE_DEVICES="" \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    PYTORCH_NO_CUDA_MEMORY_CACHING=1 \
    FORCE_CPU=1 \
    HF_HOME=/tmp/.cache/huggingface \
    TRANSFORMERS_CACHE=/tmp/.cache/huggingface/transformers \
    HF_DATASETS_CACHE=/tmp/.cache/huggingface/datasets

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --default-timeout=100 --no-cache-dir -r requirements.txt

RUN mkdir -p /tmp/.cache/huggingface && \
    python -c "from pysentimiento import create_analyzer; analyzer = create_analyzer(task='sentiment', lang='es'); print('✅ Modelo pre-descargado exitosamente')"

COPY . .

# Etapa de producción
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    PYTORCH_CUDA_ALLOC_CONF="max_split_size_mb:128" \
    TOKENIZERS_PARALLELISM="false" \
    CUDA_VISIBLE_DEVICES="" \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    PYTORCH_NO_CUDA_MEMORY_CACHING=1 \
    FORCE_CPU=1 \
    HF_HOME=/app/.cache/huggingface \
    TRANSFORMERS_CACHE=/app/.cache/huggingface/transformers \
    HF_DATASETS_CACHE=/app/.cache/huggingface/datasets

WORKDIR /app

# Copia solo las dependencias instaladas de la etapa de construcción
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copia el modelo pre-descargado
COPY --from=builder /tmp/.cache/huggingface /app/.cache/huggingface

# Copia el código de la aplicación
COPY --from=builder /app .

EXPOSE 8000

# Política de reinicio y límites de memoria se configuran al ejecutar
# docker run -d --name pysentiment-api -p 8000:8000 --memory="512m" --memory-reservation="400m" --restart unless-stopped <image-name>
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --loop asyncio"]

