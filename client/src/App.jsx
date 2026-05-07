import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_PROMPTS = [
  {
    label: "Lung cancer",
    query: "Lung cancer immunotherapy latest evidence",
    icon: "□"
  },
  {
    label: "Diabetes trials",
    query: "Diabetes metformin clinical trials",
    icon: "💉"
  },
  {
    label: "Alzheimer's",
    query: "Alzheimer's disease biomarker trials",
    icon: "🧠"
  },
  {
    label: "Heart disease",
    query: "Heart disease latest treatment evidence",
    icon: "❤️"
  },
  {
    label: "Parkinson's DBS",
    query: "Deep brain stimulation for Parkinson's disease",
    icon: "🔧"
  },
  {
    label: "Drug safety",
    query: "Drug safety of levodopa in Parkinson's disease",
    icon: "💊"
  }
];

function App() {
  const [patientContext, setPatientContext] = useState({
    patientName: "John",
    disease: "Parkinson's disease",
    location: "Toronto, Canada",
    currentMedications: "Levodopa"
  });
// LOGIN AUTHENTICATION
    const [isLoggedIn, setIsLoggedIn] = useState(
  localStorage.getItem("medresearch_login") === "true"
);

const [loginForm, setLoginForm] = useState({
  username: "",
  password: ""
});

const [loginError, setLoginError] = useState("");

const handleLogin = () => {
  if (loginForm.username === "admin" && loginForm.password === "1234") {
    localStorage.setItem("medresearch_login", "true");
    setIsLoggedIn(true);
    setLoginError("");
  } else {
    setLoginError("Invalid login ID or password");
  }
};

const handleLogout = () => {
  localStorage.removeItem("medresearch_login");
  setIsLoggedIn(false);
};

// LOGIN PAGE BEFORE MAIN APP
if (!isLoggedIn) {
  return (
    <div style={loginPage}>
      <div style={loginGlowOne} />
      <div style={loginGlowTwo} />

      <div style={loginCard}>
        <div style={loginLogo}>✣</div>

        <h1 style={loginTitle}>Welcome to MedResearchAI</h1>
        <p style={loginSubtitle}>
          Login or sign up to access your medical research workspace, saved patient context, and previous chat history.
        </p>

        <div style={loginSwitchWrap}>
          <button style={loginSwitchActive}>Login</button>
          <button style={loginSwitchInactive}>Sign Up</button>
        </div>

        <input
          style={loginInput}
          placeholder="Login ID"
          value={loginForm.username}
          onChange={(e) =>
            setLoginForm((prev) => ({ ...prev, username: e.target.value }))
          }
        />

        <input
          style={loginInput}
          type="password"
          placeholder="Password"
          value={loginForm.password}
          onChange={(e) =>
            setLoginForm((prev) => ({ ...prev, password: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
        />

        {loginError && <div style={loginErrorText}>{loginError}</div>}

        <button style={loginButton} onClick={handleLogin}>
          Continue
        </button>

        <div style={loginHint}>Demo Login: admin / 1234</div>
      </div>
    </div>
  );
}
  const [formData, setFormData] = useState({
    patientName: "John",
    disease: "Parkinson's disease",
    query: "",
    location: "Toronto, Canada"
  });

  const [sessionId, setSessionId] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [expandedQueries, setExpandedQueries] = useState([]);
  const [structuredResponse, setStructuredResponse] = useState(null);
  const [usedContext, setUsedContext] = useState(null);
  const [finalProcessedQuery, setFinalProcessedQuery] = useState("");
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [uiState, setUiState] = useState("empty");
  const [activeTab, setActiveTab] = useState("analysis");
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineLogs, setPipelineLogs] = useState([]);
  const [showContextBar, setShowContextBar] = useState(true);
  const [savedPatients, setSavedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  const [voiceAssistantStatus, setVoiceAssistantStatus] = useState("idle");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceReply, setVoiceReply] = useState("");

  const pipelineTimerRef = useRef(null);
  const reportInputRef = useRef(null);
  const voiceRecognitionRef = useRef(null);

  useEffect(() => {
    fetchSavedPatients();
  }, []);

  const stats = structuredResponse?.retrievalStats || {
    openAlexRetrieved: 0,
    pubmedRetrieved: 0,
    clinicalTrialsRetrieved: 0,
    openAlexShown: 0,
    pubmedShown: 0,
    clinicalTrialsShown: 0
  };

  const allPapers = useMemo(() => {
    return [
      ...(structuredResponse?.publications || []),
      ...(structuredResponse?.pubmedPublications || [])
    ];
  }, [structuredResponse]);

  const allTrials = useMemo(() => {
    return structuredResponse?.clinicalTrials || [];
  }, [structuredResponse]);

  const allEvidenceCounts = useMemo(() => {
    return {
      papers: allPapers.length,
      trials: allTrials.length
    };
  }, [allPapers, allTrials]);

  const oneLineAnswer = useMemo(() => {
    if (structuredResponse?.oneLineAnswer) {
      return structuredResponse.oneLineAnswer;
    }

    if (structuredResponse?.researchInsights) {
      return `Yes: I found relevant evidence. ${structuredResponse.researchInsights}`;
    }

    if (structuredResponse?.clinicalTrialSignals) {
      return `Suggestion: Review the clinical trial signal with a clinician. ${structuredResponse.clinicalTrialSignals}`;
    }

    if (structuredResponse?.conditionOverview) {
      return `Suggestion: Use this as research context, not medical advice. ${structuredResponse.conditionOverview}`;
    }

    return "";
  }, [structuredResponse]);

  const fetchSavedPatients = async () => {
    try {
      const res = await fetch("http://localhost:5000/patients");
      const data = await res.json();
      if (data.success) {
        setSavedPatients(data.patients || []);
      }
    } catch (error) {
      console.error("Failed to load saved patients:", error);
    }
  };

  const handleSaveContext = async () => {
  try {
    const res = await fetch("http://localhost:5000/patients/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patientContext)
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Unable to save patient context right now. Please check backend connection and MongoDB Atlas.");
      return;
    }

    await fetchSavedPatients();
    alert("Patient context saved successfully");
  } catch (error) {
    console.error(error);
    alert("Unable to save patient context right now. Please check backend connection and MongoDB Atlas.");
  }
};
      

  

  const loadPatientHistory = async (patientName) => {
    try {
      const res = await fetch(
        `http://localhost:5000/patients/${encodeURIComponent(patientName)}/history`
      );
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to load history");
      }

      const sessions = data.sessions || [];

      if (sessions.length > 0) {
        const latest = sessions[0];

        setSessionId(latest._id || "");
        setChatHistory(
          (latest.messages || []).map((msg) => ({
            role: msg.role,
            content: msg.content
          }))
        );

        setPatientContext((prev) => ({
          ...prev,
          patientName: latest.patientName || prev.patientName,
          disease: latest.activeCondition || prev.disease,
          location: latest.activeLocation || prev.location
        }));

        setFormData((prev) => ({
          ...prev,
          patientName: latest.patientName || prev.patientName,
          disease: latest.activeCondition || prev.disease,
          location: latest.activeLocation || prev.location
        }));

        setUiState("results");
      }
    } catch (error) {
      console.error("Load history error:", error);
    }
  };

  const handlePatientContextChange = (e) => {
    const { name, value } = e.target;
    setPatientContext((prev) => ({
      ...prev,
      [name]: value
    }));
    setFormData((prev) => {
      const next = { ...prev };
      if (name === "patientName") next.patientName = value;
      if (name === "disease") next.disease = value;
      if (name === "location") next.location = value;
      return next;
    });
  };

  const handleComposerChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      query: e.target.value
    }));
  };

  const simulatePipeline = (queryText) => {
    const diseaseLabel = patientContext.disease || formData.disease || "current condition";
    const locationLabel = patientContext.location || formData.location || "current location";

    const logs = [
      `Expanding query for "${queryText}"...`,
      `Context-aware reformulation using disease: ${diseaseLabel}`,
      `Fetching evidence from PubMed + OpenAlex + ClinicalTrials.gov...`,
      `Applying location-aware refinement for ${locationLabel}...`,
      `Ranking results by relevance, recency, and source quality...`,
      `Selecting top papers and clinical trials...`,
      `Generating structured analysis and safety summary...`,
      `Preparing evidence workspace...`
    ];

    setPipelineStep(0);
    setPipelineLogs([]);

    let i = 0;
    pipelineTimerRef.current = setInterval(() => {
      setPipelineStep(i + 1);
      setPipelineLogs((prev) => [...prev, logs[i]]);
      i += 1;
      if (i >= logs.length) {
        clearInterval(pipelineTimerRef.current);
      }
    }, 320);
  };

  const stopPipeline = () => {
    if (pipelineTimerRef.current) {
      clearInterval(pipelineTimerRef.current);
      pipelineTimerRef.current = null;
    }
  };

  const runSearch = async (payload, userMessage, isFollowUp = false) => {
    try {
      setUiState("loading");
      setActiveTab("analysis");
      simulatePipeline(userMessage);

      const response = await fetch("http://localhost:5000/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      stopPipeline();

      if (!response.ok) {
        throw new Error(data.message || "Backend request failed");
      }

      setResponseMessage(data.message || "");
      setSessionId(data.sessionId || "");
      setExpandedQueries(data.expandedQueries || []);
      setStructuredResponse(data.structuredResponse || null);
      setUsedContext(data.usedContext || null);
      setFinalProcessedQuery(
        data.finalProcessedQuery || data.usedContext?.query || payload.query || ""
      );

      const assistantSummary = [
        data.structuredResponse?.oneLineAnswer,
        data.structuredResponse?.conditionOverview,
        data.structuredResponse?.researchInsights,
        data.structuredResponse?.clinicalTrialSignals,
        data.structuredResponse?.safetyNote
      ]
        .filter(Boolean)
        .join(" ");

      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: userMessage, kind: isFollowUp ? "follow-up" : "initial" },
        { role: "assistant", content: assistantSummary || "No structured response generated." }
      ]);

      await fetchSavedPatients();
      setUiState("results");
      return data;
    } catch (error) {
      stopPipeline();
      console.error("Frontend fetch error:", error);
      setResponseMessage(error.message || "Failed to fetch results");
      setStructuredResponse(null);
      setUiState("results");
      return null;
    }
  };

  const handleInitialSearch = async () => {
    if (!formData.query.trim()) return;

    const userMessage = formData.query.trim();

    await runSearch(
      {
        sessionId,
        patientName: patientContext.patientName,
        disease: patientContext.disease,
        query: formData.query.trim(),
        location: patientContext.location
      },
      userMessage,
      false
    );

    setFormData((prev) => ({
      ...prev,
      query: ""
    }));
  };

  const handleFollowUpSubmit = async () => {
    if (!followUpMessage.trim() || !sessionId) return;

    const currentFollowUp = followUpMessage.trim();

    await runSearch(
      {
        sessionId,
        patientName: patientContext.patientName,
        disease: "",
        query: "",
        location: "",
        followUpMessage: currentFollowUp
      },
      currentFollowUp,
      true
    );

    setFollowUpMessage("");
  };

  const handlePromptClick = (prompt) => {
    setFormData((prev) => ({
      ...prev,
      query: prompt
    }));
  };

  const handleExpandedQueryClick = async (queryText) => {
    const nextQuery = queryText.trim();
    if (!nextQuery) return;

    await runSearch(
      {
        sessionId,
        patientName: patientContext.patientName,
        disease: patientContext.disease,
        query: nextQuery,
        location: patientContext.location
      },
      nextQuery,
      false
    );
  };

  const speakVoiceAssistant = (text, onEnd) => {
    if (!("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  };

  const closeVoiceAssistant = () => {
    voiceRecognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setVoiceAssistantOpen(false);
    setVoiceAssistantStatus("idle");
  };

  const startVoiceListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceAssistantStatus("idle");
      setVoiceReply("Voice assistant works best in Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    voiceRecognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    setVoiceAssistantStatus("listening");

    recognition.onresult = async (event) => {
      const spokenText = event.results[0][0].transcript;
      setVoiceTranscript(spokenText);
      setVoiceAssistantStatus("thinking");

      const data = await runSearch(
        {
          sessionId,
          patientName: patientContext.patientName,
          disease: patientContext.disease,
          query: spokenText,
          location: patientContext.location
        },
        spokenText,
        false
      );

      const answer =
        data?.structuredResponse?.oneLineAnswer ||
        "Suggestion: I could not analyze that clearly. Please try again or contact a qualified clinician for urgent symptoms.";

      setVoiceReply(answer);
      setVoiceAssistantStatus("speaking");
      speakVoiceAssistant(answer, () => setVoiceAssistantStatus("idle"));
    };

    recognition.onerror = (event) => {
      console.error("Voice assistant error:", event.error);
      const message =
        event.error === "not-allowed"
          ? "Microphone permission is blocked. Please allow microphone access from the browser address bar."
          : "I could not hear that clearly. Please tap Listen and try again.";
      setVoiceReply(message);
      setVoiceAssistantStatus("idle");
      speakVoiceAssistant(message);
    };

    recognition.start();
  };

  const openVoiceAssistant = () => {
    const greeting = "Hello, I am your assistant. How are you feeling today?";
    setVoiceAssistantOpen(true);
    setVoiceTranscript("");
    setVoiceReply(greeting);
    setVoiceAssistantStatus("speaking");

    if (!navigator.mediaDevices?.getUserMedia) {
      const message = "Voice assistant needs a browser with microphone support.";
      setVoiceReply(message);
      setVoiceAssistantStatus("idle");
      speakVoiceAssistant(message);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
        speakVoiceAssistant(greeting, startVoiceListening);
      })
      .catch(() => {
        const message = "Please allow microphone permission to use voice assistant.";
        setVoiceReply(message);
        setVoiceAssistantStatus("idle");
        speakVoiceAssistant(message);
      });
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleReportUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUiState("loading");
      setActiveTab("analysis");
      simulatePipeline(`Analyzing report: ${file.name}`);

      const contentBase64 = await fileToBase64(file);
      const response = await fetch("http://localhost:5000/research/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          contentBase64,
          patientName: patientContext.patientName,
          disease: patientContext.disease,
          location: patientContext.location
        })
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("Report analysis endpoint did not return JSON. Please restart the backend and try again.");
      }
      stopPipeline();

      if (!response.ok) {
        throw new Error(data.message || "Report analysis failed");
      }

      setResponseMessage(data.message || "");
      setSessionId(data.sessionId || "");
      setExpandedQueries(data.expandedQueries || []);
      setStructuredResponse(data.structuredResponse || null);
      setUsedContext(data.usedContext || null);
      setFinalProcessedQuery(data.finalProcessedQuery || `Uploaded report: ${file.name}`);
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: `Uploaded report: ${file.name}`, kind: "report" },
        {
          role: "assistant",
          content: data.structuredResponse?.oneLineAnswer || "Report analyzed."
        }
      ]);
      setUiState("results");
    } catch (error) {
      stopPipeline();
      console.error("Report upload error:", error);
      setResponseMessage(error.message || "Failed to analyze report");
      setStructuredResponse(null);
      setUiState("results");
    } finally {
      event.target.value = "";
    }
  };

  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      style={emptyStateWrap}
    >
      <div style={brandIconWrap}>
        <div style={brandIconGlow} />
        <div style={brandIcon}>✣</div>
      </div>

      <h1 style={emptyTitle}>MedResearchAI</h1>
      <p style={emptySubtitle}>
        medical research assistant
      </p>

      <div style={quickSearchTitle}>Quick Searches</div>
      <div style={quickPromptGrid}>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt.label}
            style={quickPromptBtn}
            onClick={() => handlePromptClick(prompt.query)}
          >
            <span style={quickPromptIcon}>{prompt.icon}</span>
            <span>{prompt.label}</span>
          </button>
        ))}
      </div>
      <div style={quickSourcePills}>
        <span style={quickSourcePill}>Llama 3.3 70B</span>
        <span style={quickSourcePill}>PubMed</span>
        <span style={quickSourcePill}>OpenAlex</span>
        <span style={quickSourcePill}>ClinicalTrials.gov</span>
        <span style={quickSourcePill}>OpenFDA</span>
      </div>
    </motion.div>
  );

  const renderPipeline = () => {
    const progress = Math.min((pipelineStep / 8) * 100, 100);

    return (
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        style={pipelineCard}
      >
        <div style={pipelineHeaderRow}>
          <div style={pipelineAvatar}>✣</div>
          <div style={{ flex: 1 }}>
            <div style={pipelineTitle}>LIVE PIPELINE</div>
            <div style={progressBarWrap}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.25 }}
                style={progressBar}
              />
            </div>
          </div>
          <div style={progressText}>{Math.round(progress)}%</div>
        </div>

        <div style={pipelineLogWrap}>
          {pipelineLogs.map((log, idx) => (
            <motion.div
              key={`${log}-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={pipelineLogLine}
            >
              <span style={pipelineDot}>◉</span>
              <span>{log}</span>
            </motion.div>
          ))}
          {pipelineLogs.length === 0 && (
            <div style={pipelineMuted}>Initializing retrieval pipeline...</div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderResults = () => (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      style={resultsWrap}
    >
      <div style={queryBubbleWrap}>
        <div style={queryBubble}>
          {chatHistory.length > 0
            ? chatHistory[chatHistory.length - 2]?.content || finalProcessedQuery
            : finalProcessedQuery}
        </div>
        <div style={userMiniAvatar}>◌</div>
      </div>

      {responseMessage && !structuredResponse && (
        <div style={errorBanner}>{responseMessage}</div>
      )}

      <div style={workspaceCard}>
        <div style={workspaceTopRow}>
          <div style={assistantMiniAvatar}>✣</div>

          <div style={tabsWrap}>
            <TabButton
              label="Analysis"
              active={activeTab === "analysis"}
              onClick={() => setActiveTab("analysis")}
            />
            <TabButton
              label="Papers"
              active={activeTab === "papers"}
              onClick={() => setActiveTab("papers")}
              badge={allEvidenceCounts.papers}
            />
            <TabButton
              label="Trials"
              active={activeTab === "trials"}
              onClick={() => setActiveTab("trials")}
              badge={allEvidenceCounts.trials}
            />
            <TabButton
              label="Analytics"
              active={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
            />
          </div>
        </div>

        <div style={tabBody}>
          {activeTab === "analysis" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={analysisPremiumWrap}
            >
              <div style={analysisHeroCard}>
                <div style={analysisHeroGlow} />
                <div style={analysisHeroContent}>
                  <div style={analysisHeroTop}>
                    <div>
                      <div style={analysisEyebrow}>Research Summary</div>
                      <div style={analysisHeroTitle}>
                        Context-aware evidence synthesis for{" "}
                        {usedContext?.disease || patientContext.disease || "the selected condition"}
                      </div>
                    </div>

                    <div style={analysisConfidencePill}>
                      <span style={analysisConfidenceDot} />
                      Evidence Ready
                    </div>
                  </div>

                  <div style={analysisStatsRow}>
                    <div style={analysisMiniStat}>
                      <div style={analysisMiniStatValue}>{allEvidenceCounts.papers}</div>
                      <div style={analysisMiniStatLabel}>Publications</div>
                    </div>
                    <div style={analysisMiniStat}>
                      <div style={analysisMiniStatValue}>{allEvidenceCounts.trials}</div>
                      <div style={analysisMiniStatLabel}>Clinical Trials</div>
                    </div>
                    <div style={analysisMiniStat}>
                      <div style={analysisMiniStatValue}>{expandedQueries?.length || 0}</div>
                      <div style={analysisMiniStatLabel}>Expanded Queries</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={oneLineAnswerCard}>
                <div style={oneLineAnswerLabel}>One-line answer</div>
                <div style={oneLineAnswerText}>
                  {oneLineAnswer || "No one-line answer available."}
                </div>
              </div>

              <div style={analysisPremiumGrid}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  style={analysisGlassCard}
                >
                  <div style={analysisCardIcon}>◎</div>
                  <div style={analysisCardTitle}>Condition Overview</div>
                  <div style={analysisCardText}>
                    {structuredResponse?.conditionOverview || "No content available."}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                  style={analysisGlassCard}
                >
                  <div style={analysisCardIcon}>✦</div>
                  <div style={analysisCardTitle}>Key Research Insights</div>
                  <div style={analysisCardText}>
                    {structuredResponse?.researchInsights || "No content available."}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.19 }}
                  style={analysisGlassCard}
                >
                  <div style={analysisCardIcon}>◌</div>
                  <div style={analysisCardTitle}>Clinical Trial Highlights</div>
                  <div style={analysisCardText}>
                    {structuredResponse?.clinicalTrialSignals || "No content available."}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.26 }}
                  style={analysisGlassCard}
                >
                  <div style={analysisCardIcon}>⚕</div>
                  <div style={analysisCardTitle}>Safety Note</div>
                  <div style={analysisCardText}>
                    {structuredResponse?.safetyNote || "No content available."}
                  </div>
                </motion.div>
              </div>

              <div style={analysisQueryCard}>
                <div style={analysisCardTitle}>Expanded Queries</div>
                <div style={analysisQueryList}>
                  {(expandedQueries || []).length > 0 ? (
                    expandedQueries.map((q) => (
                      <button
                        key={q}
                        style={analysisQueryLink}
                        onClick={() => handleExpandedQueryClick(q)}
                        title="Search this expanded query"
                      >
                        {q}
                      </button>
                    ))
                  ) : (
                    <div style={emptyTabState}>No expanded queries available.</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "papers" && (
            <div style={cardGrid}>
              {allPapers.map((paper, idx) => (
                <PremiumPaperCard key={paper.id || idx} paper={paper} />
              ))}
              {allPapers.length === 0 && (
                <EmptyTabState text="No papers found for this query." />
              )}
            </div>
          )}

          {activeTab === "trials" && (
            <div style={cardGrid}>
              {allTrials.map((trial, idx) => (
                <PremiumTrialCard key={trial.id || idx} trial={trial} />
              ))}
              {allTrials.length === 0 && (
                <EmptyTabState text="No clinical trials found for this query." />
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              style={premiumAnalyticsWrap}
            >
              <div style={analyticsHeroCard}>
                <div style={analyticsHeroGlow} />
                <div style={analyticsHeroContent}>
                  <div style={analyticsHeroTop}>
                    <div>
                      <div style={analyticsEyebrow}>Evidence Intelligence</div>
                      <div style={analyticsHeroTitle}>
                        Real-time research quality snapshot
                      </div>
                      <div style={analyticsHeroSubtitle}>
                        A premium overview of publication depth, trial coverage, and query expansion activity.
                      </div>
                    </div>

                    <div style={analyticsBadgeGroup}>
                      <div style={analyticsBadgeBlue}>OpenAlex {stats.openAlexShown}</div>
                      <div style={analyticsBadgeCyan}>PubMed {stats.pubmedShown}</div>
                      <div style={analyticsBadgePurple}>Trials {stats.clinicalTrialsShown}</div>
                    </div>
                  </div>

                  <div style={premiumPulseRow}>
                    <SignalOrb
                      label="OpenAlex"
                      value={stats.openAlexShown}
                      total={Math.max(stats.openAlexRetrieved, 1)}
                      tone="blue"
                    />
                    <SignalOrb
                      label="PubMed"
                      value={stats.pubmedShown}
                      total={Math.max(stats.pubmedRetrieved, 1)}
                      tone="cyan"
                    />
                    <SignalOrb
                      label="Trials"
                      value={stats.clinicalTrialsShown}
                      total={Math.max(stats.clinicalTrialsRetrieved, 1)}
                      tone="purple"
                    />
                  </div>
                </div>
              </div>

              <div style={analyticsInsightGrid}>
                <MetricGlassCard
                  title="OpenAlex Retrieved"
                  value={stats.openAlexRetrieved}
                  tone="green"
                />
                <MetricGlassCard
                  title="PubMed Retrieved"
                  value={stats.pubmedRetrieved}
                  tone="amber"
                />
                <MetricGlassCard
                  title="Trials Retrieved"
                  value={stats.clinicalTrialsRetrieved}
                  tone="red"
                />
                <MetricGlassCard
                  title="OpenAlex Shown"
                  value={stats.openAlexShown}
                  tone="green"
                />
                <MetricGlassCard
                  title="PubMed Shown"
                  value={stats.pubmedShown}
                  tone="amber"
                />
                <MetricGlassCard
                  title="Trials Shown"
                  value={stats.clinicalTrialsShown}
                  tone="red"
                />
              </div>

              <div style={analyticsQueryCard}>
                <div style={analyticsQueryHeader}>
                  <div style={analyticsQueryTitle}>Expanded Queries Used</div>
                  <div style={analyticsQueryCount}>
                    {(expandedQueries || []).length} variants
                  </div>
                </div>

                <div style={analyticsQueryFlow}>
                  {(expandedQueries || []).length > 0 ? (
                    expandedQueries.map((q, index) => (
                      <motion.div
                        key={q}
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.06 }}
                        style={queryFlowItem}
                      >
                        <div style={queryFlowDot} />
                        <button
                          style={queryFlowTextButton}
                          onClick={() => handleExpandedQueryClick(q)}
                          title="Search this expanded query"
                        >
                          {q}
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    <div style={queryFlowEmpty}>No expanded queries available.</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div style={pageStyle}>
      <div style={bgGlowLeft} />
      <div style={bgGlowRight} />
      <div style={bgGlowCenter} />

      <div style={appShell}>
        <aside style={sidebarStyle}>
          <div style={sidebarTop}>
            <button style={menuBtn}>☰</button>
            <button
              style={newSessionBtn}
              onClick={() => {
                setSessionId("");
                setStructuredResponse(null);
                setExpandedQueries([]);
                setUsedContext(null);
                setFinalProcessedQuery("");
                setChatHistory([]);
                setUiState("empty");
                setResponseMessage("");
              }}
            >
              + New session
            </button>
          </div>

          <div style={sidebarSectionLabel}>Saved Patients</div>
          <div style={sessionListWrap}>
            {savedPatients.length === 0 ? (
              <div style={emptySessionText}>No saved patients yet</div>
            ) : (
              savedPatients.map((patient) => (
                <div
                  key={patient._id}
                  style={{
                    ...sessionCard,
                    border:
                      selectedPatient === patient.patientName
                        ? "1px solid rgba(61,125,255,0.65)"
                        : sessionCard.border
                  }}
                  onClick={() => {
                    setSelectedPatient(patient.patientName);
                    loadPatientHistory(patient.patientName);
                  }}
                >
                  <div style={sessionCardTitle}>{patient.patientName}</div>
                  <div style={sessionCardSubtitle}>
                    {patient.disease || "No disease saved"}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <main style={mainArea}>
          <header style={topbarStyle}>
            <div style={brandRow}>
              <div style={topLogo}>✣</div>
              <div>
                <div style={brandName}>MedResearchAI</div>
                <div style={brandMeta}>· PubMed · OpenAlex · ClinicalTrials</div>
              </div>
            </div>

            <div style={topbarActions}>
              <span style={sourceBadge}>PubMed</span>
              <span style={sourceBadge}>OpenAlex</span>
              <span style={sourceBadge}>Trials</span>
              {usedContext?.disease && <span style={diseaseChip}>{usedContext.disease}</span>}
              <button style={topbarBtn}>Edit Context</button>
            </div>
          </header>

          <AnimatePresence>
            {showContextBar && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                style={contextBar}
              >
                <div style={contextBarHeader}>
                  <div style={contextBarTitle}>Patient Context</div>
                  <button style={contextCloseBtn} onClick={() => setShowContextBar(false)}>
                    ×
                  </button>
                </div>

                <div style={contextGrid}>
                  <input
                    name="patientName"
                    value={patientContext.patientName}
                    onChange={handlePatientContextChange}
                    placeholder="Patient name"
                    style={contextInput}
                  />
                  <input
                    name="disease"
                    value={patientContext.disease}
                    onChange={handlePatientContextChange}
                    placeholder="Disease / condition"
                    style={contextInput}
                  />
                  <input
                    name="location"
                    value={patientContext.location}
                    onChange={handlePatientContextChange}
                    placeholder="Location"
                    style={contextInput}
                  />
                  <input
                    name="currentMedications"
                    value={patientContext.currentMedications}
                    onChange={handlePatientContextChange}
                    placeholder="Current medications"
                    style={contextInput}
                  />
                  <button style={saveContextBtn} onClick={handleSaveContext}>
                    Save Context
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={contentArea}>
            {uiState === "empty" && renderEmptyState()}
            {uiState === "loading" && renderPipeline()}
            {uiState === "results" && renderResults()}
          </div>

          <div style={composerDock}>
            <div style={composerInner}>
              <input
                ref={reportInputRef}
                type="file"
                accept=".txt,.md,.csv,.pdf,text/plain,text/markdown,text/csv,application/pdf"
                style={{ display: "none" }}
                onChange={handleReportUpload}
              />
              <input
                value={sessionId ? followUpMessage : formData.query}
                onChange={(e) => {
                  if (sessionId) setFollowUpMessage(e.target.value);
                  else handleComposerChange(e);
                }}
                placeholder="Ask about a disease, treatment, clinical trial, or drug interaction..."
                style={composerInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (sessionId) handleFollowUpSubmit();
                    else handleInitialSearch();
                  }
                }}
              />
              <button
                style={composerIconBtn}
                title="Upload report"
                onClick={() => reportInputRef.current?.click()}
              >
                📎
              </button>
              <button
                style={composerIconBtn}
                title="Voice assistant"
                onClick={openVoiceAssistant}
              >
                <span style={voiceMicIcon} aria-hidden="true">
                  <span style={{ ...voiceMicBar, height: "10px" }} />
                  <span style={{ ...voiceMicBar, height: "18px" }} />
                  <span style={{ ...voiceMicBar, height: "24px" }} />
                  <span style={{ ...voiceMicBar, height: "14px" }} />
                  <span style={{ ...voiceMicBar, height: "20px" }} />
                </span>
              </button>
              <button
                style={composerSendBtn}
                onClick={() => {
                  if (sessionId) handleFollowUpSubmit();
                  else handleInitialSearch();
                }}
              >
                ➤
              </button>
            </div>
            <div style={disclaimer}>
              For research purposes only · Not medical advice · Always consult a qualified healthcare professional
            </div>
          </div>
        </main>
      </div>
      {voiceAssistantOpen && (
        <div style={voiceOverlay}>
          <button style={voiceCloseBtn} onClick={closeVoiceAssistant}>
            ×
          </button>
          <div style={voiceOrbWrap}>
            <div style={voiceOrb}>
              {Array.from({ length: 72 }).map((_, index) => (
                <span
                  key={index}
                  style={{
                    ...voiceParticle,
                    transform: `rotate(${index * 5}deg) translate(${42 + (index % 9) * 5}px)`,
                    opacity: voiceAssistantStatus === "listening" ? 0.95 : 0.45
                  }}
                />
              ))}
            </div>
          </div>

          <div style={voiceStatusPill}>
            <span style={voiceStatusDot} />
            {voiceAssistantStatus === "speaking" && "Speaking"}
            {voiceAssistantStatus === "listening" && "Listening"}
            {voiceAssistantStatus === "thinking" && "Thinking"}
            {voiceAssistantStatus === "idle" && "Ready"}
          </div>

          <div style={voiceTextWrap}>
            <div style={voiceReplyText}>{voiceReply}</div>
            {voiceTranscript && (
              <div style={voiceTranscriptText}>You said: {voiceTranscript}</div>
            )}
          </div>

          <button
            style={voiceListenBtn}
            onClick={startVoiceListening}
            disabled={voiceAssistantStatus === "listening" || voiceAssistantStatus === "thinking"}
          >
            Listen again
          </button>
        </div>
      )}
    </div>
  );
}

function TabButton({ label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...tabBtn,
        color: active ? "#55a9ff" : "#7f95c8",
        borderBottom: active ? "2px solid #2f8fff" : "2px solid transparent"
      }}
    >
      {label}
      {badge !== null && badge !== undefined && <span style={tabBadge}>{badge}</span>}
    </button>
  );
}

function PremiumPaperCard({ paper }) {
  const authorText =
    Array.isArray(paper.authors) && paper.authors.length > 0
      ? paper.authors.join(", ")
      : "Authors unavailable";

  return (
    <div style={evidenceCard}>
      <div style={paperDetailGrid}>
        <div style={paperDetailRow}>
          <span style={paperDetailLabel}>Title</span>
          <span style={paperDetailValue}>{paper.title || "Untitled publication"}</span>
        </div>

        <div style={paperDetailRow}>
          <span style={paperDetailLabel}>Authors</span>
          <span style={paperDetailValue}>{authorText}</span>
        </div>

        <div style={paperDetailRow}>
          <span style={paperDetailLabel}>Year</span>
          <span style={paperDetailValue}>{paper.year || "N/A"}</span>
        </div>

        <div style={paperDetailRow}>
          <span style={paperDetailLabel}>Source</span>
          <span style={paperDetailValue}>{paper.source || "N/A"}</span>
        </div>

        <div style={paperDetailRow}>
          <span style={paperDetailLabel}>Score</span>
          <span style={paperDetailValue}>{paper.score ?? "N/A"}</span>
        </div>
      </div>

      <a href={paper.url || "#"} target="_blank" rel="noreferrer" style={paperActionBtn}>
        View publication ↗
      </a>
    </div>
  );
}

function PremiumTrialCard({ trial }) {
  return (
    <div style={evidenceCard}>
      <div style={paperDetailGrid}>
        <div style={paperDetailRow}>
          <span style={paperDetailLabel}>Title</span>
          <span style={paperDetailValue}>{trial.title || "Untitled trial"}</span>
        </div>

        <div style={paperDetailRow}>
          <span style={paperDetailLabel}>Condition</span>
          <span style={paperDetailValue}>
            {Array.isArray(trial.condition) && trial.condition.length > 0
              ? trial.condition.join(", ")
              : "N/A"}
          </span>
        </div>

        <div style={paperDetailRow}>
          <span style={paperDetailLabel}>Intervention</span>
          <span style={paperDetailValue}>
            {Array.isArray(trial.intervention) && trial.intervention.length > 0
              ? trial.intervention.join(", ")
              : "N/A"}
          </span>
        </div>

        <div style={paperDetailRow}>
          <span style={paperDetailLabel}>Phase</span>
          <span style={paperDetailValue}>{trial.phase || "N/A"}</span>
        </div>

        <div style={paperDetailRow}>
          <span style={paperDetailLabel}>Status</span>
          <span style={paperDetailValue}>{trial.status || "N/A"}</span>
        </div>

        <div style={paperDetailRow}>
          <span style={paperDetailLabel}>Location</span>
          <span style={paperDetailValue}>{trial.location || "N/A"}</span>
        </div>
      </div>

      <a href={trial.url || "#"} target="_blank" rel="noreferrer" style={paperActionBtn}>
        View trial ↗
      </a>
    </div>
  );
}

function SignalOrb({ label, value, total, tone = "blue" }) {
  const pct = Math.max(12, Math.min(100, Math.round((value / total) * 100)));

  const tones = {
    blue: {
      ring: `conic-gradient(#56b7ff 0deg, #56b7ff ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
      glow: "0 0 30px rgba(86,183,255,0.18)",
      core: "linear-gradient(180deg, rgba(60,138,255,0.20), rgba(18,39,80,0.25))"
    },
    cyan: {
      ring: `conic-gradient(#41d6e8 0deg, #41d6e8 ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
      glow: "0 0 30px rgba(65,214,232,0.18)",
      core: "linear-gradient(180deg, rgba(65,214,232,0.20), rgba(18,39,80,0.25))"
    },
    purple: {
      ring: `conic-gradient(#9a82ff 0deg, #9a82ff ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
      glow: "0 0 30px rgba(154,130,255,0.18)",
      core: "linear-gradient(180deg, rgba(154,130,255,0.20), rgba(18,39,80,0.25))"
    }
  };

  const selected = tones[tone] || tones.blue;

  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} style={signalOrbWrap}>
      <div
        style={{
          ...signalOrbRing,
          background: selected.ring,
          boxShadow: selected.glow
        }}
      >
        <div
          style={{
            ...signalOrbCore,
            background: selected.core
          }}
        >
          <motion.div
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
            style={signalOrbValue}
          >
            {value}
          </motion.div>
        </div>
      </div>

      <div style={signalOrbLabel}>{label}</div>
      <div style={signalOrbSubtext}>{pct}% visibility</div>
    </motion.div>
  );
}

function MetricGlassCard({ title, value, tone }) {
  const colors = {
    green: "#5fd6b3",
    amber: "#8fd0ff",
    red: "#b58cff",
    blue: "#56b7ff"
  };

  const glows = {
    green: "0 0 18px rgba(95,214,179,0.16)",
    amber: "0 0 18px rgba(143,208,255,0.16)",
    red: "0 0 18px rgba(181,140,255,0.16)",
    blue: "0 0 18px rgba(86,183,255,0.16)"
  };

  const selectedColor = colors[tone] || colors.blue;
  const selectedGlow = glows[tone] || glows.blue;

  return (
    <motion.div whileHover={{ y: -3 }} style={metricGlassCard}>
      <div style={metricGlassTitle}>{title}</div>
      <div
        style={{
          ...metricGlassValue,
          color: selectedColor,
          textShadow: selectedGlow
        }}
      >
        {value}
      </div>
    </motion.div>
  );
}

function EmptyTabState({ text }) {
  return <div style={emptyTabState}>{text}</div>;
}

const pageStyle = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  background: "linear-gradient(180deg, #020a18 0%, #041126 100%)",
  color: "white",
  fontFamily: "Inter, Arial, sans-serif",
  position: "relative",
  overflowX: "hidden"
};

