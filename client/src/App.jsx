import { useRef, useState } from "react";
import { motion } from "framer-motion";

function App() {
  const [formData, setFormData] = useState({
    patientName: "",
    disease: "",
    query: "",
    location: ""
  });

  const [followUpMessage, setFollowUpMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [expandedQueries, setExpandedQueries] = useState([]);
  const [structuredResponse, setStructuredResponse] = useState(null);
  const [usedContext, setUsedContext] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [finalProcessedQuery, setFinalProcessedQuery] = useState("");

  const publicationsRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const runSearch = async (payload, userMessage) => {
    try {
      const response = await fetch("http://localhost:5000/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      setResponseMessage(data.message);
      setSessionId(data.sessionId || "");
      setExpandedQueries(data.expandedQueries || []);
      setStructuredResponse(data.structuredResponse || null);
      setUsedContext(data.usedContext || null);
      setFinalProcessedQuery(data.finalProcessedQuery || data.usedContext?.query || "");

      const assistantMessage =
        data.structuredResponse?.researchInsights || "No response generated.";

      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "assistant", content: assistantMessage }
      ]);

      setTimeout(() => {
        publicationsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 250);
    } catch (error) {
      console.error("Error:", error);
      setResponseMessage("Failed to send data to backend");
    }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();

    const userMessage = `Patient: ${formData.patientName || "N/A"}, Disease: ${
      formData.disease || "N/A"
    }, Query: ${formData.query || "N/A"}, Location: ${formData.location || "N/A"}`;

    await runSearch(
      {
        sessionId,
        ...formData
      },
      userMessage
    );
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    if (!followUpMessage.trim()) return;

    const currentFollowUp = followUpMessage.trim();

    await runSearch(
      {
        sessionId,
        patientName: formData.patientName,
        disease: "",
        query: "",
        location: "",
        followUpMessage: currentFollowUp
      },
      currentFollowUp
    );

    setFollowUpMessage("");
  };

  const scrollToPublications = () => {
    publicationsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={pageStyle}>
      <div style={bgOrbOne} />
      <div style={bgOrbTwo} />
      <div style={bgGrid} />

      <motion.section
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={heroWrap}
      >
        <div style={heroLeft}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={miniBadge}
          >
            Premium Medical Intelligence Workspace
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            style={heroTitle}
          >
            Research-grade medical discovery with premium evidence visualization.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={heroSubtitle}
          >
            CuraLink transforms condition-specific questions into ranked publications,
            clinical trial signals, follow-up memory, and structured research summaries.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            style={heroActions}
          >
            <button style={primaryHeroBtn} onClick={scrollToPublications}>
              Explore Publications
            </button>
            <button
              style={secondaryHeroBtn}
              onClick={() =>
                window.scrollTo({
                  top: 680,
                  behavior: "smooth"
                })
              }
            >
              Start Search
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            style={heroStats}
          >
            <div style={heroStatCard}>
              <div style={heroStatValue}>
                {structuredResponse?.retrievalStats?.openAlexRetrieved ?? "—"}
              </div>
              <div style={heroStatLabel}>OpenAlex</div>
            </div>
            <div style={heroStatCard}>
              <div style={heroStatValue}>
                {structuredResponse?.retrievalStats?.pubmedRetrieved ?? "—"}
              </div>
              <div style={heroStatLabel}>PubMed</div>
            </div>
            <div style={heroStatCard}>
              <div style={heroStatValue}>
                {structuredResponse?.retrievalStats?.clinicalTrialsRetrieved ?? "—"}
              </div>
              <div style={heroStatLabel}>Trials</div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18, duration: 0.7 }}
          style={heroRight}
        >
          <div style={premiumPanel}>
            <div style={premiumPanelTop}>
              <div style={tinyDots}>
                <span style={dotPink} />
                <span style={dotBlue} />
                <span style={dotGreen} />
              </div>
              <div style={topLabel}>Live Research Dashboard</div>
            </div>

            <div style={reportHeadline}>Clinical Evidence Sheet</div>

            <div style={reportRows}>
              <div style={reportRow}>
                <span style={reportKey}>Condition</span>
                <span style={reportVal}>{formData.disease || "Awaiting selection"}</span>
              </div>
              <div style={reportRow}>
                <span style={reportKey}>Topic</span>
                <span style={reportVal}>{formData.query || "Awaiting selection"}</span>
              </div>
              <div style={reportRow}>
                <span style={reportKey}>Location</span>
                <span style={reportVal}>{formData.location || "Optional"}</span>
              </div>
              <div style={reportRow}>
                <span style={reportKey}>Session</span>
                <span style={reportVal}>{sessionId ? "Active" : "New"}</span>
              </div>
            </div>

            <div style={analyticsWrap}>
              <motion.div
                animate={{ height: [48, 88, 64, 110, 72] }}
                transition={{ duration: 4, repeat: Infinity }}
                style={barOne}
              />
              <motion.div
                animate={{ height: [78, 52, 100, 68, 84] }}
                transition={{ duration: 3.5, repeat: Infinity }}
                style={barTwo}
              />
              <motion.div
                animate={{ height: [58, 108, 70, 92, 60] }}
                transition={{ duration: 4.2, repeat: Infinity }}
                style={barThree}
              />
              <motion.div
                animate={{ height: [92, 60, 80, 120, 76] }}
                transition={{ duration: 3.8, repeat: Infinity }}
                style={barFour}
              />
            </div>

            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.2, repeat: Infinity }}
              style={smartIndicator}
            >
              Structured answers guide you to the publication sections below
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      <motion.form
        onSubmit={handleInitialSubmit}
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={searchCard}
      >
        <div style={cardHeaderRow}>
          <div>
            <div style={cardEyebrow}>Search Intake</div>
            <h2 style={cardTitle}>Start a New Research Run</h2>
          </div>
          <div style={statusPill}>{sessionId ? "Session Active" : "Ready"}</div>
        </div>

        <div style={inputGrid}>
          <input
            type="text"
            name="patientName"
            placeholder="Patient Name"
            value={formData.patientName}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            type="text"
            name="disease"
            placeholder="Disease of Interest"
            value={formData.disease}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            type="text"
            name="query"
            placeholder="Additional Query / Treatment / Supplement"
            value={formData.query}
            onChange={handleChange}
            style={inputStyle}
          />
          <input
            type="text"
            name="location"
            placeholder="Location (Optional)"
            value={formData.location}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <button type="submit" style={primaryFullBtn}>
          Launch Research Workflow
        </button>

        {responseMessage && (
          <div style={successBanner}>
            {responseMessage}
          </div>
        )}
      </motion.form>

      {sessionId && (
        <div style={glassCard}>
          <div style={cardHeaderRow}>
            <div>
              <div style={cardEyebrow}>Memory</div>
              <h2 style={cardTitle}>Session Memory</h2>
            </div>
          </div>
          <p><strong>Session ID:</strong> {sessionId}</p>
        </div>
      )}

      {usedContext && (
        <div style={glassCard}>
          <div style={cardHeaderRow}>
            <div>
              <div style={cardEyebrow}>Context</div>
              <h2 style={cardTitle}>Context Used For Current Search</h2>
            </div>
          </div>
          <div style={detailsGrid}>
            <div style={detailTile}>
              <span style={detailLabel}>Disease</span>
              <span style={detailValue}>{usedContext.disease || "N/A"}</span>
            </div>
            <div style={detailTile}>
              <span style={detailLabel}>Query</span>
              <span style={detailValue}>{usedContext.query || "N/A"}</span>
            </div>
            <div style={detailTile}>
              <span style={detailLabel}>Location</span>
              <span style={detailValue}>{usedContext.location || "N/A"}</span>
            </div>
          </div>
        </div>
      )}

      {finalProcessedQuery && (
        <div style={glassCard}>
          <div style={cardEyebrow}>Processed Query</div>
          <h2 style={cardTitle}>Final Query Sent to Retrieval</h2>
          <p style={highlightText}>{finalProcessedQuery}</p>
        </div>
      )}

      {chatHistory.length > 0 && (
        <div style={glassCard}>
          <div style={cardEyebrow}>Conversation</div>
          <h2 style={cardTitle}>Research Dialogue</h2>
          {chatHistory.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                ...chatBubble,
                background:
                  msg.role === "user"
                    ? "linear-gradient(180deg, rgba(42,62,104,0.95), rgba(29,45,78,0.95))"
                    : "linear-gradient(180deg, rgba(11,25,54,0.95), rgba(9,18,39,0.95))"
              }}
            >
              <div style={chatRole}>
                {msg.role === "user" ? "User" : "Assistant"}
              </div>
              <div style={chatText}>{msg.content}</div>
            </motion.div>
          ))}
        </div>
      )}

      {sessionId && (
        <form
          onSubmit={handleFollowUpSubmit}
          style={glassCard}
        >
          <div style={cardHeaderRow}>
            <div>
              <div style={cardEyebrow}>Follow-up</div>
              <h2 style={cardTitle}>Continue the Research Conversation</h2>
            </div>
          </div>
          <input
            type="text"
            placeholder='Example: "Can I take Vitamin D?"'
            value={followUpMessage}
            onChange={(e) => setFollowUpMessage(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" style={primaryFullBtn}>
            Ask Follow-up Question
          </button>
        </form>
      )}

      {structuredResponse?.retrievalStats && (
        <div style={glassCard}>
          <div style={cardEyebrow}>Analytics</div>
          <h2 style={cardTitle}>Retrieval Summary</h2>
          <div style={statsGrid}>
            <Stat title="OpenAlex Retrieved" value={structuredResponse.retrievalStats.openAlexRetrieved} />
            <Stat title="PubMed Retrieved" value={structuredResponse.retrievalStats.pubmedRetrieved} />
            <Stat title="Trials Retrieved" value={structuredResponse.retrievalStats.clinicalTrialsRetrieved} />
            <Stat title="OpenAlex Shown" value={structuredResponse.retrievalStats.openAlexShown} />
            <Stat title="PubMed Shown" value={structuredResponse.retrievalStats.pubmedShown} />
            <Stat title="Trials Shown" value={structuredResponse.retrievalStats.clinicalTrialsShown} />
          </div>
        </div>
      )}

      {structuredResponse && (
        <>
          <InsightCard
            eyebrow="Summary"
            title="Condition Overview"
            content={structuredResponse.conditionOverview}
          />
          <InsightCard
            eyebrow="Insights"
            title="Research Insights"
            content={structuredResponse.researchInsights}
          />
          <InsightCard
            eyebrow="Trials"
            title="Clinical Trial Signals"
            content={structuredResponse.clinicalTrialSignals}
          />
          <InsightCard
            eyebrow="Safety"
            title="Safety Note"
            content={structuredResponse.safetyNote}
          />

          <div ref={publicationsRef} style={glassCard}>
            <div style={cardEyebrow}>Publications</div>
            <h2 style={cardTitle}>Top OpenAlex Publications</h2>
            {structuredResponse.publications?.length > 0 ? (
              structuredResponse.publications.map((pub, index) => (
                <ResultCard
                  key={pub.id || index}
                  title={pub.title}
                  meta={[
                    ["Authors", pub.authors?.join(", ") || "N/A"],
                    ["Year", pub.year],
                    ["Platform", pub.source],
                    ["Score", pub.score]
                  ]}
                  url={pub.url}
                  urlLabel="Open Paper"
                />
              ))
            ) : (
              <p>No OpenAlex publications found.</p>
            )}
          </div>

          <div style={glassCard}>
            <div style={cardEyebrow}>Publications</div>
            <h2 style={cardTitle}>Top PubMed Publications</h2>
            {structuredResponse.pubmedPublications?.length > 0 ? (
              structuredResponse.pubmedPublications.map((pub, index) => (
                <ResultCard
                  key={pub.id || index}
                  title={pub.title}
                  meta={[
                    ["Authors", pub.authors?.join(", ") || "N/A"],
                    ["Year", pub.year],
                    ["Platform", pub.source],
                    ["Score", pub.score]
                  ]}
                  url={pub.url}
                  urlLabel="Open Publication"
                />
              ))
            ) : (
              <p>No PubMed publications found.</p>
            )}
          </div>

          <div style={glassCard}>
            <div style={cardEyebrow}>Trials</div>
            <h2 style={cardTitle}>Top Clinical Trials</h2>
            {structuredResponse.clinicalTrials?.length > 0 ? (
              structuredResponse.clinicalTrials.map((trial, index) => (
                <ResultCard
                  key={trial.id || index}
                  title={trial.title}
                  meta={[
                    ["Status", trial.status],
                    ["Phase", trial.phase],
                    ["Condition", trial.condition?.join(", ") || "N/A"],
                    ["Intervention", trial.intervention?.join(", ") || "N/A"],
                    ["Location", trial.location || "N/A"],
                    ["Platform", trial.source],
                    ["Score", trial.score]
                  ]}
                  url={trial.url}
                  urlLabel="Open Trial"
                />
              ))
            ) : (
              <p>No clinical trials found.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div style={statCard}>
      <div style={statTitle}>{title}</div>
      <div style={statNumber}>{value}</div>
    </div>
  );
}

function InsightCard({ eyebrow, title, content }) {
  return (
    <div style={glassCard}>
      <div style={cardEyebrow}>{eyebrow}</div>
      <h2 style={cardTitle}>{title}</h2>
      <p style={{ lineHeight: 1.7, color: "#dce8ff" }}>{content}</p>
    </div>
  );
}

function ResultCard({ title, meta, url, urlLabel }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.18 }}
      style={resultCard}
    >
      <h3 style={resultTitle}>{title}</h3>
      <div style={resultMetaGrid}>
        {meta.map(([label, value], index) => (
          <div key={index} style={resultMetaTile}>
            <div style={resultMetaLabel}>{label}</div>
            <div style={resultMetaValue}>{value}</div>
          </div>
        ))}
      </div>
      <a href={url} target="_blank" rel="noreferrer" style={resultLink}>
        {urlLabel}
      </a>
    </motion.div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #050b1c 0%, #07112b 100%)",
  color: "white",
  padding: "32px 20px 60px",
  fontFamily: "Inter, Arial, sans-serif",
  position: "relative",
  overflow: "hidden"
};

const bgOrbOne = {
  position: "fixed",
  left: "-120px",
  top: "120px",
  width: "340px",
  height: "340px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(114,92,255,0.22), transparent 70%)",
  pointerEvents: "none",
  filter: "blur(4px)"
};

const bgOrbTwo = {
  position: "fixed",
  right: "-100px",
  top: "40px",
  width: "360px",
  height: "360px",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(56,189,248,0.18), transparent 70%)",
  pointerEvents: "none",
  filter: "blur(4px)"
};

const bgGrid = {
  position: "fixed",
  inset: 0,
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
  backgroundSize: "34px 34px",
  pointerEvents: "none",
  maskImage: "radial-gradient(circle at center, black 45%, transparent 95%)"
};

const heroWrap = {
  maxWidth: "1240px",
  margin: "0 auto 28px",
  display: "grid",
  gridTemplateColumns: "1.05fr 0.95fr",
  gap: "26px",
  alignItems: "center"
};

const heroLeft = {
  display: "flex",
  flexDirection: "column",
  gap: "18px"
};

const heroRight = {
  display: "flex",
  justifyContent: "center"
};

const miniBadge = {
  width: "fit-content",
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(112,99,255,0.14)",
  border: "1px solid rgba(141,132,255,0.24)",
  color: "#c8c5ff",
  fontSize: "13px",
  fontWeight: 600
};

const heroTitle = {
  margin: 0,
  fontSize: "60px",
  lineHeight: 1.02,
  letterSpacing: "-1.6px",
  maxWidth: "740px"
};

const heroSubtitle = {
  margin: 0,
  color: "#bed0f7",
  lineHeight: 1.7,
  fontSize: "18px",
  maxWidth: "700px"
};

const heroActions = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap"
};

