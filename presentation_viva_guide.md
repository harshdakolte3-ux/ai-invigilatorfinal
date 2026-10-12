# 🎓 AI-Invigilator: Viva Presentation & Topic Division Guide (3 Team Members)

---

## 👥 Executive Division Summary

| Member | Primary Role | Key Technical Focus | Live Demo Responsibility |
| :--- | :--- | :--- | :--- |
| **Member 1** | **Vision AI & Identity Specialist** | MediaPipe FaceLandmarker, COCO-SSD Object Detection, Pre-Exam Identity Verification | Student Login, Baseline Face Capture, Pre-Exam Face Match |
| **Member 2** | **Multi-Modal Audio AI & Active Exam Engine** | Web Audio API, FFT Vocal Spectrum Analysis, Dynamic AI Trust Scoring | Active Exam Screen, Live Sound Waveform, Speech/Whisper Trigger |
| **Member 3** | **Proctor Dashboard & Analytics Specialist** | Real-Time Telemetry Pipeline, PostgreSQL DB Schema, PDF Report Generation | Teacher Live Monitoring Grid, Silent Live Tap-In Console, PDF Export |

---

## 📌 Member 1: Vision AI & Pre-Exam Identity Verification

### 🎯 Scope & Responsibilities
* **Student Registration & Baseline Photo Capture**: How baseline biometrics are captured during registration.
* **Pre-Exam Face Verification (Anti-Impersonation)**: Matching live webcam feed with registered baseline photo before unlocking exam questions.
* **Computer Vision Models**:
  1. **MediaPipe Tasks Vision (`FaceLandmarker`)**: 468 3D facial mesh points for eye tracking, head pose estimation, and face match.
  2. **TensorFlow.js (`COCO-SSD`)**: Real-time object detection for mobile phones and multi-person detection.

### 🗣️ Presentation Opening Line
> *"Hello Madam, I handle the Vision AI Engine and Pre-Exam Anti-Impersonation pipeline. Before a student can access any question, our system performs biometric identity verification against their registered baseline face."*

### ❓ Expected Viva Questions & Answers for Member 1

1. **Q: How does the Pre-Exam Identity Verification work?**
   * **Ans:** *"During registration, we extract facial landmarks using MediaPipe. When the student attempts an exam, the camera captures a live frame, extracts landmark vectors, and computes Euclidean distance. Only if the match confidence meets our threshold does the exam unlock."*

2. **Q: What models are you running in the browser and how do they perform?**
   * **Ans:** *"We run TensorFlow.js COCO-SSD for mobile phone object detection and MediaPipe FaceLandmarker for 468 3D facial mesh points. Both execute client-side via WebGL hardware acceleration at 30 FPS without overloading the server."*

3. **Q: What happens if a student hides their face or looks away?**
   * **Ans:** *"MediaPipe tracks head direction (pitch, yaw, roll) and eye closure. If the student looks left/right or covers their face for more than 3 seconds, a temporal incident timer triggers and logs a violation."*

---

## 📌 Member 2: Multi-Modal Audio AI & Active Exam Engine

### 🎯 Scope & Responsibilities
* **Multi-Modal AI System (Vision + Audio Integration)**: Explaining why video monitoring alone is insufficient.
* **Web Audio API & FFT Spectrum Analysis**: How human vocal frequencies are isolated from ambient room noise.
* **Whisper vs Speech Classification**: Detecting off-camera whispering (2.5kHz - 5.5kHz sibilance band) vs direct speech (120Hz - 2.4kHz formant band).
* **Dynamic AI Confidence Score Algorithm**: Computing overall trust (0% - 100%) in real time.

### 🗣️ Presentation Opening Line
> *"Hello Madam, I handle the Multi-Modal Audio AI and Active Exam Invigilator Engine. Video alone cannot detect someone whispering answers off-camera, so we built an audio spectrum analyzer using Web Audio API to detect voice harmonics."*