const bgGlowLeft = {
  position: "fixed",
  left: -120,
  top: 120,
  width: 320,
  height: 320,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(28,116,255,0.16), transparent 70%)",
  pointerEvents: "none"
};

const bgGlowRight = {
  position: "fixed",
  right: -140,
  top: 20,
  width: 380,
  height: 380,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(107,76,255,0.14), transparent 70%)",
  pointerEvents: "none"
};

const bgGlowCenter = {
  position: "fixed",
  left: "42%",
  top: "32%",
  width: 420,
  height: 420,
  transform: "translate(-50%, -50%)",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(0,195,255,0.08), transparent 70%)",
  pointerEvents: "none"
};

const appShell = {
  display: "grid",
  gridTemplateColumns: "300px minmax(0, 1fr)",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden"
};

const sidebarStyle = {
  borderRight: "1px solid rgba(255,255,255,0.06)",
  background: "linear-gradient(180deg, rgba(5,20,44,0.94), rgba(3,14,34,0.98))",
  padding: "16px 14px"
};

const sidebarTop = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "22px"
};

const menuBtn = {
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "white",
  cursor: "pointer"
};

const newSessionBtn = {
  flex: 1,
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(56,144,255,0.28)",
  background: "linear-gradient(180deg, rgba(10,37,78,0.95), rgba(8,29,62,0.95))",
  color: "#76b8ff",
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left"
};