const primaryHeroBtn = {
  padding: "14px 18px",
  border: "none",
  borderRadius: "14px",
  background: "linear-gradient(90deg, #6c5cff, #7b6bff)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 16px 40px rgba(92,77,255,0.28)"
};

const secondaryHeroBtn = {
  padding: "14px 18px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer"
};

const heroStats = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
  gap: "12px",
  maxWidth: "640px"
};

const heroStatCard = {
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
  padding: "16px",
  backdropFilter: "blur(10px)"
};

const heroStatValue = {
  fontSize: "28px",
  fontWeight: 800,
  marginBottom: "6px"
};

const heroStatLabel = {
  color: "#aebfe8",
  fontSize: "13px"
};

const premiumPanel = {
  width: "100%",
  minHeight: "470px",
  borderRadius: "28px",
  background:
    "linear-gradient(180deg, rgba(16,26,58,0.95), rgba(8,15,34,0.96))",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.34)",
  padding: "22px",
  position: "relative",
  overflow: "hidden"
};

const premiumPanelTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "18px"
};

const tinyDots = {
  display: "flex",
  gap: "8px"
};

const dotPink = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "#fb7185"
};

const dotBlue = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "#60a5fa"
};

const dotGreen = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "#34d399"
};

const topLabel = {
  color: "#9ab4ea",
  fontSize: "13px",
  fontWeight: 600
};

