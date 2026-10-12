const { jsPDF } = require('./node_modules/jspdf');
const fs = require('fs');
const path = require('path');

const doc = new jsPDF();

// Palette
const primaryColor = [0, 74, 198];
const secondaryColor = [15, 23, 42];
const accentColor = [16, 185, 129];
const darkText = [30, 41, 59];
const lightText = [100, 116, 139];

// --- PAGE 1 ---

// Header Banner
doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
doc.rect(0, 0, 210, 40, 'F');

doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
doc.rect(15, 12, 8, 8, 'F');

doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(22);
doc.text('AI-Invigilator', 28, 19);

doc.setFontSize(10);
doc.setTextColor(148, 163, 184);
doc.text('MULTI-MODAL AUTOMATED EXAM PROCTORING SYSTEM', 28, 26);

doc.setFontSize(9);
doc.setTextColor(255, 255, 255);
doc.text('COMPREHENSIVE PROJECT OVERVIEW & VIVA PRESENTATION GUIDE', 15, 34);

// Section 1: Synopsis
doc.setFontSize(14);
doc.setFont('helvetica', 'bold');
doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
doc.text('1. Executive Synopsis', 15, 52);

doc.setFontSize(9.5);
doc.setFont('helvetica', 'normal');
doc.setTextColor(darkText[0], darkText[1], darkText[2]);

const synopsisText = "AI-Invigilator is an advanced, full-stack online examination proctoring system that transforms standard computer webcams and microphones into a Multi-Modal AI Security Suite (Vision + Audio). It addresses the core vulnerabilities of remote testing—impersonation, off-camera whispering, mobile phone usage, and tab switching—without requiring manual invigilation for every candidate.";
doc.text(doc.splitTextToSize(synopsisText, 180), 15, 59);

// Section 2: Core Architecture Modules
doc.setFontSize(14);
doc.setFont('helvetica', 'bold');
doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
doc.text('2. Core System Modules', 15, 80);

const modules = [
  {
    title: 'A. Pre-Exam Identity AI (Anti-Impersonation)',
    desc: 'Captures a baseline face photo during registration and performs 3D landmark vector matching before unlocking exam questions.'
  },
  {
    title: 'B. Vision AI Monitoring Engine',
    desc: 'Uses MediaPipe 3D FaceLandmarker (468 points for eye tracking and head direction) and TensorFlow.js COCO-SSD for mobile phone & multi-person detection at 30 FPS.'
  },
  {
    title: 'C. Multi-Modal Audio & Whisper Isolator',
    desc: 'Uses Web Audio API & FFT Spectrum Analysis to isolate human vocal formants (120Hz-2.4kHz) and off-camera whispering fricatives (2.5kHz-5.5kHz) from background fan noise.'
  },
  {
    title: 'D. Live Proctor Dashboard & Tap-In Console',
    desc: 'Real-time traffic-light grid (Normal, Warning, Suspicious) with silent live stream access (webcam + screen share) and PDF report generation.'
  }
];