const sidebarSectionLabel = {
  color: "#6f87b6",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "10px"
};

const sessionListWrap = {
  display: "grid",
  gap: "10px"
};

const emptySessionText = {
  color: "#6e81a8",
  fontSize: "15px"
};

const sessionCard = {
  padding: "14px 12px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.05)",
  cursor: "pointer"
};

const sessionCardTitle = {
  fontWeight: 700,
  marginBottom: "6px"
};

const sessionCardSubtitle = {
  color: "#7f95c8",
  fontSize: "13px"
};

const mainArea = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden"
};

const topbarStyle = {
  height: "72px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 24px",
  background: "linear-gradient(180deg, rgba(8,21,48,0.94), rgba(7,18,40,0.95))",
  position: "sticky",
  top: 0,
  zIndex: 20,
  backdropFilter: "blur(10px)",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflowX: "hidden"
};

const brandRow = {
  display: "flex",
  alignItems: "center",
  gap: "12px"
};

const topLogo = {
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, #33c7ff, #2f88ff)",
  boxShadow: "0 0 24px rgba(44,140,255,0.32)"
};

const brandName = {
  fontSize: "18px",
  fontWeight: 800
};

const brandMeta = {
  color: "#6f87b6",
  fontSize: "12px"
};

const topbarActions = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap"
};

