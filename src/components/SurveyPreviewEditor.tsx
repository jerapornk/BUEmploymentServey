import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  Edit3, 
  Save, 
  RotateCcw, 
  Smartphone, 
  Laptop, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  HelpCircle, 
  Settings, 
  Columns, 
  ListOrdered, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Phone, 
  Mail, 
  Building2,
  Calendar,
  Layers,
  ArrowUp,
  ArrowDown,
  Info,
  Check
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SurveyConfig, EntrepreneurQuestion, CustomQuestion } from '../types';
import { DEFAULT_SURVEY_CONFIG, DEFAULT_ENTREPRENEUR_QUESTIONS, ACADEMIC_YEARS } from '../data';
import StudentSurvey from './StudentSurvey';

interface SurveyPreviewEditorProps {
  customQuestions: CustomQuestion[];
  onQuestionsUpdated: () => void;
  surveyConfig: SurveyConfig;
  onSurveyConfigUpdated: (newConfig: SurveyConfig) => void;
}

export default function SurveyPreviewEditor({
  customQuestions,
  onQuestionsUpdated,
  surveyConfig,
  onSurveyConfigUpdated,
}: SurveyPreviewEditorProps) {
  // Main View Mode: 'preview' | 'editor' | 'split'
  const [viewLayout, setViewLayout] = useState<'preview' | 'editor' | 'split'>('split');
  // Device Preview Mode: 'mobile' | 'desktop'
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile');
  // Preview Language: 'th' | 'en'
  const [previewLanguage, setPreviewLanguage] = useState<'th' | 'en'>('th');

  // Active step being inspected in the preview (1-5)
  const [previewStep, setPreviewStep] = useState<number>(1);
  const [autoFillTrigger, setAutoFillTrigger] = useState<number>(0);
  const [resetPreviewTrigger, setResetPreviewTrigger] = useState<number>(0);

  // Editor Sub-tabs: 'general' | 'skills' | 'custom_questions' | 'preview_settings'
  const [editorSubTab, setEditorSubTab] = useState<'general' | 'skills' | 'custom_questions' | 'preview_settings'>('skills');

  // Local draft of survey config for editing
  const [configDraft, setConfigDraft] = useState<SurveyConfig>(surveyConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Editing modal or item index for entrepreneur questions
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [newQuestionTh, setNewQuestionTh] = useState('');
  const [newQuestionEn, setNewQuestionEn] = useState('');
  const [isAddingSkillQuestion, setIsAddingSkillQuestion] = useState(false);

  // New Custom Question Modal state
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newCustomTitle, setNewCustomTitle] = useState('');
  const [newCustomType, setNewCustomType] = useState<'text' | 'choice'>('text');
  const [newCustomOptions, setNewCustomOptions] = useState('');
  const [newCustomSection, setNewCustomSection] = useState<'general' | 'employed' | 'unemployed' | 'not_seeking'>('general');
  const [newCustomRequired, setNewCustomRequired] = useState(false);

  // Sync draft when prop changes
  useEffect(() => {
    setConfigDraft(surveyConfig);
  }, [surveyConfig]);

  // Handle Save Config to Firestore & Local Storage
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const configWithMeta = {
        ...configDraft,
        updatedAt: serverTimestamp()
      };

      // Save to Firestore
      await setDoc(doc(db, 'survey_settings', 'current_config'), configWithMeta, { merge: true });
      
      // Cache in localStorage
      localStorage.setItem('bu_survey_config', JSON.stringify(configDraft));
      
      onSurveyConfigUpdated(configDraft);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Failed to save survey config to Firestore:', err);
      // Still cache locally so user doesn't lose edits
      localStorage.setItem('bu_survey_config', JSON.stringify(configDraft));
      onSurveyConfigUpdated(configDraft);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default university configuration
  const handleResetToDefault = () => {
    if (window.confirm('ท่านต้องการคืนค่ามาตรฐานของแบบสอบถาม (หัวข้อ, คำชี้แจง และข้อคำถามทักษะ 10 ข้อมาตรฐาน) ใช่หรือไม่?')) {
      setConfigDraft(DEFAULT_SURVEY_CONFIG);
      onSurveyConfigUpdated(DEFAULT_SURVEY_CONFIG);
      localStorage.removeItem('bu_survey_config');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  // Add new skill question
  const handleAddSkillQuestion = () => {
    if (!newQuestionTh.trim()) return;
    const nextId = configDraft.entrepreneurQuestions.length > 0 
      ? Math.max(...configDraft.entrepreneurQuestions.map(q => q.id)) + 1 
      : 1;

    const newQ: EntrepreneurQuestion = {
      id: nextId,
      th: newQuestionTh.trim(),
      en: newQuestionEn.trim() || newQuestionTh.trim()
    };

    const updated = {
      ...configDraft,
      entrepreneurQuestions: [...configDraft.entrepreneurQuestions, newQ]
    };

    setConfigDraft(updated);
    onSurveyConfigUpdated(updated);
    setNewQuestionTh('');
    setNewQuestionEn('');
    setIsAddingSkillQuestion(false);
  };

  // Remove skill question
  const handleDeleteSkillQuestion = (id: number) => {
    if (configDraft.entrepreneurQuestions.length <= 1) {
      alert('แบบสอบถามจำเป็นต้องมีข้อคำถามอย่างน้อย 1 ข้อ');
      return;
    }
    const updated = {
      ...configDraft,
      entrepreneurQuestions: configDraft.entrepreneurQuestions.filter(q => q.id !== id)
    };
    setConfigDraft(updated);
    onSurveyConfigUpdated(updated);
  };

  // Move skill question up/down
  const handleMoveSkillQuestion = (index: number, direction: 'up' | 'down') => {
    const list = [...configDraft.entrepreneurQuestions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const updated = {
      ...configDraft,
      entrepreneurQuestions: list
    };
    setConfigDraft(updated);
    onSurveyConfigUpdated(updated);
  };

  // Add custom extra question
  const handleCreateCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomTitle.trim()) return;

    try {
      const options = newCustomType === 'choice'
        ? newCustomOptions.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const id = 'q_' + Date.now();
      const newQuestion: CustomQuestion = {
        id,
        title: newCustomTitle.trim(),
        type: newCustomType,
        options,
        section: newCustomSection,
        required: newCustomRequired
      };

      await addDoc(collection(db, 'questions'), newQuestion);

      setNewCustomTitle('');
      setNewCustomOptions('');
      setNewCustomType('text');
      setNewCustomRequired(false);
      setShowAddCustomModal(false);
      onQuestionsUpdated();
    } catch (err: any) {
      alert(`ไม่สามารถเพิ่มคำถามได้: ${err.message}`);
    }
  };

  // Delete custom question
  const handleDeleteCustomQuestion = async (id: string) => {
    if (window.confirm('ยืนยันการลบข้อคำถามเพิ่มเติมนี้ใช่หรือไม่?')) {
      try {
        await deleteDoc(doc(db, 'questions', id));
        onQuestionsUpdated();
      } catch (err: any) {
        alert(`ลบไม่สำเร็จ: ${err.message}`);
      }
    }
  };

  // Step names
  const STEP_NAMES = [
    { num: 1, label: 'ตรวจรหัสนักศึกษา', sub: 'Student Verification' },
    { num: 2, label: 'ข้อมูลบัณฑิต & ประวัติ', sub: 'Graduate Profile' },
    { num: 3, label: 'สถานะการทำงาน', sub: 'Employment Status' },
    { num: 4, label: 'รายละเอียดงาน & ทักษะ', sub: 'Job Details & Skills' },
    { num: 5, label: 'ตรวจทาน & ส่งข้อมูล', sub: 'Review & Submit' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Center */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-[#4C2D81] to-[#F15A22] text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3 h-3" />
                <span>Live Questionnaire Studio</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                พร้อมแก้ไขได้แบบเรียลไทม์
              </span>
            </div>
            <h2 className="font-sans font-black text-lg text-neutral-800 mt-2">
              หน้าตัวอย่างแบบสอบถามและการปรับแต่ง (Survey Preview & Editor)
            </h2>
            <p className="text-xs text-neutral-500 font-sans mt-0.5 leading-relaxed">
              จำลองประสบการณ์ที่บัณฑิตเห็นจริงทั้งบนสมาร์ทโฟนและหน้าจอคอมพิวเตอร์ พร้อมระบบแก้ไขข้อความ คำถามทักษะ และคำถามเพิ่มเติม
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Save Button */}
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-sans font-bold text-xs shadow-md transition-all ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#4C2D81] hover:bg-[#3d2467] text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกสำเร็จแล้ว!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกการเปลี่ยนแปลง</span>
                </>
              )}
            </button>

            {/* Reset to Default */}
            <button
              onClick={handleResetToDefault}
              className="flex items-center space-x-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-sans font-semibold text-xs transition-colors"
              title="คืนค่ามาตรฐานของมหาวิทยาลัย"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              <span>คืนค่าเริ่มต้น</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Layout Selector, Device Mode, Language & Simulation Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs font-sans">
          {/* Layout Mode (Preview only / Editor only / Split side-by-side) */}
          <div className="flex items-center space-x-1 bg-neutral-100 p-1 rounded-2xl">
            <button
              onClick={() => setViewLayout('split')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewLayout === 'split' 
                  ? 'bg-white text-[#4C2D81] shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>แสดงคู่กัน (Split View)</span>
            </button>
            <button
              onClick={() => setViewLayout('preview')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewLayout === 'preview' 
                  ? 'bg-white text-[#4C2D81] shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ตัวอย่างเต็มจอ (Preview Only)</span>
            </button>
            <button
              onClick={() => setViewLayout('editor')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewLayout === 'editor' 
                  ? 'bg-white text-[#4C2D81] shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>แก้ไขเต็มจอ (Editor Only)</span>
            </button>
          </div>

          {/* Quick Simulation Bar */}
          <div className="flex items-center space-x-2">
            {/* Device Switcher */}
            <div className="flex items-center space-x-1 bg-neutral-100 p-1 rounded-2xl">
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  deviceMode === 'mobile'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="จำลองมุมมองมือถือสมาร์ทโฟน"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>มือถือ</span>
              </button>
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  deviceMode === 'desktop'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="จำลองมุมมองคอมพิวเตอร์"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>คอมพิวเตอร์</span>
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center space-x-1 bg-neutral-100 p-1 rounded-2xl">
              <button
                onClick={() => setPreviewLanguage('th')}
                className={`px-2.5 py-1 rounded-xl font-black text-[11px] transition-all ${
                  previewLanguage === 'th'
                    ? 'bg-white text-[#4C2D81] shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-800'
                }`}
              >
                🇹🇭 TH
              </button>
              <button
                onClick={() => setPreviewLanguage('en')}
                className={`px-2.5 py-1 rounded-xl font-black text-[11px] transition-all ${
                  previewLanguage === 'en'
                    ? 'bg-white text-[#4C2D81] shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-800'
                }`}
              >
                🇬🇧 EN
              </button>
            </div>

            {/* Fill Sample Data for instant testing */}
            <button
              onClick={() => setAutoFillTrigger(prev => prev + 1)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold shadow-sm hover:opacity-90 transition-opacity"
              title="เติมข้อมูลจำลองอัตโนมัติเพื่อทดสอบทันที"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>เติมข้อมูลทดสอบ</span>
            </button>

            {/* Reset Walkthrough */}
            <button
              onClick={() => {
                setPreviewStep(1);
                setResetPreviewTrigger(prev => prev + 1);
              }}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-2xl font-semibold transition-colors"
              title="เริ่มทดสอบใหม่จากขั้นตอนที่ 1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>เริ่มใหม่</span>
            </button>
          </div>
        </div>

        {/* Step Jumper Navigator */}
        <div className="mt-4 pt-3 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-neutral-500 uppercase tracking-wider flex items-center space-x-1">
              <ListOrdered className="w-3.5 h-3.5 text-indigo-500" />
              <span>ทางลัดข้ามขั้นตอนแบบสอบถาม (Step Navigation Jumper)</span>
            </span>
            <span className="text-[10px] text-neutral-400">
              คลิกเพื่อดูหน้าตานั้น ๆ ได้ทันทีโดยไม่ต้องกรอกข้อมูลทีละหน้า
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {STEP_NAMES.map((step) => {
              const isActive = previewStep === step.num;
              return (
                <button
                  key={step.num}
                  onClick={() => setPreviewStep(step.num)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                    isActive 
                      ? 'border-[#4C2D81] bg-[#4C2D81]/5 ring-2 ring-[#4C2D81]/20' 
                      : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/70 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-black ${
                      isActive ? 'bg-[#4C2D81] text-white' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {step.num}
                    </span>
                    <span className={`font-sans font-bold text-xs truncate ${isActive ? 'text-[#4C2D81]' : 'text-neutral-700'}`}>
                      {step.label}
                    </span>
                  </div>
                  <span className="text-[9px] text-neutral-400 font-mono mt-1 pl-6 truncate">
                    {step.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Split View or Full Screen Mode */}
      <div className={`grid gap-6 ${
        viewLayout === 'split' 
          ? 'grid-cols-1 lg:grid-cols-12' 
          : 'grid-cols-1'
      }`}>
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: THE SURVEY EDITOR (แผงแก้ไขแบบสอบถาม) */}
        {/* ========================================================= */}
        {(viewLayout === 'editor' || viewLayout === 'split') && (
          <div className={`space-y-4 ${viewLayout === 'split' ? 'lg:col-span-5' : 'w-full'}`}>
            <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-sm space-y-5">
              
              {/* Editor Tabs Navigation */}
              <div className="flex items-center space-x-1 bg-neutral-100 p-1 rounded-2xl overflow-x-auto text-xs font-sans font-bold">
                <button
                  onClick={() => setEditorSubTab('skills')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                    editorSubTab === 'skills'
                      ? 'bg-white text-[#4C2D81] shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>ทักษะผู้ประกอบการ ({configDraft.entrepreneurQuestions.length})</span>
                </button>
                <button
                  onClick={() => setEditorSubTab('general')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                    editorSubTab === 'general'
                      ? 'bg-white text-[#4C2D81] shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>หัวข้อ & คำชี้แจง</span>
                </button>
                <button
                  onClick={() => setEditorSubTab('custom_questions')}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                    editorSubTab === 'custom_questions'
                      ? 'bg-white text-[#4C2D81] shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>คำถามเพิ่มเติม ({customQuestions.length})</span>
                </button>
              </div>

              {/* ---------------------------------------------------- */}
              {/* SUBTAB 1: ENTREPRENEUR SKILLS QUESTIONS (10 ข้อ)     */}
              {/* ---------------------------------------------------- */}
              {editorSubTab === 'skills' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <div>
                      <h3 className="font-sans font-extrabold text-sm text-neutral-800">
                        ข้อคำถามการประเมินทักษะผู้ประกอบการ
                      </h3>
                      <p className="text-[11px] text-neutral-400 font-sans">
                        แบบประเมินตนเอง (สเกล 1-10) ในขั้นตอนที่ 4 ของผู้มีงานทำ
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddingSkillQuestion(true)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-[#4C2D81] hover:bg-[#3d2467] text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มข้อคำถาม</span>
                    </button>
                  </div>

                  {/* Form to Add New Question */}
                  <AnimatePresence>
                    {isAddingSkillQuestion && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3"
                      >
                        <h4 className="font-sans font-black text-xs text-[#4C2D81]">
                          เพิ่มข้อคำถามใหม่ในแบบประเมินทักษะ
                        </h4>
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                            ข้อความภาษาไทย (TH) *
                          </label>
                          <textarea
                            value={newQuestionTh}
                            onChange={(e) => setNewQuestionTh(e.target.value)}
                            placeholder="เช่น มีความสามารถในการประยุกต์ใช้ AI ในการทำงาน..."
                            className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#4C2D81]"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                            ข้อความภาษาอังกฤษ (EN)
                          </label>
                          <textarea
                            value={newQuestionEn}
                            onChange={(e) => setNewQuestionEn(e.target.value)}
                            placeholder="e.g. Able to effectively apply AI tools in workplace operations..."
                            className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#4C2D81]"
                            rows={2}
                          />
                        </div>
                        <div className="flex justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingSkillQuestion(false)}
                            className="px-3 py-1.5 bg-white text-neutral-600 rounded-xl text-xs font-semibold hover:bg-neutral-100 border border-neutral-200"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            onClick={handleAddSkillQuestion}
                            className="px-4 py-1.5 bg-[#4C2D81] text-white rounded-xl text-xs font-bold hover:bg-[#3d2467]"
                          >
                            บันทึกเพิ่มข้อนี้
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Question Cards List */}
                  <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                    {configDraft.entrepreneurQuestions.map((q, idx) => {
                      const isEditing = editingQuestionId === q.id;
                      return (
                        <div
                          key={q.id}
                          className="p-3.5 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 hover:bg-white hover:border-indigo-200 transition-all shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-900 font-mono text-xs font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-[10px] font-bold text-neutral-400 font-mono">
                                ID: #{q.id}
                              </span>
                            </div>

                            {/* Item Actions */}
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleMoveSkillQuestion(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-20"
                                title="เลื่อนขึ้น"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveSkillQuestion(idx, 'down')}
                                disabled={idx === configDraft.entrepreneurQuestions.length - 1}
                                className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-20"
                                title="เลื่อนลง"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingQuestionId(isEditing ? null : q.id)}
                                className={`p-1 rounded text-xs transition-colors ${
                                  isEditing ? 'text-indigo-600 bg-indigo-50' : 'text-neutral-500 hover:text-indigo-600'
                                }`}
                                title="แก้ไขข้อความ"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSkillQuestion(q.id)}
                                className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                                title="ลบข้อนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Editable Text vs Display Text */}
                          {isEditing ? (
                            <div className="space-y-2 mt-2 pt-2 border-t border-neutral-100">
                              <div>
                                <label className="block text-[10px] font-bold text-neutral-500 mb-0.5">
                                  ภาษาไทย (TH)
                                </label>
                                <textarea
                                  value={q.th}
                                  onChange={(e) => {
                                    const updatedList = configDraft.entrepreneurQuestions.map(item =>
                                      item.id === q.id ? { ...item, th: e.target.value } : item
                                    );
                                    setConfigDraft({ ...configDraft, entrepreneurQuestions: updatedList });
                                    onSurveyConfigUpdated({ ...configDraft, entrepreneurQuestions: updatedList });
                                  }}
                                  rows={2}
                                  className="w-full text-xs p-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-neutral-500 mb-0.5">
                                  English (EN)
                                </label>
                                <textarea
                                  value={q.en}
                                  onChange={(e) => {
                                    const updatedList = configDraft.entrepreneurQuestions.map(item =>
                                      item.id === q.id ? { ...item, en: e.target.value } : item
                                    );
                                    setConfigDraft({ ...configDraft, entrepreneurQuestions: updatedList });
                                    onSurveyConfigUpdated({ ...configDraft, entrepreneurQuestions: updatedList });
                                  }}
                                  rows={2}
                                  className="w-full text-xs p-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => setEditingQuestionId(null)}
                                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold"
                                >
                                  เสร็จสิ้น
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="font-sans font-bold text-xs text-neutral-800 leading-snug">
                                {q.th}
                              </p>
                              <p className="font-sans text-[11px] text-neutral-500 leading-snug">
                                {q.en}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* SUBTAB 2: GENERAL HEADERS, INSTRUCTIONS & NOTICES    */}
              {/* ---------------------------------------------------- */}
              {editorSubTab === 'general' && (
                <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1 text-xs">
                  <div>
                    <label className="block font-sans font-bold text-neutral-700 mb-1">
                      ชื่อแบบสอบถาม (ภาษาไทย)
                    </label>
                    <input
                      type="text"
                      value={configDraft.titleTh}
                      onChange={(e) => {
                        const updated = { ...configDraft, titleTh: e.target.value };
                        setConfigDraft(updated);
                        onSurveyConfigUpdated(updated);
                      }}
                      className="w-full p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-[#4C2D81]"
                    />
                  </div>

                  <div>
                    <label className="block font-sans font-bold text-neutral-700 mb-1">
                      Survey Title (English)
                    </label>
                    <input
                      type="text"
                      value={configDraft.titleEn}
                      onChange={(e) => {
                        const updated = { ...configDraft, titleEn: e.target.value };
                        setConfigDraft(updated);
                        onSurveyConfigUpdated(updated);
                      }}
                      className="w-full p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-[#4C2D81]"
                    />
                  </div>

                  <div>
                    <label className="block font-sans font-bold text-neutral-700 mb-1">
                      คำชี้แจงและวัตถุประสงค์ (ภาษาไทย)
                    </label>
                    <textarea
                      value={configDraft.descriptionTh}
                      onChange={(e) => {
                        const updated = { ...configDraft, descriptionTh: e.target.value };
                        setConfigDraft(updated);
                        onSurveyConfigUpdated(updated);
                      }}
                      rows={3}
                      className="w-full p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-[#4C2D81]"
                    />
                  </div>

                  <div>
                    <label className="block font-sans font-bold text-neutral-700 mb-1">
                      Description / Objectives (English)
                    </label>
                    <textarea
                      value={configDraft.descriptionEn}
                      onChange={(e) => {
                        const updated = { ...configDraft, descriptionEn: e.target.value };
                        setConfigDraft(updated);
                        onSurveyConfigUpdated(updated);
                      }}
                      rows={3}
                      className="w-full p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-[#4C2D81]"
                    />
                  </div>

                  <div>
                    <label className="block font-sans font-bold text-neutral-700 mb-1">
                      ข้อความนโยบายความเป็นส่วนตัวและคำแนะนำ (Notice Banner)
                    </label>
                    <textarea
                      value={configDraft.bannerNoticeTh}
                      onChange={(e) => {
                        const updated = { ...configDraft, bannerNoticeTh: e.target.value };
                        setConfigDraft(updated);
                        onSurveyConfigUpdated(updated);
                      }}
                      rows={2}
                      className="w-full p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-[#4C2D81]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-sans font-bold text-neutral-700 mb-1">
                        หน่วยงานผู้จัดทำ
                      </label>
                      <input
                        type="text"
                        value={configDraft.contactOffice}
                        onChange={(e) => {
                          const updated = { ...configDraft, contactOffice: e.target.value };
                          setConfigDraft(updated);
                          onSurveyConfigUpdated(updated);
                        }}
                        className="w-full p-2.5 bg-neutral-50 rounded-xl border border-neutral-200"
                      />
                    </div>
                    <div>
                      <label className="block font-sans font-bold text-neutral-700 mb-1">
                        เบอร์ติดต่อ
                      </label>
                      <input
                        type="text"
                        value={configDraft.contactPhone}
                        onChange={(e) => {
                          const updated = { ...configDraft, contactPhone: e.target.value };
                          setConfigDraft(updated);
                          onSurveyConfigUpdated(updated);
                        }}
                        className="w-full p-2.5 bg-neutral-50 rounded-xl border border-neutral-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* SUBTAB 3: CUSTOM QUESTIONS (คำถามเพิ่มเติม)          */}
              {/* ---------------------------------------------------- */}
              {editorSubTab === 'custom_questions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <div>
                      <h3 className="font-sans font-extrabold text-sm text-neutral-800">
                        ข้อคำถามพิเศษเพิ่มเติม
                      </h3>
                      <p className="text-[11px] text-neutral-400 font-sans">
                        คำถามที่ต้องการถามเพิ่มเติมจากมาตรฐาน
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddCustomModal(true)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-[#4C2D81] hover:bg-[#3d2467] text-white rounded-xl text-xs font-semibold shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>สร้างคำถามเพิ่ม</span>
                    </button>
                  </div>

                  {customQuestions.length === 0 ? (
                    <div className="py-12 text-center text-neutral-400 font-sans text-xs bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                      ยังไม่มีคำถามพิเศษเพิ่มเติมในระบบ
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                      {customQuestions.map((q) => (
                        <div key={q.id} className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold">
                                {q.section === 'general' ? 'ข้อมูลทั่วไป' : q.section === 'employed' ? 'กลุ่มมีงานทำ' : 'กลุ่มไม่มีงานทำ'}
                              </span>
                              {q.required && (
                                <span className="text-[10px] font-bold text-red-500">* บังคับตอบ</span>
                              )}
                            </div>
                            <h4 className="font-sans font-bold text-xs text-neutral-800 leading-snug">{q.title}</h4>
                            <span className="font-mono text-[9px] text-neutral-400">
                              ประเภท: {q.type === 'choice' ? 'ตัวเลือก (Choice)' : 'ข้อความ (Text)'}
                            </span>
                            {q.options && q.options.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {q.options.map((opt, oIdx) => (
                                  <span key={oIdx} className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-[9px] text-neutral-600">
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="mt-3 pt-2 border-t border-neutral-200/50 flex justify-end">
                            <button
                              onClick={() => handleDeleteCustomQuestion(q.id)}
                              className="flex items-center space-x-1 text-red-500 hover:text-red-700 text-xs font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบคำถาม</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW (หน้าตัวอย่างแบบสอบถาม) */}
        {/* ========================================================= */}
        {(viewLayout === 'preview' || viewLayout === 'split') && (
          <div className={`${viewLayout === 'split' ? 'lg:col-span-7' : 'w-full'}`}>
            <div className="bg-neutral-900/5 p-4 rounded-3xl border border-neutral-200/80 shadow-inner">
              
              {/* Preview Status Ribbon */}
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center space-x-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                  </span>
                  <span className="font-sans font-black text-xs text-neutral-700">
                    หน้าต่างตัวอย่างสด (Live Interactive Simulator)
                  </span>
                  <span className="px-2 py-0.5 bg-neutral-200/70 text-neutral-600 rounded-full font-mono text-[9px] font-bold">
                    ขั้นตอนที่ {previewStep} / 5
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 font-sans hidden sm:inline">
                  {deviceMode === 'mobile' ? 'โหมดสมาร์ทโฟน (Touch Simulated)' : 'โหมดจอคอมพิวเตอร์ (Full View)'}
                </span>
              </div>

              {/* RENDER DEVICE FRAME */}
              {deviceMode === 'mobile' ? (
                /* Mobile Device Shell */
                <div className="relative mx-auto border-[10px] border-neutral-900 rounded-[2.8rem] shadow-2xl bg-[#F8FAFC] w-full max-w-[390px] h-[780px] flex flex-col overflow-hidden ring-4 ring-neutral-800">
                  {/* Dynamic Island */}
                  <div className="absolute top-0 inset-x-0 h-7 flex items-center justify-center z-50 pointer-events-none">
                    <div className="w-24 h-4 bg-neutral-950 rounded-full mt-1.5 flex items-center justify-between px-3 shadow-inner">
                      <span className="w-1 h-1 rounded-full bg-blue-500/80"></span>
                      <span className="w-8 h-1 bg-neutral-900 rounded-full"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-900/60"></span>
                    </div>
                  </div>

                  {/* Simulated Mobile Status bar */}
                  <div className="h-8 bg-white border-b border-neutral-100 flex justify-between items-center px-6 pt-2 select-none text-[10px] font-sans font-black text-neutral-800 z-40 shrink-0">
                    <span>09:41</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[9px] font-black tracking-tighter">5G</span>
                      <span>📶</span>
                      <span>🔋 100%</span>
                    </div>
                  </div>

                  {/* Scrollable Survey Area */}
                  <div className="flex-1 overflow-y-auto bg-[#F8FAFC] pb-10 p-2">
                    <StudentSurvey
                      customQuestions={customQuestions}
                      onSurveySubmitted={() => {
                        alert('จำลองการส่งข้อมูลแบบสอบถามสำเร็จในโหมดตัวอย่าง (ไม่มีการบันทึกลงฐานข้อมูลจริง)');
                      }}
                      isMobileSim={true}
                      language={previewLanguage}
                      surveyConfig={configDraft}
                      isPreview={true}
                      forcedStep={previewStep}
                      onStepChange={setPreviewStep}
                      autoFillTrigger={autoFillTrigger}
                      resetTrigger={resetPreviewTrigger}
                    />
                  </div>

                  {/* Bottom indicator */}
                  <div className="absolute bottom-1 inset-x-0 h-3 flex items-center justify-center pointer-events-none z-50">
                    <div className="w-28 h-1 bg-neutral-900 rounded-full opacity-80"></div>
                  </div>
                </div>
              ) : (
                /* Desktop Browser Shell */
                <div className="border border-neutral-300 rounded-2xl shadow-lg bg-white overflow-hidden">
                  {/* Browser Bar */}
                  <div className="bg-neutral-100 px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    </div>
                    <div className="bg-white px-4 py-1 rounded-lg border border-neutral-200 text-[11px] font-mono text-neutral-500 w-2/3 max-w-md text-center truncate">
                      https://survey.bu.ac.th/graduate-employment/2568
                    </div>
                    <div className="w-10"></div>
                  </div>

                  {/* Desktop Content */}
                  <div className="p-4 sm:p-6 bg-[#F8FAFC] max-h-[800px] overflow-y-auto">
                    <StudentSurvey
                      customQuestions={customQuestions}
                      onSurveySubmitted={() => {
                        alert('จำลองการส่งข้อมูลแบบสอบถามสำเร็จในโหมดตัวอย่าง (ไม่มีการบันทึกลงฐานข้อมูลจริง)');
                      }}
                      isMobileSim={false}
                      language={previewLanguage}
                      surveyConfig={configDraft}
                      isPreview={true}
                      forcedStep={previewStep}
                      onStepChange={setPreviewStep}
                      autoFillTrigger={autoFillTrigger}
                      resetTrigger={resetPreviewTrigger}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Modal for adding custom question */}
      <AnimatePresence>
        {showAddCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-neutral-100 space-y-4"
            >
              <h3 className="font-sans font-black text-sm text-[#4C2D81]">
                สร้างข้อคำถามเพิ่มเติมใหม่
              </h3>
              
              <form onSubmit={handleCreateCustomQuestion} className="space-y-3 text-xs font-sans">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    ข้อคำถาม / คำชี้แจง *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomTitle}
                    onChange={(e) => setNewCustomTitle(e.target.value)}
                    placeholder="เช่น ระบุชื่อหน่วยงานที่ท่านฝึกงาน หรือข้อเสนอแนะเพิ่มเติม..."
                    className="w-full p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 focus:bg-white focus:ring-2 focus:ring-[#4C2D81]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      ประเภทข้อมูล
                    </label>
                    <select
                      value={newCustomType}
                      onChange={(e) => setNewCustomType(e.target.value as any)}
                      className="w-full p-2.5 bg-neutral-50 rounded-xl border border-neutral-200"
                    >
                      <option value="text">พิมพ์ข้อความเสรี (Text)</option>
                      <option value="choice">ตัวเลือกเดี่ยว (Choice)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      แสดงในส่วน
                    </label>
                    <select
                      value={newCustomSection}
                      onChange={(e) => setNewCustomSection(e.target.value as any)}
                      className="w-full p-2.5 bg-neutral-50 rounded-xl border border-neutral-200"
                    >
                      <option value="general">ข้อมูลทั่วไป</option>
                      <option value="employed">กลุ่มมีงานทำ</option>
                      <option value="unemployed">กลุ่มยังไม่มีงานทำ</option>
                    </select>
                  </div>
                </div>

                {newCustomType === 'choice' && (
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">
                      ตัวเลือก (คั่นด้วยเครื่องหมายจุลภาค ,)
                    </label>
                    <input
                      type="text"
                      value={newCustomOptions}
                      onChange={(e) => setNewCustomOptions(e.target.value)}
                      placeholder="เช่น มี, ไม่มี, อยู่ระหว่างตัดสินใจ"
                      className="w-full p-2.5 bg-neutral-50 rounded-xl border border-neutral-200"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="customRequiredCheckbox"
                    checked={newCustomRequired}
                    onChange={(e) => setNewCustomRequired(e.target.checked)}
                    className="rounded text-[#4C2D81] focus:ring-[#4C2D81]"
                  />
                  <label htmlFor="customRequiredCheckbox" className="font-bold text-neutral-700 select-none">
                    บังคับตอบ (Required *)
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomModal(false)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#4C2D81] hover:bg-[#3d2467] text-white rounded-xl font-bold"
                  >
                    เพิ่มคำถาม
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
