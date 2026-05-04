'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Code,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  LayoutDashboard,
  FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Issue {
  code: string;
  severity: 'auto-fixed' | 'needs-review';
  message: string;
}

interface VetResult {
  fixedHtml: string;
  issues: Issue[];
  ghlFields: string[];
  styledFields: string[];
  salesPageUrl?: string;
}

export default function Home() {
  const [helloBar, setHelloBar] = useState('');
  const [salesPageUrlInput, setSalesPageUrlInput] = useState('https://bonniefahy.com/twin');
  const [html, setHtml] = useState('');
  const [result, setResult] = useState<VetResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copied, setCopied] = useState<'html' | 'url' | null>(null);
  const [isDraggingHtml, setIsDraggingHtml] = useState(false);
  const [isDraggingHelloBar, setIsDraggingHelloBar] = useState(false);

  const handleFileAction = (file: File, setter: (val: string) => void) => {
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm') && !file.name.endsWith('.txt')) {
      alert('Please upload an HTML or text file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setter(content);
    };
    reader.readAsText(file);
  };

  const handleDropHtml = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingHtml(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileAction(file, setHtml);
  };

  const handleDropHelloBar = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingHelloBar(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileAction(file, setHelloBar);
  };

  const handleFileSelectHtml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileAction(file, setHtml);
  };

  const handleFileSelectHelloBar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileAction(file, setHelloBar);
  };

  const runVetter = async () => {
    if (!html.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/vet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          helloBarMessage: helloBar,
          customSalesPageUrl: salesPageUrlInput
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert('Error running vetter: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      runVetter();
    }
  };

  const copyToClipboard = (text: string, type: 'html' | 'url') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const needsReviewIssues = result?.issues.filter(i => i.severity === 'needs-review') || [];
  const autoFixedIssues = result?.issues.filter(i => i.severity === 'auto-fixed') || [];

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 font-sans selection:bg-[#5b8def]/30">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-transform bg-[#161922] border-r border-[#1c2030] ${sidebarOpen ? 'w-[240px]' : 'w-0 -translate-x-full'} md:translate-x-0 md:w-[240px]`}>
        <div className="flex flex-col h-full overflow-y-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-[#5b8def] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(91,141,239,0.2)]">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-white tracking-tight leading-none mb-1">GHL Helper</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Powering Funnels</p>
            </div>
          </div>

          <nav className="space-y-1">
            <NavItem icon={<FileCode size={18} />} label="Configure HTML" active />
          </nav>

          <div className="mt-auto pt-6 border-t border-[#1c2030] px-2">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-2">Instructions</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Paste your HTML and optional hello bar text. Press Cmd+Enter to fix instantly.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'md:ml-[240px]' : 'ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0f1115]/80 backdrop-blur-md border-b border-[#1c2030] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-[#1c2030] rounded-lg text-gray-400 transition-colors md:hidden"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-semibold text-white tracking-tight"></h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-mono hidden sm:inline-block">v2.1.0</span>
            <div className="w-2 h-2 bg-[#2ec27e] rounded-full animate-pulse"></div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto p-6 space-y-8">
          {/* Input Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                      Hello Bar Message <span className="text-[10px] italic opacity-50 normal-case">(Optional)</span>
                    </label>
                    <label className="text-[10px] text-[#5b8def] font-bold uppercase tracking-wider cursor-pointer hover:underline flex items-center gap-1">
                      <FileCode size={12} />
                      Upload
                      <input type="file" className="hidden" accept=".html,.htm,.txt" onChange={handleFileSelectHelloBar} />
                    </label>
                  </div>
                  <div
                    className="relative group"
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingHelloBar(true); }}
                    onDragLeave={() => setIsDraggingHelloBar(false)}
                    onDrop={handleDropHelloBar}
                  >
                    <textarea
                      value={helloBar}
                      onChange={(e) => setHelloBar(e.target.value)}
                      placeholder="You just unlocked your AI twin. Start building today. $97 Get started →"
                      className={`w-full bg-[#161922] border rounded-xl p-4 focus:outline-none focus:ring-1 transition-all font-mono text-sm placeholder:text-gray-700 min-h-[120px] resize-y ${
                        isDraggingHelloBar
                          ? 'border-[#5b8def] ring-1 ring-[#5b8def] bg-[#5b8def]/5'
                          : 'border-[#1c2030] focus:border-[#5b8def]/50 focus:ring-[#5b8def]/50'
                      }`}
                    />
                    {isDraggingHelloBar && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-[#5b8def]/10 border-2 border-dashed border-[#5b8def] rounded-xl backdrop-blur-[2px] z-10">
                        <FileCode size={24} className="text-[#5b8def] mb-1" />
                        <p className="text-[#5b8def] font-bold uppercase tracking-widest text-[10px]">Drop Message File</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                    Sales Page URL <span className="text-[10px] italic opacity-50 normal-case">(Base URL)</span>
                  </label>
                  <textarea
                    value={salesPageUrlInput}
                    onChange={(e) => setSalesPageUrlInput(e.target.value)}
                    placeholder="https://bonniefahy.com/twin"
                    className="w-full bg-[#161922] border border-[#1c2030] rounded-xl p-4 focus:outline-none focus:border-[#5b8def]/50 focus:ring-1 focus:ring-[#5b8def]/50 transition-all font-mono text-sm placeholder:text-gray-700 min-h-[80px] resize-y"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lead Magnet HTML</label>
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] text-[#5b8def] font-bold uppercase tracking-wider cursor-pointer hover:underline flex items-center gap-1">
                      <FileCode size={12} />
                      Upload File
                      <input type="file" className="hidden" accept=".html,.htm,.txt" onChange={handleFileSelectHtml} />
                    </label>
                    <span className="text-[10px] text-gray-600 font-mono italic">Support: inputs, selects, textareas</span>
                  </div>
                </div>
                <div
                  className="relative group"
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingHtml(true); }}
                  onDragLeave={() => setIsDraggingHtml(false)}
                  onDrop={handleDropHtml}
                >
                  <textarea
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste your styled HTML here or drop a file..."
                    className={`w-full bg-[#161922] border rounded-xl p-4 min-h-[320px] focus:outline-none focus:ring-1 transition-all font-mono text-xs placeholder:text-gray-700 resize-y ${
                      isDraggingHtml
                        ? 'border-[#5b8def] ring-1 ring-[#5b8def] bg-[#5b8def]/5'
                        : 'border-[#1c2030] focus:border-[#5b8def]/50 focus:ring-[#5b8def]/50'
                    }`}
                  />
                  {isDraggingHtml && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-[#5b8def]/10 border-2 border-dashed border-[#5b8def] rounded-xl backdrop-blur-[2px] z-10 animate-pulse">
                      <FileCode size={48} className="text-[#5b8def] mb-2" />
                      <p className="text-[#5b8def] font-bold uppercase tracking-widest text-sm">Drop HTML File Here</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={runVetter}
                  disabled={loading || !html.trim()}
                  className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 group ${
                    loading || !html.trim()
                    ? 'bg-[#1c2030] text-gray-600 cursor-not-allowed'
                    : 'bg-[#5b8def] text-white hover:bg-[#5b8def]/90 hover:scale-[1.02] active:scale-95 shadow-[0_4px_20px_rgba(91,141,239,0.3)]'
                  }`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : <Code size={18} className="group-hover:rotate-12 transition-transform" />}
                  Fix HTML
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10 pb-20"
              >
                {/* Sales Page URL Box */}
                {result.salesPageUrl && (
                  <div className="bg-[#1c2030] rounded-2xl p-6 border border-[#5b8def]/30 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <ExternalLink size={120} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-1">
                        <h3 className="text-white font-bold flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-[#2ec27e]" />
                          Lead Magnet Target URL
                        </h3>
                        <p className="text-xs text-gray-400">Copy this for your Lead Magnet buttons.</p>
                      </div>
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <input
                          readOnly
                          value={result.salesPageUrl}
                          className="flex-1 md:w-[300px] bg-[#0f1115] border border-[#1c2030] rounded-lg px-3 py-2 text-xs font-mono text-[#5b8def] truncate"
                        />
                        <button
                          onClick={() => copyToClipboard(result.salesPageUrl!, 'url')}
                          className="p-2 bg-[#5b8def] text-white rounded-lg hover:bg-[#5b8def]/80 transition-colors shadow-lg shadow-[#5b8def]/20"
                        >
                          {copied === 'url' ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warnings Banner */}
                {needsReviewIssues.length > 0 && (
                  <div className="bg-[#e6a23c]/10 border border-[#e6a23c]/30 rounded-2xl px-6 py-4 flex gap-4 items-start">
                    <div className="pt-1">
                      <AlertTriangle className="text-[#e6a23c]" size={20} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-white font-bold text-sm">Action Required: {needsReviewIssues.length} Items Need Review</h4>
                      <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                        {needsReviewIssues.map((issue, idx) => (
                          <li key={idx}><span className="text-[#e6a23c] font-mono mr-1">[{issue.code}]</span> {issue.message}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Auto-fixed Summary */}
                {autoFixedIssues.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {autoFixedIssues.map((issue, idx) => (
                      <span key={idx} className="px-2 py-1 bg-[#2ec27e]/10 border border-[#2ec27e]/20 text-[#2ec27e] text-[10px] font-bold rounded-md uppercase tracking-wider">
                        {issue.code.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}

                {/* Output Area */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold flex items-center gap-2">
                      <FileCode size={20} className="text-[#5b8def]" />
                      Fixed Lead Magnet HTML
                    </h3>
                    <button
                      onClick={() => copyToClipboard(result.fixedHtml, 'html')}
                      className="text-xs font-bold text-[#5b8def] flex items-center gap-1 hover:underline"
                    >
                      {copied === 'html' ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy HTML</>}
                    </button>
                  </div>
                  <div className="relative group">
                    <textarea
                      readOnly
                      value={result.fixedHtml}
                      className="w-full bg-[#161922] border border-[#1c2030] rounded-2xl p-6 h-[500px] font-mono text-[11px] leading-relaxed focus:outline-none"
                    />
                    <div className="absolute top-4 right-4 pointer-events-none opacity-20 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Cleaned Output
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <LayoutDashboard size={80} className="mb-4" />
              <p className="text-sm font-bold tracking-widest uppercase">Awaiting Input</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, disabled = false }: { icon: React.ReactNode, label: string, active?: boolean, disabled?: boolean }) {
  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group
        ${active ? 'bg-[#5b8def]/10 text-[#5b8def]' : 'text-gray-500 hover:bg-[#1c2030] hover:text-gray-300'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      <div className={`${active ? 'text-[#5b8def]' : 'text-gray-600 group-hover:text-gray-400'}`}>
        {icon}
      </div>
      <span className="font-semibold text-sm tracking-tight">{label}</span>
      {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
    </div>
  );
}