const reportHeadline = {
  fontSize: "28px",
  fontWeight: 800,
  marginBottom: "18px"
};

const reportRows = {
  display: "grid",
  gap: "12px"
};

const reportRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  padding: "14px 16px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: "16px"
};

const reportKey = {
  color: "#9db2e6",
  fontWeight: 600
};

const reportVal = {
  color: "white",
  fontWeight: 700,
  textAlign: "right"
};

const analyticsWrap = {
  marginTop: "28px",
  height: "140px",
  display: "flex",
  alignItems: "flex-end",
  gap: "16px"
};

const barOne = {
  width: "18%",
  borderRadius: "16px 16px 4px 4px",
  background: "linear-gradient(180deg, #6c5cff, #8b80ff)"
};

const barTwo = {
  width: "18%",
  borderRadius: "16px 16px 4px 4px",
  background: "linear-gradient(180deg, #4ecdc4, #22c55e)"
};

const barThree = {
  width: "18%",
  borderRadius: "16px 16px 4px 4px",
  background: "linear-gradient(180deg, #60a5fa, #38bdf8)"
};

const barFour = {
  width: "18%",
  borderRadius: "16px 16px 4px 4px",
  background: "linear-gradient(180deg, #f472b6, #fb7185)"
};

const smartIndicator = {
  marginTop: "20px",
  fontSize: "14px",
  color: "#bdddff",
  fontWeight: 600
};

