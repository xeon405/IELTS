FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN groupadd --system app && useradd --system --gid app --no-create-home app

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8000

# Run as an unprivileged user: the app has no reason to run as root.
USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8000/health',timeout=4)" || exit 1

# A single worker is intentional: in-memory rate-limit counters and the
# csrf/verification attempt tracking must not be split across processes,
# and horizontally scaled instances each still enforce their own limits.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]