### ❓ Expected Viva Questions & Answers for Member 2

1. **Q: How do you detect whispering if the person is off-camera?**
   * **Ans:** *"We use Web Audio API `AnalyserNode` with Fast Fourier Transform (FFT). We pass the audio through a Biquad bandpass filter (120Hz–4500Hz). Whispers exhibit low volume (RMS) but distinct high-frequency fricative energy in the 2.5kHz–5.5kHz band, which our algorithm isolates from background fan noise."*

2. **Q: How is the dynamic AI Confidence Score calculated?**
   * **Ans:** *"The student starts with a 98% base trust score. Deductions apply dynamically every 2 seconds: -55% for Mobile Phone, -45% for Multiple Persons, -35% for Speech, -25% for Whisper, and -15% for looking away. If trust drops below 50%, the candidate's status automatically turns Red (Suspicious)."*

3. **Q: How do you prevent background noise (like fans or cars) from triggering false alarms?**
   * **Ans:** *"We implement dynamic background noise floor tracking. The system continuously measures ambient RMS and calculates Signal-to-Noise Ratio (SNR). Only frequencies matching human vocal formant structures trigger an incident."*

---

## 📌 Member 3: Live Proctoring Dashboard, Database & Analytics

### 🎯 Scope & Responsibilities
* **Teacher Live Monitoring Dashboard**: Real-time traffic-light indicators (🟢 Normal, 🟡 Warning, 🔴 Suspicious).
* **Silent Live Stream Tap-In Console**: Allowing proctors to inspect candidate webcam, screen share viewport, and live biometrics.
* **Database & Telemetry Pipeline**: PostgreSQL schema (`live_sessions`, `exam_incidents`, `results`, `students`).
* **Automated PDF Examination Reports**: Generating PDF reports with embedded student baseline photos and incident metrics.

### 🗣️ Presentation Opening Line
> *"Hello Madam, I handle the Proctoring Dashboard, Backend Telemetry Architecture, and Report Generation. We give invigilators a real-time overview of all online candidates with silent stream surveillance and automated PDF audit reports."*

### ❓ Expected Viva Questions & Answers for Member 3

1. **Q: How does the teacher see student status updates in real-time?**
   * **Ans:** *"The active exam sends a telemetry ping every 2 seconds containing webcam snapshots, screen viewport state, and AI metrics. The proctor dashboard polls `getLiveSessions` and dynamically sorts suspicious/warning candidates to the top."*

2. **Q: How does the Silent Live Stream Tap-In work?**
   * **Ans:** *"When a teacher clicks a candidate card, a surveillance modal opens with 3 tabs: Webcam Stream, Screen Share Stream, and Baseline Match. The proctor can monitor the student's screen and webcam in real-time without disturbing the candidate."*

3. **Q: What is included in the final Examination Report PDF?**
   * **Ans:** *"The PDF report includes the Student's Registration Baseline Photo, score, pass/fail status, AI risk score (Low/Moderate/High), and a breakdown of incidents like tab switching, phone detection, and speech violations, compiled using jsPDF and autoTable."*

---

## 💡 Pro Viva Demo Strategy & Presentation Flow

1. **Step 1 (Member 1)**: Show **Registration & Student Login**. Click *"Verify Pre-Exam Identity"*. Explain how MediaPipe verifies the baseline face photo before unlocking the exam.
2. **Step 2 (Member 2)**: Enter **Active Exam**. Show the **Multi-Modal Audio AI** box. Speak or whisper near the mic to demonstrate the live green sound wave turning amber/red with instant speech alert.
3. **Step 3 (Member 3)**: Open **Teacher Live Monitoring Dashboard** on `/admin/live-monitoring`. Show traffic-light cards (🟢 🟡 🔴), open **Silent Tap-In Modal**, and click **View Report** on `/admin/reports` to display the PDF report with the student photo.