let currentY = 88;
modules.forEach(m => {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, currentY, 180, 19, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(m.title, 19, currentY + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(doc.splitTextToSize(m.desc, 172), 19, currentY + 12);

  currentY += 22;
});

// Section 3: Tech Stack Table
doc.setFontSize(14);
doc.setFont('helvetica', 'bold');
doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
doc.text('3. Technical Stack', 15, currentY + 6);

currentY += 12;
const techStack = [
  ['Frontend UI', 'React 18, Vite, Tailwind CSS, Material Symbols'],
  ['Client-Side AI/ML', 'MediaPipe Tasks Vision, TensorFlow.js COCO-SSD, Web Audio API'],
  ['Backend & API', 'Node.js, Express.js, JWT Authentication'],
  ['Database & Reports', 'PostgreSQL (ai_invigilator), jsPDF, autoTable']
];

doc.setFillColor(241, 245, 249);
doc.rect(15, currentY, 180, 6, 'F');
doc.setFontSize(9);
doc.setFont('helvetica', 'bold');
doc.setTextColor(lightText[0], lightText[1], lightText[2]);
doc.text('LAYER', 19, currentY + 4.5);
doc.text('TECHNOLOGIES USED', 70, currentY + 4.5);
currentY += 6;

techStack.forEach(row => {
  doc.setDrawColor(226, 232, 240);
  doc.line(15, currentY + 6, 195, currentY + 6);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(row[0], 19, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.text(row[1], 70, currentY + 4.5);
  currentY += 7;
});

// Footer Page 1
doc.setFontSize(8);
doc.setFont('helvetica', 'italic');
doc.setTextColor(lightText[0], lightText[1], lightText[2]);
doc.text('AI-Invigilator Presentation & Viva Guide | Page 1 of 2', 105, 287, { align: 'center' });

// --- PAGE 2 ---
doc.addPage();

// Header Page 2
doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
doc.rect(0, 0, 210, 24, 'F');

doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.text('AI-Invigilator: Viva Presentation & Topic Division Guide', 15, 16);

// Section 4: Team Member Division
doc.setFontSize(13);
doc.setFont('helvetica', 'bold');
doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
doc.text('4. Team Member Topic Division & Viva Roles', 15, 34);

const members = [
  {
    name: 'MEMBER 1: Vision AI & Identity Verification',
    topics: 'Pre-Exam Identity Verification, MediaPipe 3D Mesh, TensorFlow COCO-SSD Phone Detection.',
    q1: 'Q: How does identity verification work?',
    a1: 'Ans: Extracts facial landmarks during registration; matches live camera vectors using Euclidean distance.',
    q2: 'Q: How do AI models run client-side?',
    a2: 'Ans: Executed via WebGL hardware acceleration at 30 FPS without server latency.'
  },
  {
    name: 'MEMBER 2: Multi-Modal Audio AI & Active Exam Engine',
    topics: 'Web Audio API, FFT Spectrum Analysis, Whisper vs Speech Isolator, Dynamic AI Trust Scoring.',
    q1: 'Q: How is off-camera whispering detected?',
    a1: 'Ans: Uses Biquad bandpass filter (120Hz-4.5kHz). Isolates 2.5kHz-5.5kHz sibilant fricative harmonics from fan noise.',
    q2: 'Q: How is the dynamic AI Trust Score calculated?',
    a2: 'Ans: Starts at 98%. Deducts -55% Phone, -45% Multi-Face, -35% Speech, -25% Whisper, -15% Head Turn.'
  },
  {
    name: 'MEMBER 3: Proctor Dashboard & PDF Analytics',
    topics: 'Teacher Live Monitoring Grid, Silent Live Stream Tap-In, Postgres Schema, PDF Reports.',
    q1: 'Q: How does the proctor monitor candidates in real-time?',
    a1: 'Ans: Active exam pings telemetry every 2s; dashboard categorizes into Normal, Warning, and Suspicious.',
    q2: 'Q: What does the View Report modal do?',
    a2: 'Ans: Displays in-app PDF preview with student registration photo, score, risk score, and incident log.'
  }
];

let mY = 40;
members.forEach(mem => {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, mY, 180, 50, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(mem.name, 19, mY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text('Focus: ' + mem.topics, 19, mY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(mem.q1, 19, mY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(mem.a1, 19, mY + 26);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(mem.q2, 19, mY + 34);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(mem.a2, 19, mY + 40);

  mY += 54;
});

// Section 5: Presentation Opening Pitch
doc.setFontSize(13);
doc.setFont('helvetica', 'bold');
doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
doc.text('5. 30-Second Opening Elevator Pitch', 15, 210);

doc.setFillColor(236, 253, 245);
doc.setDrawColor(16, 185, 129);
doc.roundedRect(15, 215, 180, 48, 2, 2, 'FD');

doc.setFontSize(8.5);
doc.setFont('helvetica', 'bold');
doc.setTextColor(4, 120, 87);
doc.text('RECOMMENDED PRESENTATION OPENING:', 19, 222);

doc.setFontSize(8.5);
doc.setFont('helvetica', 'normal');
doc.setTextColor(6, 78, 59);
const pitch = '"Good morning Madam. Today we present AI-Invigilator, a Multi-Modal AI automated online exam proctoring system. Traditional online exams suffer from impersonation, off-camera whispering, mobile phone usage, and tab switching. Our application solves this by combining client-side Computer Vision (MediaPipe and TensorFlow.js) with Web Audio API frequency spectrum analysis. We verify candidate identity before the exam, track vision and audio harmonics in real time, compute a dynamic AI Trust Score, and provide teachers with a Live Traffic-Light Monitoring Dashboard and automated PDF report cards containing student baseline photos."';

doc.text(doc.splitTextToSize(pitch, 172), 19, 228);

// Footer Page 2
doc.setFontSize(8);
doc.setFont('helvetica', 'italic');
doc.setTextColor(lightText[0], lightText[1], lightText[2]);
doc.text('AI-Invigilator Presentation & Viva Guide | Page 2 of 2', 105, 287, { align: 'center' });

// Output Path
const outputPath = path.join(__dirname, 'AI_Invigilator_Project_Overview.pdf');
const pdfOutput = doc.output('arraybuffer');
fs.writeFileSync(outputPath, Buffer.from(pdfOutput));

console.log('PDF generated successfully at:', outputPath);
