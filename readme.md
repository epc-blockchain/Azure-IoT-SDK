## BESC Azure IoT-Hub SDK Integrated System

### Overview
This SDK is created to allow client push energy data to BESC through Azure IoT-Hub.
Below shows two of the required SDK to push and pull data from gateway devices using MQTT and Azure IoT-Hub.
Both SDK are seperated for personalized industrial configuration purpose.

#### **Push Data SDK**

https://github.com/epc-blockchain/MQTT-Push-Azure

**Description**

This SDK reads devicedata.json file that is generated by gateway device and that upload to Azure IoT-Hub. 



#### **Pull Data SDK**

https://github.com/epc-blockchain/MQTT-Pull-Azure

**Description**

This SDK detect and receives data being pushed to Azure-IoT-Hub and then call BESC ESS_API_CLIENT to stores the detected data.

