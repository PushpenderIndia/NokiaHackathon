# NokiaHackathon
 
## Running on Android (using ADB & Android Studio)

1. Install Android Studio:

```
  brew install --cask android-studio
```

2. Open Android Studio and install SDK:
  - Launch Android Studio
  - Click "More Actions" → "SDK Manager"
  - Install:
    - Android SDK Platform (latest)
    - Android SDK Build-Tools
    - Android SDK Command-line Tools

3. Set environment variables:

```
Add to ~/.zshrc (or ~/.bash_profile):

export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

4. Reload terminal:

```
  source ~/.zshrc
```

5. Verify:

```
  adb --version
```

6. Run

```
  npx expo run:android
```

## Running iOS

```
cd react_native
npm install
npx expo prebuild --clean
npx expo run:ios
```

## Building APK using Expo.dev

```
cd react_native

# One time login to expo.dev
eas login 

# One time config generation
eas build:configure 

eas build --platform android --profile preview
```

## System Architecture 

```mermaid
graph TD
    %% High Level Overview
    P[Patient Device] --> NW[Nokia APIs<br/>Device Status, Location, Quality]
    NW --> FB[Flask Backend Server]
    
    FB --> ACS[Adaptive Communication System<br/>Text/Voice/Video]
    FB --> AIA[Google ADK AI Agents<br/>Diagnosis, Routing, Emergency]
    FB --> DB[(MongoDB Database)]
    
    ACS --> DOC[Doctor Interface]
    AIA --> DOC
    
    %% Emergency Flow
    AIA -->|Emergency Detected| EMS[Emergency Services<br/>Ambulance Dispatch]
    
    %% Data Flow
    DB --> DOC
    DOC --> DB
    
    %% Styling
    classDef nokia fill:#0066cc,stroke:#004499,stroke-width:2px,color:#fff
    classDef flask fill:#000000,stroke:#333333,stroke-width:2px,color:#fff
    classDef google fill:#4285f4,stroke:#3367d6,stroke-width:2px,color:#fff
    classDef mongodb fill:#47A248,stroke:#3d8b40,stroke-width:2px,color:#fff
    classDef communication fill:#28a745,stroke:#1e7e34,stroke-width:2px,color:#fff
    classDef emergency fill:#dc3545,stroke:#bd2130,stroke-width:2px,color:#fff
    classDef device fill:#6f42c1,stroke:#5a32a3,stroke-width:2px,color:#fff
    
    class NW nokia
    class FB flask
    class AIA google
    class DB mongodb
    class ACS communication
    class EMS emergency
    class P,DOC device
```

## Flow Diagram

```mermaid
graph TD
    %% Patient Side
    P[Patient] --> N[Nokia APIs]
    
    %% Flask Backend
    N --> F[Flask Backend]
    
    %% Quality Decision
    F --> Q{Network Quality?}
    Q -->|Low| T[Text + TTS]
    Q -->|Medium| V[Voice + Smart Video]
    Q -->|High| H[Full Video]
    
    %% Communication
    T --> D[Doctor]
    V --> D
    H --> D
    
    %% AI Processing
    D --> A[AI Agents<br/>Google ADK]
    A --> DB[(MongoDB)]
    
    %% Emergency
    A -->|Emergency?| E[Ambulance<br/>Dispatch]
    
    %% Styling
    classDef patient fill:#6f42c1,stroke:#5a32a3,stroke-width:2px,color:#fff
    classDef nokia fill:#0066cc,stroke:#004499,stroke-width:2px,color:#fff
    classDef flask fill:#000000,stroke:#333333,stroke-width:2px,color:#fff
    classDef comm fill:#28a745,stroke:#1e7e34,stroke-width:2px,color:#fff
    classDef ai fill:#4285f4,stroke:#3367d6,stroke-width:2px,color:#fff
    classDef db fill:#47A248,stroke:#3d8b40,stroke-width:2px,color:#fff
    classDef emergency fill:#dc3545,stroke:#bd2130,stroke-width:2px,color:#fff
    
    class P,D patient
    class N nokia
    class F flask
    class T,V,H comm
    class A ai
    class DB db
    class E emergency
```

## Multi AI Agent System Architecture

```mermaid
graph TD
    %% Input Source
    INPUT[Patient-Doctor Communication] --> DISPATCHER[AI Agent Dispatcher]
    
    %% Three ADK Agents
    DISPATCHER --> A1[Medical Diagnosis Agent<br/>Google ADK]
    DISPATCHER --> A2[Specialist Routing Agent<br/>Google ADK]
    DISPATCHER --> A3[Emergency Detection Agent<br/>Google ADK]
    
    %% Agent 1 Processing
    A1 --> SYMPTOMS[Extract Symptoms<br/>& Medical Context]
    SYMPTOMS --> DIAGNOSIS[Generate Diagnosis<br/>& Treatment Plan]
    DIAGNOSIS --> OUTPUT1[Medical Summary<br/>& Recommendations]
    
    %% Agent 2 Processing
    A2 --> CLASSIFY[Classify Medical<br/>Domain & Keywords]
    CLASSIFY --> ROUTE[Route to Appropriate<br/>Specialist Type]
    ROUTE --> OUTPUT2[Specialist Assignment<br/>& Priority Level]
    
    %% Agent 3 Processing
    A3 --> MONITOR[Monitor for Emergency<br/>Keywords & Patterns]
    MONITOR --> ASSESS[Assess Emergency<br/>Severity Level]
    ASSESS --> OUTPUT3[Emergency Response<br/>& Alert Level]
    
    %% Data Storage
    OUTPUT1 --> DB[(MongoDB)]
    OUTPUT2 --> DB
    OUTPUT3 --> DB
    
    %% Agent Collaboration
    A1 -.->|Medical Context| A2
    A1 -.->|Patient Condition| A3
    A2 -.->|Urgency Info| A3
    A3 -.->|Emergency Status| A1
    A3 -.->|Priority Level| A2
    
    %% Styling
    classDef google fill:#4285f4,stroke:#3367d6,stroke-width:2px,color:#fff
    classDef processing fill:#17a2b8,stroke:#138496,stroke-width:2px,color:#fff
    classDef medical fill:#28a745,stroke:#1e7e34,stroke-width:2px,color:#fff
    classDef routing fill:#fd7e14,stroke:#e8590c,stroke-width:2px,color:#fff
    classDef emergency fill:#dc3545,stroke:#bd2130,stroke-width:2px,color:#fff
    classDef output fill:#20c997,stroke:#1aa179,stroke-width:2px,color:#fff
    classDef mongodb fill:#47A248,stroke:#3d8b40,stroke-width:2px,color:#fff
    classDef input fill:#6f42c1,stroke:#5a32a3,stroke-width:2px,color:#fff
    
    class A1,A2,A3 google
    class DISPATCHER processing
    class SYMPTOMS,DIAGNOSIS medical
    class CLASSIFY,ROUTE routing
    class MONITOR,ASSESS emergency
    class OUTPUT1,OUTPUT2,OUTPUT3 output
    class DB mongodb
    class INPUT input
```

## iOS APP Screenshots

| | | |
|:---:|:---:|:---:|
| ![](docs/1.jpeg) | ![](docs/2.jpeg) | ![](docs/3.jpeg) |
| ![](docs/4.jpeg) | ![](docs/5.jpeg) | ![](docs/6.jpeg) |
| ![](docs/7.jpeg) | ![](docs/8.jpeg) | |

![](docs/9.jpeg) 

## Deployed Backend Link:

- Multi Ai Agent: https://nokia-multi-agent.vercel.app/

- FastAPI Main Backend: https://nokia-backend.vercel.app/docs
