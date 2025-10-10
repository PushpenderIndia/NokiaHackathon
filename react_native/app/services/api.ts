// API Service for Nokia Multi-Agent and Backend Integration

const MULTI_AGENT_BASE_URL = 'https://nokia-multi-agent.vercel.app';
const BACKEND_BASE_URL = 'https://nokia-backend.vercel.app';

// Types for API responses
export interface EmergencyResponse {
  classification: 'emergency';
  message: string;
  result: {
    call_sid: string;
    ambulance_location: {
      latitude: number;
      longitude: number;
    } | null;
    status: string;
  };
}

export interface NonEmergencyResponse {
  classification: 'non_emergency';
  message: string;
  result: {
    call_id: string;
    patient_information: {
      name: string;
      date: string;
      duration: string;
    };
    chief_complaint: string;
    reported_symptoms: string[];
    ai_analysis: string;
    recommended_specialty: string;
  };
}

export type AnalyzeResponse = EmergencyResponse | NonEmergencyResponse;

export interface DriverInfo {
  name: string;
  status: string;
  latitude: number;
  longitude: number;
}

export interface PatientLocation {
  location: string;
  latitude: number;
  longitude: number;
}

export interface StatusResponse {
  call_id: string;
  emergency_details: {
    call_id: string;
    status: string;
    driver: DriverInfo;
    patient: PatientLocation;
  } | 'No emergency data';
  medical_record_details: {
    call_id: string;
    patient_information: {
      name: string;
      date: string;
      duration: string;
    };
    chief_complaint: string;
    reported_symptoms: string[];
    ai_analysis: string;
    recommended_specialty: string;
  } | 'No medical record data';
}

// Analyze medical query using multi-agent workflow
export async function analyzeQuery(query: string): Promise<AnalyzeResponse> {
  try {
    const response = await fetch(`${MULTI_AGENT_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to analyze query');
    }

    const data: AnalyzeResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error in analyzeQuery:', error);
    throw error;
  }
}

// Get status by call_id
export async function getStatus(callId: string): Promise<StatusResponse> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/status?call_id=${encodeURIComponent(callId)}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No records found for this call ID');
      }
      throw new Error('Failed to fetch status');
    }

    const data: StatusResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getStatus:', error);
    throw error;
  }
}

// Poll status API until data is available
export async function pollStatus(
  callId: string,
  options: {
    maxAttempts?: number;
    interval?: number;
    onProgress?: (attempt: number, maxAttempts: number) => void;
  } = {}
): Promise<StatusResponse> {
  const { maxAttempts = 5, interval = 2000, onProgress } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (onProgress) {
        onProgress(attempt, maxAttempts);
      }

      const status = await getStatus(callId);

      // Check if we have meaningful data
      if (
        (typeof status.emergency_details === 'object' && status.emergency_details !== null) ||
        (typeof status.medical_record_details === 'object' && status.medical_record_details !== null)
      ) {
        return status;
      }
    } catch (error) {
      // If it's a 404, continue polling as data might not be ready yet
      if (attempt === maxAttempts) {
        throw new Error('Timeout: Data not available after maximum attempts');
      }
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Timeout: Failed to get status after maximum attempts');
}

// Health check for multi-agent API
export async function checkMultiAgentHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MULTI_AGENT_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Multi-agent health check failed:', error);
    return false;
  }
}

// Health check for backend API
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/`);
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}