const sourceBadge = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#88a8de",
  fontSize: "12px",
  fontWeight: 700
};

const diseaseChip = {
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(0,189,156,0.10)",
  border: "1px solid rgba(0,189,156,0.18)",
  color: "#37d3ba",
  fontSize: "13px",
  fontWeight: 700
};

const topbarBtn = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "#d8e6ff",
  cursor: "pointer"
};

const contextBar = {
  margin: "12px 24px 0",
  padding: "14px",
  borderRadius: "16px",
  background: "linear-gradient(180deg, rgba(10,24,54,0.92), rgba(8,18,42,0.96))",
  border: "1px solid rgba(255,255,255,0.06)"
};

const contextBarHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px"
};

const contextBarTitle = {
  fontWeight: 800,
  fontSize: "16px"
};

const contextCloseBtn = {
  border: "none",
  background: "transparent",
  color: "#8ea4d2",
  fontSize: "22px",
  cursor: "pointer"
};

const contextGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "12px"
};

const contextInput = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "white",
  outline: "none"
};

const saveContextBtn = {
  border: "none",
  borderRadius: "12px",
  background: "linear-gradient(90deg, #2a9cff, #3d7dff)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer"
};

const contentArea = {
  flex: 1,
  width: "100%",
  padding: "14px 24px 92px",
  boxSizing: "border-box"
};


