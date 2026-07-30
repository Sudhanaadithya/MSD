FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for LightGBM (OpenMP libgomp1)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Generate dataset and train models at build time
RUN python generate_dataset.py && python train_models.py

# Expose port
EXPOSE 8000

# Start the API server
CMD ["python", "app.py"]
