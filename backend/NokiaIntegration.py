import network_as_code as nac
from network_as_code.models.device_status import EventType
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv
load_dotenv()

class NokiaIntegration:
    def __init__(self):
        self.client = nac.NetworkAsCodeClient(
            token=os.getenv("NOKIA_NETWORK_AS_CODE_API_KEY")
        )

    def get_device_location(self):
        self.my_device = self.client.devices.get(
            phone_number="+999999301000" # to +91999999301005
        )
        self.location = self.my_device.location(max_age=3600)
        return self.location

    def get_device_status(self):
        self.my_device = self.client.devices.get(
            phone_number="+999999301000" # to +91999999301005
        )
        try:
            status = self.my_device.get_connectivity()
            return status
        except Exception as e:
            print(f"Connectivity check failed: {e}")
            # Fallback: try getting roaming status
            try:
                roaming_status = self.my_device.get_roaming()
                return roaming_status
            except Exception as e2:
                print(f"Roaming check failed: {e2}")
                return None

    def create_qod_sessions(self, phone_number="+999999301000", service_ipv4="5.6.7.8"):
        """
        Create 3 QoD sessions with different quality profiles (low, medium, high)

        Args:
            phone_number: The device phone number
            service_ipv4: The service IPv4 address to connect to

        Returns:
            dict: Dictionary containing all three session results
        """
        self.my_device = self.client.devices.get(phone_number=phone_number)

        results = {
            "low": None,
            "medium": None,
            "high": None
        }

        # QoS Profile mapping (based on common CAMARA QoD profiles)
        # QOS_E = Low latency/high bandwidth
        # QOS_M = Medium
        # QOS_L = Lower bandwidth (Large latency tolerance)
        profiles = {
            "low": "QOS_L",      # Low quality - larger latency tolerance
            "medium": "QOS_M",   # Medium quality
            "high": "QOS_E"      # High quality - low latency
        }

        for quality, profile in profiles.items():
            try:
                print(f"\nCreating {quality.upper()} quality QoD session with profile: {profile}")
                session = self.my_device.create_qod_session(
                    profile=profile,
                    duration=3600,  # 1 hour session
                    service_ipv4=service_ipv4,
                    notification_url="https://example.com/notifications",
                    notification_auth_token="your-auth-token"
                )
                results[quality] = {
                    "success": True,
                    "profile": profile,
                    "session": session,
                    "session_id": getattr(session, 'id', None)
                }
                print(f"✓ {quality.upper()} quality session created successfully")
            except Exception as e:
                results[quality] = {
                    "success": False,
                    "profile": profile,
                    "error": str(e)
                }
                print(f"✗ {quality.upper()} quality session failed: {e}")

        return results

if __name__ == "__main__":
    nokia_integration = NokiaIntegration()

    # Test location
    location = nokia_integration.get_device_location()
    print(f"Location: {location.longitude}, {location.latitude}")

    # Test device status
    status = nokia_integration.get_device_status()
    print(f"Status: {status}")

    # Test QoD sessions with all three quality levels
    print("\n" + "="*60)
    print("Creating Quality on Demand (QoD) Sessions")
    print("="*60)
    qod_results = nokia_integration.create_qod_sessions()

    print("\n" + "="*60)
    print("QoD Session Results Summary:")
    print("="*60)
    for quality, result in qod_results.items():
        if result and result.get("success"):
            print(f"  {quality.upper()}: ✓ Session ID: {result.get('session_id')}")
        else:
            print(f"  {quality.upper()}: ✗ Failed - {result.get('error') if result else 'Unknown'}")