const emptyStateWrap = {
  width: "100%",
  maxWidth: "980px",
  margin: "18px auto 0",
  textAlign: "center"
};

const brandIconWrap = {
  position: "relative",
  width: "68px",
  height: "68px",
  margin: "0 auto 12px"
};

const brandIconGlow = {
  position: "absolute",
  inset: 0,
  borderRadius: "24px",
  background: "radial-gradient(circle, rgba(52,144,255,0.36), transparent 68%)",
  filter: "blur(10px)"
};

const brandIcon = {
  position: "relative",
  width: "68px",
  height: "68px",
  borderRadius: "20px",
  display: "grid",
  placeItems: "center",
  fontSize: "28px",
  background: "linear-gradient(180deg, #33c7ff, #2f88ff)"
};

const emptyTitle = {
  fontSize: "46px",
  margin: "0 0 10px"
};

const emptySubtitle = {
  maxWidth: "760px",
  margin: "0 auto 22px",
  color: "#9ab0da",
  lineHeight: 1.55,
  fontSize: "17px"
};

const quickSearchTitle = {
  color: "#7e95c8",
  fontSize: "12px",
  letterSpacing: "1px",
  textTransform: "uppercase",
  marginBottom: "12px"
};

const quickPromptGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
  maxWidth: "626px",
  margin: "0 auto",
  width: "100%"
};

