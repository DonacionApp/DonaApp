#!/bin/bash
# Script de inicio para Render optimizado para bajo consumo de memoria
# Configura variables de entorno para optimizar PyTorch/Transformers

# Optimizaciones de memoria para PyTorch
export PYTORCH_CUDA_ALLOC_CONF="max_split_size_mb:128"
export TOKENIZERS_PARALLELISM=false
export OMP_NUM_THREADS=1
export MKL_NUM_THREADS=1

# Ejecutar uvicorn con configuración optimizada para Render (512 MB RAM)
# --workers 1: Un solo worker para reducir uso de memoria
# --loop asyncio: Loop más eficiente en memoria
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --loop asyncio

