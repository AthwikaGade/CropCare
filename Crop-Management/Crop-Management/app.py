from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename
from PIL import Image
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import google.generativeai as genai
import os
import re

app = Flask(__name__)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Configure allowed extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Configure Gemini API
genai.configure(api_key="AIzaSyBMjo9JdYjcXC3_nlOkiotehn6O8TiQrx8")

# Suppress TF warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Load the model
MODEL_PATH = "PlantVillage.h5"
try:
    model = load_model(MODEL_PATH)
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Class labels
class_labels = [
    'Pepper__bell___Bacterial_spot', 'Pepper__bell___healthy', 'Potato___Early_blight', 
    'Potato___Late_blight', 'Potato___healthy', 'Tomato_Bacterial_spot', 'Tomato_Early_blight',
    'Tomato_Late_blight', 'Tomato_Leaf_Mold', 'Tomato_Septoria_leaf_spot', 
    'Tomato_Spider_mites_Two_spotted_spider_mite', 'Tomato__Target_Spot', 
    'Tomato__Tomato_YellowLeaf__Curl_Virus', 'Tomato__Tomato_mosaic_virus', 'Tomato_healthy'
]

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def predict_image(img_path):
    try:
        if model is None:
            raise Exception("Model not loaded")
            
        # Load and preprocess the image
        img = image.load_img(img_path, target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array /= 255.
        
        # Make prediction
        class_probabilities = model.predict(img_array)
        predicted_label = np.argmax(class_probabilities)
        confidence = float(class_probabilities[0][predicted_label] * 100)
        
        return class_labels[predicted_label], confidence
    except Exception as e:
        print(f"Prediction error: {e}")
        return str(e), None

def get_disease_info(disease_name):
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"""Provide a concise, practical overview of {disease_name} for farmers:
        - Key symptoms
        - Quick identification methods
        - Basic prevention steps
        - Simple treatment recommendations"""

        response = model.generate_content(prompt)
        info = response.text
        info = re.sub(r'\*\*', '', info)  # Remove bold markers
        return info
    except Exception as e:
        print(f"Error getting disease info: {e}")
        return f"Could not retrieve disease information: {str(e)}"
@app.route('/templates/disease_detection.html')
def disease_detection():
    return render_template('disease_detection.html')

@app.route('/')
def home():
    return render_template('disease_detection.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Check if a file was uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Save the file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Make prediction
            prediction, confidence = predict_image(filepath)
            
            if confidence is not None:
                # Get disease information
                disease_info = get_disease_info(prediction)
                
                response = {
                    'prediction': prediction,
                    'confidence': confidence,
                    'disease_info': disease_info
                }
                
                return jsonify(response)
            else:
                return jsonify({'error': prediction}), 400
                
        finally:
            # Clean up - remove uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
                
    except Exception as e:
        print(f"Error in predict route: {e}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File is too large'}), 413

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True)