const searchCard = {
  maxWidth: "1240px",
  margin: "0 auto 20px",
  background: "rgba(16,26,58,0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
  padding: "26px",
  backdropFilter: "blur(18px)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.22)"
};

const glassCard = {
  maxWidth: "1240px",
  margin: "20px auto 0",
  background: "rgba(16,26,58,0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
  padding: "24px",
  backdropFilter: "blur(18px)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.18)"
};

const cardHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "10px",
  marginBottom: "16px"
};

const cardEyebrow = {
  color: "#8fb0ff",
  fontSize: "13px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "6px"
};

const cardTitle = {
  margin: 0,
  fontSize: "28px",
  letterSpacing: "-0.4px"
};

const statusPill = {
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(52,211,153,0.14)",
  color: "#86efac",
  fontWeight: 700,
  fontSize: "13px",
  border: "1px solid rgba(52,211,153,0.18)"
};

const inputGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
  gap: "14px",
  marginBottom: "16px"
};

const inputStyle = {
  padding: "15px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  fontSize: "15px",
  outline: "none",
  background: "rgba(36,52,86,0.9)",
  color: "white",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)"
};

const primaryFullBtn = {
  width: "100%",
  padding: "15px 18px",
  border: "none",
  borderRadius: "14px",
  background: "linear-gradient(90deg, #6c5cff, #7b6bff)",
  color: "white",
  fontWeight: 800,
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 18px 40px rgba(92,77,255,0.24)"
};

