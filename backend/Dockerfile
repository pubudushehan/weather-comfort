FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements file first to leverage docker caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the required application source files
COPY app ./app

# Expose backend API port
EXPOSE 8000

# Start command running on 0.0.0.0 to allow docker container routing
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
