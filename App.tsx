import React, { useState, useEffect, useMemo } from 'react';
import { Inbox, LayoutDashboard, RefreshCw, Zap, Search, Settings, Loader2, Database, LogIn, Mail, LogOut, Sparkles } from 'lucide-react';
import { Email } from './types';
import { analyzeEmailBatch } from './services/geminiService';
import { db } from './services/storageService';
import { fetchEmailsFromBackend, syncEmailsWithBackend, checkBackendAuthStatus, logoutFromBackend, loginToBackend } from './services/gmailBackend';
import EmailDetail from './components/EmailDetail';
import Dashboard from './components/Dashboard';
import { PriorityBadge } from './components/AnalysisBadge';

const LoginScreen: React.FC = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 p-12 bg-white rounded-3xl shadow-xl max-w-md w-full">
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
          <Zap className="text-white" size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Inbox Intel AI</h1>
          <p className="text-gray-500">Connect your Gmail to get started with AI-powered email intelligence.</p>
        </div>
        <button 
          onClick={loginToBackend}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3"
        >
          <LogIn size={20} />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'inbox' | 'dashboard'>('inbox');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Initial Load
  useEffect(() => {
    const init = async () => {
      const auth = await checkBackendAuthStatus();
      setIsAuthenticated(auth.isAuthenticated);
      setUserEmail(auth.userEmail);
      setIsLoadingAuth(false);

      if (auth.isAuthenticated) {
        const data = await fetchEmailsFromBackend();
        setEmails(data as Email[]);
      }
    };
    init();
  }, []);

  const handleLogout = async () => {
    await logoutFromBackend();
    setIsAuthenticated(false);
    setUserEmail("");
  };

  // Grouping and Sorting
  const threads = useMemo(() => {
    const filtered = emails.filter(e => 
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups = new Map<string, Email[]>();
    filtered.forEach(e => {
      const tid = e.threadId || e.id;
      if (!groups.has(tid)) groups.set(tid, []);
      groups.get(tid)?.push(e);
    });

    return Array.from(groups.values())
      .map(t => t.sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()))
      .sort((a, b) => {
        const lastA = a[a.length - 1];
        const lastB = b[b.length - 1];
        const scoreA = lastA.analysis?.urgencyScore || 0;
        const scoreB = lastB.analysis?.urgencyScore || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(lastB.receivedAt).getTime() - new Date(lastA.receivedAt).getTime();
      });
  }, [emails, searchQuery]);

  const selectedThread = threads.find(t => (t[0].threadId || t[0].id) === selectedThreadId);

  if (isLoadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Sync Logic
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const data = await syncEmailsWithBackend();
      setEmails(data as Email[]);
      db.saveEmails(data as Email[]);
    } finally {
      setIsSyncing(false);
    }
  };

  // AI Analysis Logic
  const handleRunAI = async () => {
    if (emails.length === 0) return;
    setIsAnalyzing(true);
    try {
      // Analyze unique threads (latest message in each)
      const latestMessages = threads.map(t => t[t.length - 1]);
      const results = await analyzeEmailBatch(latestMessages);
      
      const updated = emails.map(e => ({
        ...e,
        analysis: results[e.id] || e.analysis
      }));

      setEmails(updated);
      db.saveEmails(updated);
      setActiveTab('dashboard');
    } catch (error) {
      console.error("AI processing failed:", error);
      alert("AI analysis failed. Please ensure your API Key is set.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-20 bg-gray-950 flex flex-col items-center py-6 gap-8 flex-shrink-0 border-r border-gray-800">
        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
          <Zap className="text-white" size={24} />
        </div>

        <div className="flex flex-col gap-6 w-full px-2">
          <button 
            onClick={() => { setActiveTab('inbox'); setSelectedThreadId(null); }}
            className={`p-3 rounded-xl transition-all flex justify-center group relative ${activeTab === 'inbox' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
          >
            <Inbox size={24} />
            <span className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 transition-all">Inbox</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('dashboard'); setSelectedThreadId(null); }}
            className={`p-3 rounded-xl transition-all flex justify-center group relative ${activeTab === 'dashboard' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
          >
            <LayoutDashboard size={24} />
            <span className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 transition-all">Analytics</span>
          </button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-6">
          <div className="group relative">
            <div className="p-2 text-indigo-400 bg-gray-900 rounded-lg">
              <Database size={18} />
            </div>
            <span className="absolute left-16 top-1 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 border border-gray-700">Local DB Active</span>
          </div>

          <div className="group relative">
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-900 rounded-lg transition-all"
            >
              <LogOut size={18} />
            </button>
            <span className="absolute left-16 top-1 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 border border-gray-700">Sign Out</span>
          </div>

          <div className="group relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/10">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="absolute left-14 bottom-0 ml-4 px-3 py-2 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-gray-700 shadow-2xl z-50 pointer-events-none">
              <p className="font-bold mb-1">Signed in as:</p>
              <p className="text-gray-400">{userEmail}</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thread List Sidebar */}
        {activeTab === 'inbox' && (
          <div className={`${selectedThreadId ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r border-gray-100 bg-white`}>
            <div className="p-6 border-b border-gray-50 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black tracking-tight text-gray-900">Inbox</h1>
                <div className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-widest">{threads.length} Threads</div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex-1 h-10 flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                  Sync
                </button>
                <button 
                  onClick={handleRunAI}
                  disabled={isAnalyzing || emails.length === 0}
                  className="flex-[1.5] h-10 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-200 active:scale-95 disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Run Intelligence
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter conversations..." 
                  className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {threads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Inbox className="text-gray-300" size={24} />
                  </div>
                  <p className="text-gray-900 font-bold text-sm">No messages</p>
                  <p className="text-gray-400 text-xs">Sync to pull latest emails</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {threads.map((thread) => {
                    const latest = thread[thread.length - 1];
                    const tid = latest.threadId || latest.id;
                    const isSelected = selectedThreadId === tid;

                    return (
                      <div 
                        key={tid}
                        onClick={() => setSelectedThreadId(tid)}
                        className={`p-5 cursor-pointer transition-all border-l-[3px] ${isSelected ? 'bg-indigo-50/50 border-indigo-600' : 'border-transparent hover:bg-gray-50'}`}
                      >
                        <div className="flex justify-between items-start mb-1 gap-4">
                          <h3 className="text-sm font-bold text-gray-900 truncate flex-1">
                            {thread.map(e => (e.senderName || e.sender || "Unknown").split(' ')[0]).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                            {thread.length > 1 && <span className="ml-2 text-[10px] text-gray-400 font-normal">({thread.length})</span>}
                          </h3>
                          <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
                            {new Date(latest.receivedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-1 truncate">{latest.subject}</h4>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">{latest.analysis?.summary || latest.snippet}</p>
                        
                        {latest.analysis ? (
                          <div className="flex items-center gap-2">
                            <PriorityBadge priority={latest.analysis.priority} />
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${latest.analysis.urgencyScore > 75 ? 'bg-red-500' : 'bg-indigo-500'}`}
                                style={{ width: `${latest.analysis.urgencyScore}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
                             <span className="text-[10px] text-gray-300 font-bold tracking-wider uppercase">Pending Analysis</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Viewer */}
        <main className="flex-1 h-full bg-gray-50/30">
          {activeTab === 'dashboard' ? (
            <Dashboard emails={emails} />
          ) : (
            <>
              {selectedThread ? (
                <EmailDetail thread={selectedThread} onClose={() => setSelectedThreadId(null)} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-12">
                  <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8 animate-bounce transition-all duration-[3000ms]">
                    <Sparkles className="text-indigo-600" size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4">Select a conversation</h2>
                  <p className="text-gray-500 max-w-sm leading-relaxed">Choose an email to see smart summaries, priority scores, and suggested replies powered by Gemini AI.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppContent />
  );
}
