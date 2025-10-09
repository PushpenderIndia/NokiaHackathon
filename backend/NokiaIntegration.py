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

if __name__ == "__main__":
    nokia_integration = NokiaIntegration()
    location = nokia_integration.get_device_location()
    print(location.longitude, location.latitude)

    status = nokia_integration.get_device_status()
    print(status)


