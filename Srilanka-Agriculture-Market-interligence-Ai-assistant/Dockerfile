FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app

EXPOSE 5000

# Use Gunicorn to serve the Flask app
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "app:app"]
