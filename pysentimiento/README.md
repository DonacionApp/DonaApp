# Microservicio de Análisis de Sentimientos

API mínima para evaluar el sentimiento de reseñas en español usando pysentimiento.

## Instalación

```bash
pip install -r requirements.txt
```

## Ejecución Local

```bash
python main.py
```

O directamente con uvicorn:

```bash
uvicorn main:app --reload
```

## Despliegue en Render

### Configuración en Render:

El servicio está optimizado para funcionar con el plan gratuito de Render (512 MB RAM).

1. **Build Command:**
   ```
   pip install -r requirements.txt
   ```

2. **Start Command:**
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1 --loop asyncio
   ```
   
   O usar el script de inicio (asegúrate de que tenga permisos de ejecución):
   ```
   bash start.sh
   ```

   **Optimizaciones de memoria implementadas:**
   - Un solo worker (`--workers 1`) para reducir uso de RAM
   - Configuración de PyTorch para CPU y bajo consumo
   - Limpieza automática de memoria después de procesar
   - Variables de entorno optimizadas para transformers

   **Importante:** El modelo se carga de forma lazy (perezosa) en la primera petición, por lo que la primera respuesta puede tardar unos segundos mientras se carga el modelo.

## Ejecución con Docker

### Construir la imagen:
```bash
docker build -t pysentiment .
```

### Ejecutar el contenedor:
```bash
docker run -p 8000:8000 pysentiment
```

### Ejecutar con docker-compose (recomendado):
```bash
docker-compose up
```

**Nota:** El Dockerfile está optimizado con:
- Imagen base `python:3.11-slim` (más ligera, consume menos RAM)
- Configuración forzada para usar **solo CPU** (no GPU)
- Límite de memoria de 512MB (compatible con Render free tier)
- Solo dependencias esenciales

Para más comandos, consulta [DOCKER_COMMANDS.md](DOCKER_COMMANDS.md)

## Endpoints

- `GET /` - Página de inicio (landing page)
- `POST /analyze-sentiment` - Analizar el sentimiento de una reseña
- `GET /health` - Health check del servicio

## Uso

### Ver la landing page:
Abre tu navegador en `http://localhost:8000`

### Analizar sentimiento:
```bash
curl -X POST "http://localhost:8000/analyze-sentiment" \
  -H "Content-Type: application/json" \
  -d '{"review_text": "Me encantó este producto, es excelente!"}'
```

### Health check:
```bash
curl http://localhost:8000/health
```

