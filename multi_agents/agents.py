import os
from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END
import google.generativeai as genai
from twilio.rest import Client
from dotenv import load_dotenv
import json
import requests
from datetime import datetime

# --- Environment Setup ---
# Load environment variables from a .env file
load_dotenv()

# Configure Gemini API
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")
genai.configure(api_key=gemini_api_key)

# Configure Twilio
twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
twilio_phone_number = os.getenv("TWILIO_PHONE_NUMBER")
emergency_contact_number = os.getenv("EMERGENCY_CONTACT_NUMBER")

if not all([twilio_account_sid, twilio_auth_token, twilio_phone_number, emergency_contact_number]):
    print("Warning: Twilio environment variables not fully set. Call functionality will be simulated.")
    twilio_client = None
else:
    twilio_client = Client(twilio_account_sid, twilio_auth_token)

# --- Agent State Definition ---
class AgentState(TypedDict):
    """
    Defines the state that is passed between nodes in the graph.
    """
    query: str
    classification: Literal["emergency", "non_emergency", "unknown"]
    specialist: str
    call_sid: str
    error: str

# --- Agent Nodes ---

def emergency_agent(state: AgentState) -> AgentState:
    """
    If detected emergency you have to call using twilio and fetch ambulance location
    """
    print("--- Activating Emergency Agent ---")
    
    # Initialize ambulance_location
    ambulance_location = None
    
    if not twilio_client:
        # Fetch location even in simulation mode
        try:
            location_url = "https://nokia-backend.vercel.app/device_location"
            print(f"Fetching ambulance location from {location_url}...")
            
            location_response = requests.get(location_url, timeout=10)
            if location_response.status_code == 200:
                ambulance_location = location_response.json()
                print(f"✓ Successfully fetched ambulance location: {json.dumps(ambulance_location, indent=2)}")
            else:
                print(f"⚠ Failed to fetch location. Status: {location_response.status_code}, Response: {location_response.text}")
        except requests.exceptions.RequestException as e:
            print(f"✗ Error fetching ambulance location: {e}")
        
        return {
            **state, 
            "call_sid": "SIMULATED_EMERGENCY_CALL",
            "ambulance_location": json.dumps(ambulance_location) if ambulance_location else "Location unavailable"
        }

    try:
        # Make emergency call first
        call = twilio_client.calls.create(
            twiml='<Response><Say>This is an emergency alert. A user requires immediate assistance.</Say></Response>',
            to=emergency_contact_number,
            from_=twilio_phone_number
        )
        print(f"Successfully initiated emergency call. SID: {call.sid}")
        
        # Then fetch ambulance location
        try:
            location_url = "https://nokia-backend.vercel.app/device_location"
            print(f"Fetching ambulance location from {location_url}...")
            
            location_response = requests.get(location_url, timeout=10)
            
            if location_response.status_code == 200:
                ambulance_location = location_response.json()
                print(f"✓ Successfully fetched ambulance location: {json.dumps(ambulance_location, indent=2)}")
            else:
                print(f"⚠ Failed to fetch location. Status: {location_response.status_code}, Response: {location_response.text}")
        except requests.exceptions.RequestException as e:
            print(f"✗ Error fetching ambulance location: {e}")
        
        # Return state with both call_sid and location
        return {
            **state, 
            "call_sid": call.sid,
            "ambulance_location": json.dumps(ambulance_location) if ambulance_location else "Location unavailable"
        }
        
    except Exception as e:
        print(f"Error making Twilio call: {e}")
        return {
            **state, 
            "error": str(e), 
            "call_sid": f"ERROR: {str(e)}",
            "ambulance_location": "Location unavailable"
        }