const successBanner = {
  marginTop: "12px",
  padding: "14px 16px",
  borderRadius: "14px",
  background: "rgba(52,211,153,0.10)",
  border: "1px solid rgba(52,211,153,0.20)",
  color: "#86efac",
  textAlign: "center",
  fontWeight: 700
};

const detailsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
  gap: "12px"
};

const detailTile = {
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "18px",
  padding: "16px"
};

const detailLabel = {
  display: "block",
  color: "#99b2e7",
  fontSize: "13px",
  marginBottom: "8px"
};

const detailValue = {
  fontWeight: 700,
  color: "white"
};

const highlightText = {
  fontSize: "18px",
  color: "#d8e5ff"
};

const chatBubble = {
  padding: "16px",
  borderRadius: "16px",
  marginBottom: "12px",
  border: "1px solid rgba(255,255,255,0.06)"
};

const chatRole = {
  color: "#9fc4ff",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "8px",
  textTransform: "uppercase",
  letterSpacing: "0.8px"
};

const chatText = {
  color: "#eef4ff",
  lineHeight: 1.7
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "14px"
};

const statCard = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "18px",
  padding: "16px"
};

const statTitle = {
  color: "#a6bae8",
  fontSize: "13px",
  marginBottom: "10px"
};

const statNumber = {
  fontSize: "28px",
  fontWeight: 800
};

const resultCard = {
  background: "linear-gradient(180deg, rgba(26,41,73,0.96), rgba(15,26,51,0.96))",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "20px",
  padding: "18px",
  marginBottom: "14px",
  boxShadow: "0 12px 30px rgba(0,0,0,0.16)"
};

const resultTitle = {
  marginTop: 0,
  marginBottom: "16px",
  fontSize: "22px"
};

const resultMetaGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  marginBottom: "14px"
};

const resultMetaTile = {
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: "14px",
  padding: "12px"
};

const resultMetaLabel = {
  color: "#9cb2e8",
  fontSize: "12px",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.7px"
};

const resultMetaValue = {
  color: "white",
  lineHeight: 1.55
};

const resultLink = {
  display: "inline-block",
  marginTop: "6px",
  color: "#7dd3fc",
  fontWeight: 700,
  textDecoration: "none"
};

export default App;