from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from agents import app as langgraph_app, AgentState
import json

# Initialize Flask app
flask_app = Flask(__name__)
CORS(flask_app)  # Enable CORS for all routes

@flask_app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        "status": "online",
        "message": "Medical AI Assistant API is running",
        "endpoints": {
            "/analyze": "POST - Analyze medical query",
            "/health": "GET - Health check"
        }
    }), 200

@flask_app.route('/health', methods=['GET'])
def health_check():
    """Detailed health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Medical AI Assistant",
        "version": "1.0.0"
    }), 200

@flask_app.route('/analyze', methods=['POST'])
def analyze_query():
    """
    Main endpoint to analyze medical queries
    
    Expected JSON body:
    {
        "query": "I have chest pain and difficulty breathing"
    }
    
    Returns:
    {
        "classification": "emergency" | "non_emergency",
        "result": {...}
    }
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                "error": "No JSON data provided",
                "message": "Please send a JSON body with a 'query' field"
            }), 400
        
        # Extract query
        user_query = data.get('query', '').strip()
        
        if not user_query:
            return jsonify({
                "error": "Empty query",
                "message": "Please provide a medical query in the 'query' field"
            }), 400
        
        print(f"\n=== Processing Query: {user_query} ===")
        
        # Run the LangGraph workflow
        inputs = {"query": user_query}
        final_state = None
        
        for output in langgraph_app.stream(inputs):
            for key, value in output.items():
                print(f"Finished node '{key}'.")
                final_state = value
        
        if not final_state:
            return jsonify({
                "error": "Processing failed",
                "message": "No final state was reached during processing"
            }), 500
        
        # Process the result based on classification
        classification = final_state.get("classification")
        
        if classification == "emergency":
            call_sid = final_state.get('call_sid', 'N/A')
            ambulance_location_str = final_state.get('ambulance_location', 'Location unavailable')
            
            # Parse ambulance location if it's a JSON string
            try:
                ambulance_location = json.loads(ambulance_location_str) if ambulance_location_str != 'Location unavailable' else None
            except (json.JSONDecodeError, TypeError):
                ambulance_location = None
            
            return jsonify({
                "classification": "emergency",
                "message": "Emergency detected! Emergency services have been notified.",
                "result": {
                    "call_sid": call_sid,
                    "ambulance_location": ambulance_location,
                    "status": "Emergency call initiated"
                }
            }), 200
            
        elif classification == "non_emergency":
            specialist_json = final_state.get('specialist', '{}')
            
            try:
                specialist_data = json.loads(specialist_json)
                return jsonify({
                    "classification": "non_emergency",
                    "message": "Non-emergency case. Specialist recommendation provided.",
                    "result": specialist_data
                }), 200
            except (json.JSONDecodeError, TypeError):
                return jsonify({
                    "classification": "non_emergency",
                    "message": "Non-emergency case processed",
                    "result": specialist_json
                }), 200
        
        else:
            error_msg = final_state.get('error', 'Unknown classification')
            return jsonify({
                "classification": "unknown",
                "message": "Could not classify the query",
                "error": error_msg
            }), 200
    
    except Exception as e:
        print(f"Error in /analyze endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500


@flask_app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "error": "Not found",
        "message": "The requested endpoint does not exist"
    }), 404

@flask_app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        "error": "Internal server error",
        "message": "An unexpected error occurred"
    }), 500

# Export for Vercel
app = flask_app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'

    print(f"\n{'='*50}")
    print(f"🏥 Medical AI Assistant API Starting...")
    print(f"{'='*50}")
    print(f"📍 Running on: http://localhost:{port}")
    print(f"🔧 Debug mode: {debug}")
    print(f"{'='*50}\n")

    flask_app.run(host='0.0.0.0', port=port, debug=debug)