const quickPromptBtn = {
  minHeight: "66px",
  padding: "0 20px",
  borderRadius: "10px",
  border: "1px solid rgba(72,105,148,0.35)",
  background: "rgba(17,35,59,0.92)",
  color: "#9fb0cc",
  cursor: "pointer",
  textAlign: "left",
  fontWeight: 700,
  fontSize: "16px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  boxShadow: "inset 0 0 0 1px rgba(5,12,24,0.35)"
};

const quickPromptIcon = {
  width: "28px",
  flex: "0 0 28px",
  display: "inline-grid",
  placeItems: "center",
  fontSize: "23px",
  lineHeight: 1
};

const quickSourcePills = {
  display: "flex",
  justifyContent: "center",
  gap: "8px",
  flexWrap: "wrap",
  maxWidth: "626px",
  margin: "34px auto 0"
};

const quickSourcePill = {
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(17,35,59,0.92)",
  border: "1px solid rgba(72,105,148,0.28)",
  color: "#60718d",
  fontSize: "12px",
  fontWeight: 700
};

const pipelineCard = {
  maxWidth: "980px",
  margin: "24px auto 0",
  borderRadius: "20px",
  background: "linear-gradient(180deg, rgba(12,30,64,0.96), rgba(10,24,52,0.98))",
  border: "1px solid rgba(255,255,255,0.07)",
  padding: "18px 18px 20px"
};

const pipelineHeaderRow = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginBottom: "16px"
};

const pipelineAvatar = {
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, #33c7ff, #2f88ff)"
};

const pipelineTitle = {
  color: "#4da5ff",
  fontSize: "14px",
  fontWeight: 800,
  letterSpacing: "1px"
};

const progressBarWrap = {
  height: "4px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  marginTop: "10px",
  overflow: "hidden"
};

const progressBar = {
  height: "100%",
  background: "linear-gradient(90deg, #2f8fff, #4bd6ff)"
};

const progressText = {
  color: "#8aa3d2",
  fontSize: "13px",
  fontWeight: 700
};

const pipelineLogWrap = {
  background: "rgba(255,255,255,0.02)",
  borderRadius: "16px",
  padding: "16px"
};

const pipelineLogLine = {
  display: "flex",
  gap: "10px",
  color: "#d9e8ff",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "14px",
  marginBottom: "10px"
};

const pipelineDot = {
  color: "#3da2ff"
};

const pipelineMuted = {
  color: "#7e95c8",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
};

const resultsWrap = {
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto"
};

const queryBubbleWrap = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "10px",
  marginBottom: "16px"
};

const queryBubble = {
  maxWidth: "70%",
  padding: "16px 18px",
  borderRadius: "18px",
  background: "linear-gradient(180deg, rgba(18,39,80,0.96), rgba(14,31,64,0.96))",
  border: "1px solid rgba(255,255,255,0.07)",
  fontWeight: 600
};

const userMiniAvatar = {
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.05)"
};

const errorBanner = {
  marginBottom: "16px",
  padding: "14px 16px",
  borderRadius: "14px",
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.25)",
  color: "#fca5a5"
};

const workspaceCard = {
  borderRadius: "22px",
  background: "linear-gradient(180deg, rgba(12,27,58,0.98), rgba(9,19,41,0.98))",
  border: "1px solid rgba(255,255,255,0.06)",
  overflow: "hidden"
};

const workspaceTopRow = {
  display: "flex",
  gap: "14px",
  alignItems: "center",
  padding: "16px 18px 0"
};

const assistantMiniAvatar = {
  width: "38px",
  height: "38px",
  borderRadius: "12px",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, #33c7ff, #2f88ff)"
};

const tabsWrap = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  width: "100%"
};

const tabBtn = {
  padding: "12px 12px 14px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

const tabBadge = {
  minWidth: "22px",
  height: "22px",
  borderRadius: "999px",
  background: "rgba(77,165,255,0.16)",
  color: "#55a9ff",
  display: "grid",
  placeItems: "center",
  fontSize: "12px",
  fontWeight: 800,
  padding: "0 6px"
};

const tabBody = {
  padding: "18px"
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(280px, 1fr))",
  gap: "14px"
};

const evidenceCard = {
  display: "block",
  borderRadius: "18px",
  background: "linear-gradient(180deg, rgba(16,31,64,0.98), rgba(12,23,49,0.98))",
  border: "1px solid rgba(255,255,255,0.05)",
  padding: "16px"
};

const paperDetailGrid = {
  display: "grid",
  gap: "10px",
  marginTop: "4px",
  marginBottom: "14px",
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.05)"
};

const paperDetailRow = {
  display: "grid",
  gridTemplateColumns: "90px 1fr",
  gap: "12px",
  alignItems: "start"
};

const paperDetailLabel = {
  color: "#7f95c8",
  fontSize: "13px",
  fontWeight: 700
};

const paperDetailValue = {
  color: "#dbe7ff",
  fontSize: "14px",
  lineHeight: 1.6,
  wordBreak: "break-word"
};

