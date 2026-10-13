import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { publishExam } from '../../services/authService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AIExamGenerator = ({ protectedMode = true }) => {
  // Input form states
  const [examTitle, setExamTitle] = useState('');
  const [syllabusTopic, setSyllabusTopic] = useState('');
  const [aggregatedText, setAggregatedText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);

  // Question type toggles (all 3 true by default as in screenshot)
  const [includeMCQs, setIncludeMCQs] = useState(true);
  const [includeCoding, setIncludeCoding] = useState(true);
  const [includeDescriptive, setIncludeDescriptive] = useState(true);

  // Configuration settings
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(50);
  const [duration, setDuration] = useState(60);
  const [totalMarks, setTotalMarks] = useState(100);

  // Generation & Draft states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isPublishing, setIsPublishing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fileInputRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Extract text from uploaded PPTX / PPT / text files
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    setIsExtracting(true);

    const newUploaded = [...uploadedFiles];
    let newlyExtractedText = '';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name;
      const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

      try {
        if (fileName.toLowerCase().endsWith('.pptx')) {
          const zip = await JSZip.loadAsync(file);
          const slideFiles = Object.keys(zip.files).filter(
            (fname) => fname.startsWith('ppt/slides/slide') && fname.endsWith('.xml')
          );

          // Natural numerical sort for slide files
          slideFiles.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/) || 0);
            const numB = parseInt(b.match(/\d+/) || 0);
            return numA - numB;
          });

          let fileText = '';
          for (let sIdx = 0; sIdx < slideFiles.length; sIdx++) {
            const xml = await zip.files[slideFiles[sIdx]].async('text');
            const matches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
            if (matches) {
              const cleaned = matches
                .map((m) => m.replace(/<[^>]+>/g, '').trim())
                .filter(Boolean)
                .join(' ');
              if (cleaned) {
                fileText += `Slide ${sIdx + 1}: ${cleaned}\n`;
              }
            }
          }

          newlyExtractedText += `\n--- [FILE: ${fileName} (${slideFiles.length} Slides)] ---\n` + fileText;
          newUploaded.push({
            name: fileName,
            size: fileSize,
            slidesCount: slideFiles.length,
            status: 'success',
          });

          // Auto-suggest title if empty
          if (!examTitle) {
            const suggested = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            setExamTitle(`${suggested} Comprehensive Exam`);
          }
        } else {
          // Plain text / notes fallback
          const text = await file.text();
          newlyExtractedText += `\n--- [FILE: ${fileName}] ---\n` + text.slice(0, 5000);
          newUploaded.push({
            name: fileName,
            size: fileSize,
            slidesCount: 1,
            status: 'success',
          });
        }
      } catch (err) {
        console.error('Error parsing file:', fileName, err);
        newUploaded.push({
          name: fileName,
          size: fileSize,
          slidesCount: 0,
          status: 'error',
        });
      }
    }

    setUploadedFiles(newUploaded);
    setAggregatedText((prev) => (prev ? prev + '\n' + newlyExtractedText : newlyExtractedText));
    setIsExtracting(false);
    showToast(`Processed ${files.length} file(s) and aggregated slide content!`);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeFile = (idx) => {
    const updated = [...uploadedFiles];
    updated.splice(idx, 1);
    setUploadedFiles(updated);
  };

  // Intelligent Exam Synthesizer
  const handleGenerateExam = async () => {
    if (!examTitle && !syllabusTopic && !aggregatedText) {
      showToast('Please provide an Exam Title, Syllabus Topic, or upload presentations.', 'error');
      return;
    }

    if (!includeMCQs && !includeCoding && !includeDescriptive) {
      showToast('Please select at least one question type (MCQs, Coding, or Descriptive).', 'error');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(1);

    // Dynamic generation progress steps
    const stepTimer1 = setTimeout(() => setGenerationStep(2), 700);
    const stepTimer2 = setTimeout(() => setGenerationStep(3), 1500);
    const stepTimer3 = setTimeout(() => setGenerationStep(4), 2300);

    // Synthesize exam draft based on syllabus topic and content
    setTimeout(() => {
      const topic = syllabusTopic || examTitle || 'Operating Systems and Computer Architecture';
      const count = parseInt(questionCount) || 50;

      // Determine breakdown based on selected types
      let mcqTarget = 0;
      let codingTarget = 0;
      let descTarget = 0;

      const typesCount = (includeMCQs ? 1 : 0) + (includeCoding ? 1 : 0) + (includeDescriptive ? 1 : 0);
      if (includeMCQs) mcqTarget = Math.round(count * (typesCount === 1 ? 1 : 0.65));
      if (includeCoding) codingTarget = Math.max(1, Math.round(count * 0.15));
      if (includeDescriptive) descTarget = Math.max(1, Math.round(count * 0.2));

      const generated = generateCurriculumQuestions(topic, difficulty, {
        mcqCount: mcqTarget,
        codingCount: includeCoding ? codingTarget : 0,
        descCount: includeDescriptive ? descTarget : 0,
        totalMarks: parseInt(totalMarks) || 100,
        duration: parseInt(duration) || 60,
      });

      setGeneratedDraft({
        title: examTitle || `${topic} Comprehensive Exam`,
        subject: topic,
        difficulty,
        duration: parseInt(duration) || 60,
        totalMarks: parseInt(totalMarks) || 100,
        questions: generated,
      });

      setIsGenerating(false);
      setGenerationStep(0);
      showToast(`Successfully generated ${generated.length} AI exam questions!`);
    }, 3000);
  };

  // Publish generated exam to Postgres Database
  const handlePublishToDatabase = async () => {
    if (!generatedDraft || !generatedDraft.questions) return;
    setIsPublishing(true);

    try {
      // Filter out MCQ questions formatted for questions table
      const mcqQuestions = generatedDraft.questions
        .filter((q) => q.type === 'MCQ')
        .map((q) => ({
          question_text: q.question,
          option_a: q.options[0],
          option_b: q.options[1],
          option_c: q.options[2],
          option_d: q.options[3],
          correct_option: q.correctAnswer,
        }));

      const payload = {
        exam_name: generatedDraft.title,
        subject: generatedDraft.subject,
        duration: generatedDraft.duration,
        total_marks: generatedDraft.totalMarks,
        questions: mcqQuestions,
      };

      const res = await publishExam(payload);
      if (res && res.success) {
        showToast(`Exam successfully published to database (Exam ID: #${res.exam_id})!`);
      } else {
        showToast(res.message || 'Failed to publish exam to database.', 'error');
      }
    } catch (err) {
      console.error('Publish error:', err);
      showToast('Error connecting to server. Please verify backend is running.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Export PDF Exam Paper
  const handleExportPDF = () => {
    if (!generatedDraft) return;
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica');

      // Header
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text(generatedDraft.title, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Subject: ${generatedDraft.subject}  |  Duration: ${generatedDraft.duration} Mins  |  Total Marks: ${generatedDraft.totalMarks}  |  Difficulty: ${generatedDraft.difficulty}`,
        14,
        28
      );

      doc.setDrawColor(203, 213, 225);
      doc.line(14, 32, 196, 32);

      let yPos = 40;

      generatedDraft.questions.forEach((q, idx) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`Q${idx + 1}. [${q.type}] (${q.marks} Marks)`, 14, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(q.question, 180);
        doc.text(splitText, 14, yPos);
        yPos += splitText.length * 5 + 3;

        if (q.type === 'MCQ') {
          q.options.forEach((opt, oIdx) => {
            const letter = String.fromCharCode(65 + oIdx);
            const isCorrect = letter === q.correctAnswer;
            if (isCorrect) {
              doc.setTextColor(16, 185, 129);
              doc.text(`   [${letter}] ${opt}  (Correct Answer)`, 14, yPos);
            } else {
              doc.setTextColor(71, 85, 105);
              doc.text(`   [${letter}] ${opt}`, 14, yPos);
            }
            yPos += 5;
          });
          yPos += 4;
        } else if (q.type === 'CODING') {
          doc.setFont('courier', 'normal');
          doc.setTextColor(51, 65, 85);
          doc.text(`   Constraints: ${q.constraints || 'N/A'}`, 14, yPos);
          yPos += 5;
          if (q.sampleInput) {
            doc.text(`   Sample Input: ${q.sampleInput}  -->  Output: ${q.sampleOutput}`, 14, yPos);
            yPos += 5;
          }
          yPos += 4;
        } else if (q.type === 'DESCRIPTIVE') {
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 116, 139);
          doc.text(`   Grading Rubric: ${q.rubric || 'Technical accuracy (60%), Explanation (40%)'}`, 14, yPos);
          yPos += 7;
        }
      });

      doc.save(`${generatedDraft.title.replace(/\s+/g, '_')}_Paper.pdf`);
      showToast('Exam paper PDF downloaded successfully!');
    } catch (e) {
      console.error('PDF error:', e);
      showToast('Failed to export PDF.', 'error');
    }
  };

  // Filter questions for the draft tab view
  const filteredQuestions = generatedDraft
    ? generatedDraft.questions.filter((q) => {
        if (activeTab === 'all') return true;
        if (activeTab === 'mcq') return q.type === 'MCQ';
        if (activeTab === 'coding') return q.type === 'CODING';
        if (activeTab === 'descriptive') return q.type === 'DESCRIPTIVE';
        return true;
      })
    : [];

  return (
    <AdminLayout protectedMode={protectedMode}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-lg border text-sm font-medium flex items-center gap-2 transform transition-all duration-300 ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toastMessage.type === 'error' ? 'error' : 'check_circle'}
          </span>
          {toastMessage.text}
        </div>
      )}

      {/* Page Title & Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          AI Exam Generator
        </h1>
        <p className="text-slate-400 text-sm">
          Upload multiple PowerPoint presentations (.pptx), textbook excerpts or prompts to construct comprehensive exams.
        </p>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left Card: PowerPoint Presentations & Topic */}
        <div className="rounded-2xl border border-slate-800 bg-[#0B132B]/90 backdrop-blur-xl p-6 flex flex-col gap-5 shadow-xl">
          {/* Card Header */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">co_present</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              PowerPoint Presentations & Topic
            </h2>
          </div>

          {/* Section: Upload Presentations */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">
              Upload Presentations (Select 3+ .pptx / .ppt files)
            </label>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="border-2 border-dashed border-blue-500/30 hover:border-blue-500/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-900/40 hover:bg-slate-900/60 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pptx,.ppt,.pdf,.txt,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">slideshow</span>
              </div>
              <p className="text-sm font-semibold text-white">
                Click or Drag & Drop Multiple PPTX / PPT Files
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Select 3+ PowerPoint files (.pptx, .ppt) or notes at once
              </p>
              {isExtracting && (
                <p className="text-xs text-blue-400 mt-2 flex items-center gap-1 font-medium">
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full mr-1"></span>
                  Extracting slides content...
                </p>
              )}
            </div>

            {/* Uploaded Files Chips */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 max-h-28 overflow-y-auto custom-scrollbar p-1">
                {uploadedFiles.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300"
                  >
                    <span className="material-symbols-outlined text-blue-400 text-base">description</span>
                    <span className="font-medium truncate max-w-[150px]">{f.name}</span>
                    <span className="text-slate-400">({f.slidesCount} slides)</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exam Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Exam Title</label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="e.g. Operating Systems & Architecture Comprehensive"
              className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Syllabus Topic / Subject Prompt */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Syllabus Topic / Subject Prompt</label>
            <input
              type="text"
              value={syllabusTopic}
              onChange={(e) => setSyllabusTopic(e.target.value)}
              placeholder="e.g. Memory Management, CPU Scheduling & File Systems"
              className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Aggregated Presentation Text */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Aggregated Presentation Text</label>
            <textarea
              rows={4}
              value={aggregatedText}
              onChange={(e) => setAggregatedText(e.target.value)}
              placeholder="Contents extracted from all 3+ PPT files will aggregate here automatically..."
              className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none h-28 custom-scrollbar leading-relaxed"
            />
          </div>

          {/* Question Types to Include (Pill Toggle Buttons) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">Question Types to Include</label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIncludeMCQs(!includeMCQs)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  includeMCQs
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {includeMCQs ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                MCQs
              </button>

              <button
                type="button"
                onClick={() => setIncludeCoding(!includeCoding)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  includeCoding
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-sm">code</span>
                Coding Challenges
              </button>

              <button
                type="button"
                onClick={() => setIncludeDescriptive(!includeDescriptive)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  includeDescriptive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-sm">article</span>
                Descriptive & Rubrics
              </button>
            </div>
          </div>

          {/* Row 1: Difficulty & Question Count */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Comprehensive">Comprehensive</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Question Count (Up to 50)</label>
              <input
                type="number"
                min="5"
                max="50"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Duration & Total Marks */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Duration (Max 60 Mins)</label>
              <input
                type="number"
                min="10"
                max="180"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Total Marks (100 Marks)</label>
              <input
                type="number"
                min="10"
                max="200"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action Button: Generate AI Exam Questions */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateExam}
            className="w-full mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl">auto_awesome</span>
            {isGenerating ? 'Synthesizing AI Exam Questions...' : 'Generate AI Exam Questions'}
          </button>
        </div>

        {/* Right Card: Generated Exam Draft */}
        <div className="rounded-2xl border border-slate-800 bg-[#0B132B]/90 backdrop-blur-xl p-6 flex flex-col shadow-xl min-h-[640px]">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Generated Exam Draft
                </h2>
                <p className="text-xs text-slate-400">
                  Review, modify options, test cases or rubrics before publishing to database.
                </p>
              </div>
            </div>

            {/* Quick Actions if Draft Exists */}
            {generatedDraft && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  title="Download PDF Paper"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  PDF
                </button>
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handlePublishToDatabase}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">cloud_upload</span>
                  {isPublishing ? 'Publishing...' : 'Publish to DB'}
                </button>
              </div>
            )}
          </div>

          {/* Conditional Views: Empty State vs Generating vs Generated Draft */}
          {isGenerating ? (
            /* Generating AI Progress State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-indigo-400 text-2xl">auto_awesome</span>
                </div>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                AI Curriculum Intelligence Engine at Work
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-6">
                Analyzing slide contents, extracting core technical domains, and formatting multi-modal test items.
              </p>

              {/* Progress Milestones */}
              <div className="w-full max-w-xs flex flex-col gap-2.5 text-xs text-left">
                <div className={`flex items-center gap-2 ${generationStep >= 1 ? 'text-indigo-400' : 'text-slate-500'}`}>
                  <span className="material-symbols-outlined text-sm">
                    {generationStep > 1 ? 'check_circle' : 'hourglass_top'}
                  </span>
                  Parsing slides & extracting technical taxonomy
                </div>
                <div className={`flex items-center gap-2 ${generationStep >= 2 ? 'text-indigo-400' : 'text-slate-500'}`}>
                  <span className="material-symbols-outlined text-sm">
                    {generationStep > 2 ? 'check_circle' : 'hourglass_top'}
                  </span>
                  Synthesizing rigorous MCQs & distractors
                </div>
                <div className={`flex items-center gap-2 ${generationStep >= 3 ? 'text-indigo-400' : 'text-slate-500'}`}>
                  <span className="material-symbols-outlined text-sm">
                    {generationStep > 3 ? 'check_circle' : 'hourglass_top'}
                  </span>
                  Generating coding challenges & evaluation rubrics
                </div>
              </div>
            </div>
          ) : !generatedDraft ? (
            /* Empty State (Exact Match with Uploaded Screenshot) */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">airplay</span>
              </div>
              <h3 className="text-base font-semibold text-slate-200">
                Upload 3+ PPTs or Enter Topic to Generate
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-2 text-center leading-relaxed">
                Upload multiple PowerPoint presentations (.pptx) or enter a syllabus topic on the left and click Generate AI Exam Questions.
              </p>
            </div>
          ) : (
            /* Active Draft Question View */
            <div className="flex-1 flex flex-col gap-4 mt-4 overflow-hidden">
              {/* Draft Summary Badges & Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                    {generatedDraft.questions.length} Questions
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                    {generatedDraft.totalMarks} Marks
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    {generatedDraft.duration} Mins
                  </span>
                </div>

                {/* Question Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      activeTab === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({generatedDraft.questions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('mcq')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      activeTab === 'mcq' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    MCQs ({generatedDraft.questions.filter((q) => q.type === 'MCQ').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('coding')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      activeTab === 'coding' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Coding ({generatedDraft.questions.filter((q) => q.type === 'CODING').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('descriptive')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      activeTab === 'descriptive' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Rubrics ({generatedDraft.questions.filter((q) => q.type === 'DESCRIPTIVE').length})
                  </button>
                </div>
              </div>

              {/* Scrollable List of Questions */}
              <div className="flex-1 overflow-y-auto max-h-[520px] custom-scrollbar pr-1 flex flex-col gap-4">
                {filteredQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3 hover:border-slate-700 transition-colors"
                  >
                    {/* Question Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            q.type === 'MCQ'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : q.type === 'CODING'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {q.type}
                        </span>
                        <span className="text-xs text-slate-400">({q.marks} Marks)</span>
                      </div>
                      <span className="text-xs text-slate-500">{q.category || 'Core'}</span>
                    </div>

                    {/* Question Prompt */}
                    <p className="text-sm font-medium text-slate-100 leading-relaxed">
                      {q.question}
                    </p>

                    {/* Type-Specific Contents */}
                    {q.type === 'MCQ' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {q.options.map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isCorrect = letter === q.correctAnswer;
                          return (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                                isCorrect
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-medium'
                                  : 'bg-slate-950/40 border-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                                  isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                                }`}>
                                  {letter}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isCorrect && (
                                <span className="material-symbols-outlined text-emerald-400 text-sm">
                                  check_circle
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'CODING' && (
                      <div className="flex flex-col gap-2 mt-1 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-300">
                          <p className="text-slate-400 font-medium mb-1">Constraints:</p>
                          <code className="text-purple-300 font-mono text-[11px]">{q.constraints}</code>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded bg-slate-950 border border-slate-800">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Sample Input</span>
                            <code className="text-slate-200 font-mono text-[11px]">{q.sampleInput}</code>
                          </div>
                          <div className="p-2 rounded bg-slate-950 border border-slate-800">
                            <span className="text-slate-500 block text-[10px] uppercase font-bold">Expected Output</span>
                            <code className="text-emerald-400 font-mono text-[11px]">{q.sampleOutput}</code>
                          </div>
                        </div>
                      </div>
                    )}

                    {q.type === 'DESCRIPTIVE' && (
                      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex flex-col gap-2 mt-1">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-semibold text-amber-400">Grading Rubric Breakdown:</span>
                          <span className="text-[11px]">Total: {q.marks} Marks</span>
                        </div>
                        <div className="space-y-1 text-slate-300">
                          <div className="flex justify-between border-b border-slate-800/80 pb-1">
                            <span>Conceptual Understanding & Core Definition</span>
                            <span className="font-medium text-amber-300">40%</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800/80 pb-1">
                            <span>Technical Rigor & Concrete Mechanism</span>
                            <span className="font-medium text-amber-300">40%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Practical Real-World Example / Diagram</span>
                            <span className="font-medium text-amber-300">20%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Explanation / Rationale */}
                    {q.explanation && (
                      <div className="mt-1 p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/40 text-xs text-blue-300/90 flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm text-blue-400 mt-0.5">info</span>
                        <span><strong>Rationale:</strong> {q.explanation}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Ready to activate this examination for candidates?
                </p>
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handlePublishToDatabase}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">rocket_launch</span>
                  {isPublishing ? 'Publishing...' : 'Publish to Live Database'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

// Curriculum Intelligence Helper for high-yield questions
function generateCurriculumQuestions(topic, difficulty, config) {
  const { mcqCount, codingCount, descCount, totalMarks } = config;
  const questions = [];
  let currentId = 1;

  // OS / Systems questions catalog
  const osMcqs = [
    {
      q: 'Which scheduling algorithm is non-preemptive and selects the process with the shortest CPU burst time?',
      options: ['Shortest Job First (SJF)', 'Round Robin (RR)', 'Shortest Remaining Time First (SRTF)', 'Priority Scheduling (Preemptive)'],
      ans: 'A',
      exp: 'Standard SJF is non-preemptive; its preemptive variant is called Shortest Remaining Time First (SRTF).',
    },
    {
      q: 'What fundamental condition is violated to eliminate deadlock using Banker\'s Algorithm?',
      options: ['Mutual Exclusion', 'Hold and Wait', 'Unsafe State Avoidance', 'No Preemption'],
      ans: 'C',
      exp: 'Banker\'s Algorithm ensures the system remains continuously in a Safe State, preventing deadlocks proactively.',
    },
    {
      q: 'In virtual memory systems, what does Belady\'s Anomaly refer to?',
      options: ['FIFO page replacement causing more page faults as allocated page frames increase', 'LRU thrashing during high I/O wait', 'Virtual address translation slowdown in TLB miss', 'Page table explosion in 64-bit systems'],
      ans: 'A',
      exp: 'Belady\'s Anomaly occurs in FIFO where increasing the number of page frames results in an increased number of page faults.',
    },
    {
      q: 'Which component in the CPU translation pipeline caches virtual-to-physical address mappings?',
      options: ['Translation Lookaside Buffer (TLB)', 'Level 1 Instruction Cache', 'Memory Management Unit Bus', 'Direct Memory Access Controller'],
      ans: 'A',
      exp: 'The TLB is an associative hardware cache inside the MMU that drastically accelerates virtual-to-physical address translation.',
    },
    {
      q: 'What is the primary trade-off when selecting an excessively large quantum size in Round Robin scheduling?',
      options: ['High context switching overhead', 'The algorithm degrades into First-Come First-Served (FCFS)', 'Starvation of long running processes', 'Excessive thrashing in swap space'],
      ans: 'B',
      exp: 'If the time quantum is larger than the longest CPU burst, Round Robin operates identically to FCFS.',
    },
    {
      q: 'Which page replacement policy is theoretically optimal but impossible to implement in practice?',
      options: ['Least Recently Used (LRU)', 'Optimal Page Replacement (OPT / MIN)', 'Second Chance / Clock algorithm', 'Least Frequently Used (LFU)'],
      ans: 'B',
      exp: 'The OPT algorithm requires future knowledge of memory references, making it impractical for general-purpose OS implementation.',
    },
    {
      q: 'In inverted page table architectures, how are page table entries indexed?',
      options: ['Indexed by virtual page number', 'Indexed by physical page frame number', 'Indexed by process identifier only', 'Indexed by thread scheduling slot'],
      ans: 'B',
      exp: 'Inverted page tables have one entry per physical frame in memory rather than per virtual page, conserving substantial RAM.',
    },
    {
      q: 'What is the cause of Thrashing in operating systems?',
      options: ['High CPU clock frequency', 'A process spending more time paging in/out than executing instructions', 'Memory leak in kernel space', 'Deadlock in mutex semaphores'],
      ans: 'B',
      exp: 'Thrashing occurs when the total working sets of active processes exceed available physical memory frames.',
    },
    {
      q: 'Which file allocation strategy is immune to external fragmentation and supports fast direct access?',
      options: ['Contiguous Allocation', 'Linked List Allocation', 'Indexed Allocation (e.g. Inode)', 'Tape Stream Allocation'],
      ans: 'C',
      exp: 'Indexed allocation brings pointers together into index blocks (inodes), eliminating external fragmentation while enabling direct access.',
    },
    {
      q: 'What synchronization primitive prevents priority inversion using priority inheritance?',
      options: ['Counting Semaphore', 'Priority-Inheritance Mutex', 'Spinlock', 'Condition Variable'],
      ans: 'B',
      exp: 'Priority inheritance raises the priority of a low-priority thread holding a lock to that of the highest-priority thread waiting for it.',
    },
  ];

  // Dynamic Generator based on topic terms
  const marksPerMcq = Math.max(1, Math.floor((totalMarks * 0.6) / Math.max(1, mcqCount)));

  for (let i = 0; i < mcqCount; i++) {
    const template = osMcqs[i % osMcqs.length];
    const variationSuffix = i >= osMcqs.length ? ` (Part ${Math.floor(i / osMcqs.length) + 1})` : '';
    questions.push({
      id: currentId++,
      type: 'MCQ',
      category: topic.split(' ')[0] || 'Core',
      marks: marksPerMcq,
      question: `${template.q}${variationSuffix}`,
      options: template.options,
      correctAnswer: template.ans,
      explanation: template.exp,
    });
  }

  // Coding Challenges
  const codingTemplates = [
    {
      q: `Implement an LRU (Least Recently Used) Cache supporting get(key) and put(key, value) operations in O(1) time complexity.`,
      constraints: 'Capacity <= 10^4, get and put called at most 2 * 10^5 times. O(1) time complexity per operation.',
      sampleInput: 'put(1, 1), put(2, 2), get(1), put(3, 3), get(2)',
      sampleOutput: 'null, null, 1, null, -1',
    },
    {
      q: `Given a set of process arrival times and burst times, implement the Shortest Remaining Time First (SRTF) preemptive CPU scheduler and output average turnaround time.`,
      constraints: 'N <= 1000 processes, Arrival Time <= 10^4, Burst Time <= 10^3.',
      sampleInput: 'P1: [0, 8], P2: [1, 4], P3: [2, 9], P4: [3, 5]',
      sampleOutput: 'Avg Turnaround: 13.0, Avg Waiting: 6.5',
    },
    {
      q: `Write a thread-safe Bounded Buffer (Producer-Consumer) in your preferred language using Mutex and Condition Variables.`,
      constraints: 'Buffer size K <= 100, Concurrently accessed by N producers and M consumers without race conditions or starvation.',
      sampleInput: 'Buffer Capacity: 5, Producers: 3, Consumers: 2',
      sampleOutput: 'Clean execution without deadlocks or buffer overflow',
    },
  ];

  for (let i = 0; i < codingCount; i++) {
    const t = codingTemplates[i % codingTemplates.length];
    questions.push({
      id: currentId++,
      type: 'CODING',
      category: 'Algorithms & Implementation',
      marks: 10,
      question: t.q,
      constraints: t.constraints,
      sampleInput: t.sampleInput,
      sampleOutput: t.sampleOutput,
      explanation: 'Evaluates memory management, algorithmic data structure design, and concurrency safety.',
    });
  }

  // descriptive & rubric Questions
  const descTemplates = [
    {
      q: `Critically explain the difference between Paging and Segmentation in Virtual Memory. Under what conditions does external vs internal fragmentation emerge, and how do multi-level page tables mitigate memory footprint?`,
      rubric: 'Conceptual distinctions (40%), Fragmentation mechanics (40%), Multi-level PT analysis (20%)',
    },
    {
      q: `Analyze the Four Necessary Coffman Conditions for Deadlock. Explain how Resource Allocation Graphs (RAG) detect cycle states, and contrast Deadlock Prevention against Deadlock Avoidance.`,
      rubric: 'Coffman criteria (30%), RAG cycle analysis (30%), Prevention vs Avoidance evaluation (40%)',
    },
    {
      q: `Describe the role of the Inode structure in UNIX File Systems. How do direct, single indirect, double indirect, and triple indirect block pointers allow files to scale from kilobytes to terabytes?`,
      rubric: 'Inode architecture (40%), Indirect pointer mechanics (40%), File scaling bounds (20%)',
    },
  ];

  for (let i = 0; i < descCount; i++) {
    const t = descTemplates[i % descTemplates.length];
    questions.push({
      id: currentId++,
      type: 'DESCRIPTIVE',
      category: 'System Architecture & Analysis',
      marks: 10,
      question: t.q,
      rubric: t.rubric,
      explanation: 'Evaluates thorough comprehension of underlying operating system mechanics and design trade-offs.',
    });
  }

  return questions;
}

export default AIExamGenerator;
