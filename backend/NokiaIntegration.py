import network_as_code as nac
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
        print(self.location)

if __name__ == "__main__":
    nokia_integration = NokiaIntegration()
    nokia_integration.get_device_location()
