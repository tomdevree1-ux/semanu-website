FROM python:3.12-slim

# System libraries WeasyPrint needs at runtime (Pango / Cairo / GDK-Pixbuf) + base fonts for matplotlib.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf-2.0-0 libcairo2 \
    libffi8 shared-mime-info fonts-dejavu-core fontconfig \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY qs_engine.py app.py ./

# Hosts (Render, Railway, Cloud Run) inject $PORT.
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