const paperActionBtn = {
  display: "inline-block",
  marginTop: "4px",
  padding: "10px 14px",
  borderRadius: "12px",
  background: "linear-gradient(90deg, #2a9cff, #3d7dff)",
  color: "white",
  fontWeight: 700,
  textDecoration: "none"
};

const emptyTabState = {
  color: "#7f95c8",
  padding: "12px"
};

const composerDock = {
  position: "fixed",
  left: "300px",
  right: "0",
  bottom: 0,
  padding: "10px 24px 12px",
  background: "linear-gradient(180deg, rgba(4,14,33,0), rgba(4,14,33,0.98) 22%)",
  backdropFilter: "blur(8px)",
  zIndex: 30,
  boxSizing: "border-box",
  overflowX: "hidden"
};

const composerInner = {
  width: "100%",
  maxWidth: "980px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr 48px 48px 48px",
  gap: "8px",
  alignItems: "center",
  background: "linear-gradient(180deg, rgba(11,24,52,0.96), rgba(8,19,41,0.98))",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "18px",
  padding: "8px"
};

const composerInput = {
  width: "100%",
  background: "transparent",
  border: "none",
  outline: "none",
  color: "white",
  fontSize: "16px",
  padding: "10px 12px"
};

const composerIconBtn = {
  width: "44px",
  height: "44px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.03)",
  color: "#9cc5ff",
  cursor: "pointer",
  display: "grid",
  placeItems: "center"
};

const voiceMicIcon = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  width: "24px",
  height: "24px"
};

const voiceMicBar = {
  width: "3px",
  borderRadius: "999px",
  background: "#ffffff",
  display: "block"
};

const composerSendBtn = {
  width: "44px",
  height: "44px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(180deg, #2f8fff, #47b0ff)",
  color: "white",
  cursor: "pointer",
  fontWeight: 800
};

const disclaimer = {
  textAlign: "center",
  color: "#6f87b6",
  fontSize: "12px",
  marginTop: "8px"
};

const voiceOverlay = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  background: "rgba(3, 4, 10, 0.98)",
  display: "grid",
  placeItems: "center",
  color: "white"
};

const voiceCloseBtn = {
  position: "fixed",
  top: "22px",
  right: "24px",
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "#cfd8ea",
  fontSize: "24px",
  cursor: "pointer"
};

const voiceOrbWrap = {
  position: "absolute",
  top: "24%",
  left: "50%",
  transform: "translateX(-50%)",
  width: "220px",
  height: "220px",
  display: "grid",
  placeItems: "center"
};

const voiceOrb = {
  position: "relative",
  width: "160px",
  height: "160px",
  borderRadius: "999px",
  filter: "drop-shadow(0 0 28px rgba(104, 225, 215, 0.18))"
};

const voiceParticle = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "5px",
  height: "5px",
  borderRadius: "999px",
  background: "#8ce9dd",
  boxShadow: "0 0 10px rgba(140,233,221,0.7)",
  transition: "opacity 0.2s ease"
};

const voiceStatusPill = {
  position: "absolute",
  bottom: "104px",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 16px",
  borderRadius: "999px",
  border: "1px solid rgba(143, 230, 208, 0.18)",
  background: "rgba(24, 42, 38, 0.82)",
  color: "#bdebe1",
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase"
};

const voiceStatusDot = {
  width: "7px",
  height: "7px",
  borderRadius: "999px",
  background: "#9bf4df",
  boxShadow: "0 0 12px rgba(155,244,223,0.75)"
};

const voiceTextWrap = {
  position: "absolute",
  bottom: "154px",
  left: "50%",
  transform: "translateX(-50%)",
  width: "min(680px, calc(100vw - 48px))",
  textAlign: "center"
};

const voiceReplyText = {
  color: "#eef6ff",
  fontSize: "22px",
  lineHeight: 1.5,
  fontWeight: 700
};

const voiceTranscriptText = {
  color: "#8ca1c4",
  fontSize: "15px",
  marginTop: "14px"
};

const voiceListenBtn = {
  position: "absolute",
  bottom: "44px",
  left: "50%",
  transform: "translateX(-50%)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.05)",
  color: "#dce8ff",
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 800
};

const analysisPremiumWrap = {
  display: "grid",
  gap: "18px"
};

const analysisHeroCard = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "22px",
  padding: "22px",
  background:
    "linear-gradient(135deg, rgba(28,63,125,0.55), rgba(15,29,64,0.82) 45%, rgba(17,43,91,0.72))",
  border: "1px solid rgba(106,162,255,0.14)",
  boxShadow: "0 18px 40px rgba(3, 10, 28, 0.26)"
};

const analysisHeroGlow = {
  position: "absolute",
  top: "-40px",
  right: "-40px",
  width: "180px",
  height: "180px",
  borderRadius: "999px",
  background: "radial-gradient(circle, rgba(74,170,255,0.18), transparent 68%)",
  pointerEvents: "none"
};

const analysisHeroContent = {
  position: "relative",
  zIndex: 2
};

const analysisHeroTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
  flexWrap: "wrap",
  marginBottom: "18px"
};

const analysisEyebrow = {
  color: "#76b8ff",
  fontSize: "12px",
  letterSpacing: "1px",
  textTransform: "uppercase",
  fontWeight: 800,
  marginBottom: "8px"
};

const analysisHeroTitle = {
  fontSize: "28px",
  lineHeight: 1.3,
  fontWeight: 800,
  color: "#f4f8ff",
  maxWidth: "760px"
};

const analysisConfidencePill = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#dce8ff",
  fontWeight: 700,
  fontSize: "13px"
};

const analysisConfidenceDot = {
  width: "10px",
  height: "10px",
  borderRadius: "999px",
  background: "linear-gradient(180deg, #45d6ff, #3f92ff)",
  boxShadow: "0 0 14px rgba(69,214,255,0.55)"
};

const analysisStatsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
  gap: "12px"
};

const analysisMiniStat = {
  borderRadius: "16px",
  padding: "14px 16px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.06)"
};

const analysisMiniStatValue = {
  fontSize: "28px",
  fontWeight: 800,
  color: "#ffffff",
  marginBottom: "4px"
};

const analysisMiniStatLabel = {
  fontSize: "12px",
  color: "#8ea8d8",
  textTransform: "uppercase",
  letterSpacing: "0.8px"
};

const analysisPremiumGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(280px, 1fr))",
  gap: "16px"
};

const analysisGlassCard = {
  borderRadius: "20px",
  padding: "20px",
  background:
    "linear-gradient(180deg, rgba(17,35,73,0.84), rgba(11,24,52,0.96))",
  border: "1px solid rgba(106,162,255,0.10)",
  boxShadow: "0 12px 28px rgba(2, 8, 24, 0.22)"
};

const oneLineAnswerCard = {
  borderRadius: "20px",
  padding: "20px",
  background: "linear-gradient(180deg, rgba(18,45,88,0.88), rgba(11,24,52,0.96))",
  border: "1px solid rgba(86,183,255,0.18)",
  boxShadow: "0 14px 32px rgba(2, 8, 24, 0.24)"
};

const oneLineAnswerLabel = {
  color: "#7cbcff",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "1px",
  fontWeight: 800,
  marginBottom: "8px"
};

const oneLineAnswerText = {
  color: "#eef6ff",
  fontSize: "17px",
  lineHeight: 1.6,
  fontWeight: 700
};

const analysisCardIcon = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  display: "grid",
  placeItems: "center",
  marginBottom: "14px",
  color: "#8fd0ff",
  fontWeight: 800,
  fontSize: "18px",
  background: "linear-gradient(180deg, rgba(63,146,255,0.20), rgba(48,104,196,0.10))",
  border: "1px solid rgba(111,177,255,0.12)"
};

const analysisCardTitle = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#f4f8ff",
  marginBottom: "10px"
};

const analysisCardText = {
  color: "#cfe0ff",
  lineHeight: 1.8,
  fontSize: "15px"
};

const analysisQueryCard = {
  borderRadius: "20px",
  padding: "20px",
  background: "linear-gradient(180deg, rgba(17,35,73,0.84), rgba(11,24,52,0.96))",
  border: "1px solid rgba(106,162,255,0.10)",
  boxShadow: "0 12px 28px rgba(2, 8, 24, 0.22)"
};