def specialist_agent(state: AgentState) -> AgentState:
    """
    Handles non-emergency cases by identifying a suitable medical specialist.
    Formats the output and sends it to the backend API.
    """
    print("---Activating Specialist Agent ---")
    query = state["query"]
    
    model = genai.GenerativeModel('gemini-2.5-pro')
    
    prompt = f"""
Role & Goal
You are an AI Medical Specialist Agent. Your primary goal is to analyze a patient's health concern and recommend the most appropriate medical specialty.

Input
The user's query is: "{query}"

Core Tasks
1.  Analyze the user's query to determine the chief complaint and reported symptoms.
2.  Based on this, determine the single most relevant medical specialization.
3.  Provide a brief analysis of the symptoms and your reasoning for the chosen specialization.

Output Format (Strict JSON)
You must provide your response in the following JSON format. Do not add any text or explanations outside of the JSON structure.

JSON :-
{{
  "patient_name": "Extract patient name from query or use 'Not provided'",
  "call_id": "Extract from the input",
  "chief_complaint": "The primary symptom or disease reported by the patient",
  "reported_symptoms": ["symptom1", "symptom2", "symptom3"],
  "ai_analysis": "Based on the symptoms provided, detailed analysis here...",
  "recommended_specialty": "The specific medical specialty recommended (e.g., Cardiology, Neurology, etc.)"
}}
"""
    
    try:
        response = model.generate_content(prompt)
        specialist_json = response.text.strip()
        
        # Clean up potential markdown formatting
        if specialist_json.startswith("```json"):
            specialist_json = specialist_json[7:-3].strip()
        elif specialist_json.startswith("```"):
            specialist_json = specialist_json[3:-3].strip()
            
        print(f"Raw Gemini Response: {specialist_json}")
        
        # Parse the JSON response
        gemini_response = json.loads(specialist_json)
        
        # Get call_sid from state or generate a unique ID

        
        # Format according to the required structure
        formatted_output = {
            "call_id": gemini_response.get("call_id", "NA"),
            "patient_information": {
                "name": gemini_response.get("patient_name", "Not provided"),
                "date": datetime.now().strftime("%Y-%m-%d"),
                "duration": "N/A"
            },
            "chief_complaint": gemini_response.get("chief_complaint", ""),
            "reported_symptoms": gemini_response.get("reported_symptoms", []),
            "ai_analysis": gemini_response.get("ai_analysis", ""),
            "recommended_specialty": gemini_response.get("recommended_specialty", "")
        }
        
        print(f"Formatted Medical Record: {json.dumps(formatted_output, indent=2)}")
        
        # Send POST request to backend
        try:
            backend_url = "https://nokia-backend.vercel.app/medical_record"
            headers = {"Content-Type": "application/json"}
            
            backend_response = requests.post(
                backend_url,
                json=formatted_output,
                headers=headers,
                timeout=10
            )
            
            if backend_response.status_code in [200, 201]:
                print(f"✓ Successfully sent medical record to backend. Status: {backend_response.status_code}")
            else:
                print(f"⚠ Backend returned status {backend_response.status_code}: {backend_response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"✗ Error sending data to backend: {e}")
            return {**state, "specialist": json.dumps(formatted_output), "error": f"Backend API error: {str(e)}"}
        
        return {**state, "specialist": json.dumps(formatted_output)}
        
    except json.JSONDecodeError as e:
        print(f"Error parsing Gemini response as JSON: {e}")
        print(f"Raw response: {specialist_json}")
        return {**state, "error": f"JSON parsing error: {str(e)}"}
    except Exception as e:
        print(f"Error in specialist agent: {e}")
        return {**state, "error": str(e)}

def classify_and_route(state: AgentState) -> AgentState:
    """
    Intelligent teleconsultation orchestrator agent in a healthcare triage system.
    Analyzes patient symptoms and determines if the case is a medical emergency.
    """
    print("--- Classifying and Routing Query ---")
    query = state["query"]
    
    model = genai.GenerativeModel('gemini-2.5-pro')
    prompt = f"""You are a medical triage AI. Your ONLY job is to determine if a patient needs IMMEDIATE emergency care (911/ambulance) or can wait for a doctor appointment.

CRITICAL RULE: Be VERY conservative. Only classify as emergency if there is IMMEDIATE risk to life or limb RIGHT NOW.

## TRUE EMERGENCIES (life-threatening, happening NOW):
- Active heart attack: "crushing chest pain", "chest pain radiating to arm/jaw", "chest pressure with sweating"
- Stroke: sudden weakness one side, face drooping, slurred speech, sudden confusion
- Cannot breathe: severe difficulty breathing, choking, turning blue
- Severe bleeding: uncontrollable bleeding, spurting blood
- Unconscious or unresponsive
- Severe burns covering large area
- Poisoning or overdose
- Seizure lasting >5 minutes
- Severe head injury with loss of consciousness
- Anaphylaxis: throat swelling, severe allergic reaction

## NOT EMERGENCIES (can see doctor within hours/days):
- Headache (even severe, unless with stroke symptoms)
- Fever alone (unless infant <3 months or with seizures)
- Cold, cough, sore throat
- Rash, acne, skin problems
- Joint pain, back pain, muscle aches
- Nausea, vomiting, diarrhea (unless severe dehydration)
- Ear pain, toothache
- Minor cuts, bruises, sprains
- UTI symptoms
- Mild abdominal pain

Patient says: "{query}"

Respond with ONLY one word - either "YES" (this IS a true emergency) or "NO" (this is NOT an emergency).
DO NOT explain. DO NOT add context. ONLY respond with YES or NO.

Response:"""
    
    try:
        response = model.generate_content(prompt)
        classification_text = response.text.strip().upper()
        print(f"Triage Decision: {classification_text}")
        
        # Only classify as emergency if the response is exactly "YES"
        if classification_text == "YES":
            print("→ Classification: EMERGENCY")
            return {**state, "classification": "emergency"}
        else:
            print("→ Classification: NON-EMERGENCY")
            return {**state, "classification": "non_emergency"}
    except Exception as e:
        print(f"Error during classification: {e}")
        # Default to non-emergency on error to avoid false emergency calls
        return {**state, "error": str(e), "classification": "non_emergency"}

def route_query(state: AgentState) -> Literal["emergency_route", "specialist_route", "end_route"]:
    """
    Determines the next node to call based on the classification.
    """
    print("--- Routing Query ---")
    classification = state.get("classification")
    print(f"DEBUG: Classification received in route_query: '{classification}'")
    print(f"DEBUG: State keys: {state.keys()}")
    
    if classification == "emergency":
        print("DEBUG: Routing to EMERGENCY")
        return "emergency_route"
    elif classification == "non_emergency":
        print("DEBUG: Routing to SPECIALIST")
        return "specialist_route"
    
    print("DEBUG: Routing to END (default)")
    return "end_route"

# --- Graph Definition ---

# 1. Initialize the StateGraph
workflow = StateGraph(AgentState)

# 2. Add nodes to the graph
workflow.add_node("classify_and_route", classify_and_route)
workflow.add_node("emergency_agent", emergency_agent)
workflow.add_node("specialist_agent", specialist_agent)

# 3. Define the edges
workflow.set_entry_point("classify_and_route")

# Add conditional edge from classify_and_route
workflow.add_conditional_edges(
    "classify_and_route",
    route_query,
    {
        "emergency_route": "emergency_agent",
        "specialist_route": "specialist_agent",
        "end_route": END
    }
)

# Define the end points for the branches
workflow.add_edge("emergency_agent", END)
workflow.add_edge("specialist_agent", END)

# 4. Compile the graph
app = workflow.compile()

# --- Main Execution ---
if __name__ == "__main__":
    print("Medical AI Assistant is ready. Type 'exit' to quit.")
    while True:
        user_query = input("\nPlease describe your medical concern: ")
        if user_query.lower() == 'exit':
            break
        
        if not user_query.strip():
            continue

        inputs = {"query": user_query}
        final_state = None
        print("\n--- Processing your request... ---")
        # The stream method returns dictionaries with the node name and the state after the node has run
        for output in app.stream(inputs):
            for key, value in output.items():
                print(f"Finished node '{key}'.")
                final_state = value
        
        print("\n--- Final Result ---")
        if final_state:
            classification = final_state.get("classification")
            if classification == "emergency":
                call_sid = final_state.get('call_sid', 'N/A')
                ambulance_location = final_state.get('ambulance_location', 'N/A')
                print(f"Emergency Detected!")
                print(f"An emergency call has been initiated. Call SID: {call_sid}")
               
            elif classification == "non_emergency":
                print("Specialist Recommendation:")
                # The output from the specialist agent is expected to be a JSON string
                recommendation_json = final_state.get('specialist', '{}')
                try:
                    # Attempt to parse and pretty-print the JSON
                    recommendation = json.loads(recommendation_json)
                    print(json.dumps(recommendation, indent=2))
                except (json.JSONDecodeError, TypeError):
                    # If it's not valid JSON, print the raw string
                    print(recommendation_json)
            else:
                print("Could not determine the nature of the query. Please try rephrasing.")
        else:
            print("An error occurred during processing. No final state was reached.")
        print("-" * 25)