const analysisQueryList = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px"
};

const analysisQueryLink = {
  border: "1px solid rgba(86,183,255,0.22)",
  borderRadius: "999px",
  background: "rgba(86,183,255,0.10)",
  color: "#9bd2ff",
  cursor: "pointer",
  padding: "9px 12px",
  fontSize: "13px",
  fontWeight: 700,
  textAlign: "left"
};

const premiumAnalyticsWrap = {
  display: "grid",
  gap: "18px"
};

const analyticsHeroCard = {
  position: "relative",
  overflow: "hidden",
  borderRadius: "22px",
  padding: "22px",
  background:
    "linear-gradient(135deg, rgba(23,49,98,0.72), rgba(15,28,61,0.92) 46%, rgba(27,39,92,0.78))",
  border: "1px solid rgba(92,144,255,0.12)",
  boxShadow: "0 16px 34px rgba(2, 8, 24, 0.22)"
};

const analyticsHeroGlow = {
  position: "absolute",
  top: "-60px",
  right: "-40px",
  width: "220px",
  height: "220px",
  borderRadius: "999px",
  background: "radial-gradient(circle, rgba(86,183,255,0.16), transparent 70%)",
  pointerEvents: "none"
};

const analyticsHeroContent = {
  position: "relative",
  zIndex: 2
};

const analyticsHeroTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
  alignItems: "flex-start",
  marginBottom: "18px"
};

const analyticsEyebrow = {
  color: "#7cbcff",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "1px",
  fontWeight: 800,
  marginBottom: "8px"
};

const analyticsHeroTitle = {
  fontSize: "30px",
  lineHeight: 1.25,
  fontWeight: 800,
  color: "#f5f8ff",
  marginBottom: "8px"
};

const analyticsHeroSubtitle = {
  color: "#a7bbdf",
  fontSize: "15px",
  lineHeight: 1.7,
  maxWidth: "720px"
};

const analyticsBadgeGroup = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap"
};

const analyticsBadgeBlue = {
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(86,183,255,0.12)",
  border: "1px solid rgba(86,183,255,0.18)",
  color: "#8fcfff",
  fontWeight: 700,
  fontSize: "13px"
};

const analyticsBadgeCyan = {
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(65,214,232,0.12)",
  border: "1px solid rgba(65,214,232,0.18)",
  color: "#84ebf5",
  fontWeight: 700,
  fontSize: "13px"
};

const analyticsBadgePurple = {
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(154,130,255,0.12)",
  border: "1px solid rgba(154,130,255,0.18)",
  color: "#beafff",
  fontWeight: 700,
  fontSize: "13px"
};

const premiumPulseRow = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
  gap: "16px"
};

const signalOrbWrap = {
  borderRadius: "20px",
  padding: "18px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.05)",
  display: "grid",
  justifyItems: "center"
};

const signalOrbRing = {
  width: "128px",
  height: "128px",
  borderRadius: "999px",
  display: "grid",
  placeItems: "center",
  padding: "10px",
  marginBottom: "12px"
};

const signalOrbCore = {
  width: "100%",
  height: "100%",
  borderRadius: "999px",
  display: "grid",
  placeItems: "center",
  border: "1px solid rgba(255,255,255,0.06)",
  backdropFilter: "blur(8px)"
};

const signalOrbValue = {
  fontSize: "34px",
  fontWeight: 800,
  color: "#ffffff"
};

const signalOrbLabel = {
  fontSize: "16px",
  fontWeight: 700,
  color: "#eef4ff",
  marginBottom: "4px"
};

const signalOrbSubtext = {
  fontSize: "13px",
  color: "#8ea8d8"
};

const analyticsInsightGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
  gap: "14px"
};

const metricGlassCard = {
  borderRadius: "18px",
  background: "linear-gradient(180deg, rgba(18,35,72,0.82), rgba(11,22,48,0.96))",
  border: "1px solid rgba(255,255,255,0.05)",
  padding: "18px"
};

const metricGlassTitle = {
  color: "#90a7d4",
  fontSize: "13px",
  marginBottom: "10px"
};

const metricGlassValue = {
  fontSize: "34px",
  fontWeight: 800
};

const analyticsQueryCard = {
  borderRadius: "20px",
  padding: "18px",
  background: "linear-gradient(180deg, rgba(17,35,73,0.80), rgba(10,20,44,0.96))",
  border: "1px solid rgba(255,255,255,0.05)"
};

const analyticsQueryHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "14px",
  flexWrap: "wrap"
};

const analyticsQueryTitle = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#f4f8ff"
};

const analyticsQueryCount = {
  color: "#86bfff",
  fontSize: "13px",
  fontWeight: 700,
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(86,183,255,0.10)",
  border: "1px solid rgba(86,183,255,0.14)"
};

const analyticsQueryFlow = {
  display: "grid",
  gap: "12px"
};

const queryFlowItem = {
  display: "grid",
  gridTemplateColumns: "18px 1fr",
  gap: "12px",
  alignItems: "start",
  padding: "12px 14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.05)"
};

const queryFlowDot = {
  width: "12px",
  height: "12px",
  borderRadius: "999px",
  marginTop: "5px",
  background: "linear-gradient(180deg, #56b7ff, #41d6e8)",
  boxShadow: "0 0 12px rgba(86,183,255,0.45)"
};

const queryFlowText = {
  color: "#dce8ff",
  fontSize: "14px",
  lineHeight: 1.6,
  wordBreak: "break-word"
};

const queryFlowTextButton = {
  ...queryFlowText,
  width: "100%",
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  textAlign: "left",
  textDecoration: "underline",
  textDecorationColor: "rgba(134,191,255,0.45)",
  textUnderlineOffset: "3px"
};

const queryFlowEmpty = {
  color: "#87a1d2",
  fontSize: "14px"
};

export default App;
const loginPage = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, #020a18 0%, #041126 100%)",
  color: "white",
  fontFamily: "Inter, Arial, sans-serif",
  position: "relative",
  overflow: "hidden"
};

const loginGlowOne = {
  position: "fixed",
  width: "360px",
  height: "360px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(47,143,255,0.18), transparent 70%)",
  top: "18%",
  left: "18%"
};

const loginGlowTwo = {
  position: "fixed",
  width: "420px",
  height: "420px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(154,130,255,0.14), transparent 70%)",
  bottom: "10%",
  right: "14%"
};

const loginCard = {
  width: "420px",
  padding: "34px",
  borderRadius: "26px",
  background: "linear-gradient(180deg, rgba(12,30,64,0.96), rgba(8,18,42,0.98))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 28px 70px rgba(0,0,0,0.35)",
  textAlign: "center",
  zIndex: 2
};

const loginLogo = {
  width: "76px",
  height: "76px",
  borderRadius: "22px",
  margin: "0 auto 18px",
  display: "grid",
  placeItems: "center",
  fontSize: "34px",
  background: "linear-gradient(180deg, #33c7ff, #2f88ff)",
  boxShadow: "0 0 34px rgba(47,143,255,0.32)"
};

const loginTitle = {
  fontSize: "34px",
  margin: "0 0 10px",
  fontWeight: 800
};

const loginSubtitle = {
  color: "#9ab0da",
  lineHeight: 1.6,
  marginBottom: "24px"
};

const loginInput = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px 16px",
  marginBottom: "12px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  outline: "none",
  fontSize: "15px"
};

const loginButton = {
  width: "100%",
  padding: "15px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(90deg, #2a9cff, #3d7dff)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  marginTop: "8px"
};

const loginErrorText = {
  color: "#fca5a5",
  fontSize: "14px",
  marginBottom: "10px"
};

const loginHint = {
  marginTop: "16px",
  color: "#6f87b6",
  fontSize: "13px"
};
const loginSwitchWrap = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
  padding: "6px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  marginBottom: "18px"
};
const loginSwitchActive = {
  padding: "12px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg, #2a9cff, #3d7dff)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer"
};

const loginSwitchInactive = {
  padding: "12px",
  borderRadius: "12px",
  border: "none",
  background: "transparent",
  color: "#8ea8d8",
  fontWeight: 800,
  cursor: "pointer"
};

