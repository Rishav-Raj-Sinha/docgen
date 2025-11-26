import React, { useState, useEffect } from "react";
import {
  FileText,
  Presentation,
  LogOut,
  Plus,
  Trash2,
  Download,
  Sparkles,
  RefreshCw,
  Edit2,
  Save,
  FolderOpen,
} from "lucide-react"; // Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3fEi2-k6yIIgL7ZsjkQ1FXmiLL8neUMw",
  authDomain: "docagent-29522.firebaseapp.com",
  projectId: "docagent-29522",
  storageBucket: "docagent-29522.firebasestorage.app",
  messagingSenderId: "855293591364",
  appId: "1:855293591364:web:3f69aa3a522b1baece2111",
  measurementId: "G-5PX0YK6WNP",
};

export default function AIDocumentGenerator() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");

  // Document generation states
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [outline, setOutline] = useState([
    { id: 1, title: "", description: "" },
  ]);
  const [generatedContent, setGeneratedContent] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize Firebase
  useEffect(() => {
    const loadFirebase = async () => {
      // Load Firebase App
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src =
          "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js";
        script.onload = resolve;
        document.body.appendChild(script);
      });

      // Load Firebase Auth
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src =
          "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js";
        script.onload = resolve;
        document.body.appendChild(script);
      });

      // Load Firebase Firestore
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src =
          "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js";
        script.onload = resolve;
        document.body.appendChild(script);
      });

      // Initialize Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      // Auth state listener
      firebase.auth().onAuthStateChanged((user) => {
        setUser(user);
        if (user) {
          loadSavedDocuments(user.uid);
        }
      });
    };

    loadFirebase();
  }, []);

  const loadSavedDocuments = async (userId) => {
    try {
      const db = firebase.firestore();
      const snapshot = await db
        .collection("documents")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSavedDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  const saveDocumentToFirebase = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const db = firebase.firestore();
      const docData = {
        userId: user.uid,
        docType,
        docTitle,
        outline,
        generatedContent,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("documents").add(docData);
      alert("Document saved successfully!");
      loadSavedDocuments(user.uid);
    } catch (error) {
      alert("Error saving document: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const loadDocument = (doc) => {
    setDocType(doc.docType);
    setDocTitle(doc.docTitle);
    setOutline(doc.outline);
    setGeneratedContent(doc.generatedContent);
    setStep(4);
    setShowSaved(false);
  };

  const deleteDocument = async (docId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const db = firebase.firestore();
      await db.collection("documents").doc(docId).delete();
      loadSavedDocuments(user.uid);
      alert("Document deleted successfully!");
    } catch (error) {
      alert("Error deleting document: " + error.message);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isSignUp) {
        await firebase.auth().createUserWithEmailAndPassword(email, password);
      } else {
        await firebase.auth().signInWithEmailAndPassword(email, password);
      }
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleSignOut = () => {
    firebase.auth().signOut();
    resetApp();
  };

  const resetApp = () => {
    setStep(1);
    setDocType("");
    setDocTitle("");
    setOutline([{ id: 1, title: "", description: "" }]);
    setGeneratedContent([]);
    setSelectedSection(null);
    setRefinementPrompt("");
    setShowSaved(false);
  };

  const addOutlineItem = () => {
    setOutline([...outline, { id: Date.now(), title: "", description: "" }]);
  };

  const removeOutlineItem = (id) => {
    setOutline(outline.filter((item) => item.id !== id));
  };

  const updateOutlineItem = (id, field, value) => {
    setOutline(
      outline.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const generateContent = async () => {
    if (!geminiKey) {
      alert("Please enter your Gemini API key first");
      return;
    }

    setIsGenerating(true);
    const newContent = [];

    try {
      for (const section of outline) {
        const prompt = `Generate detailed professional content for a ${docType} document.
Document Title: ${docTitle}
Section Title: ${section.title}
Section Description: ${section.description}

Please provide comprehensive, well-structured content (approximately 200-300 words) for this section. Format it professionally with clear paragraphs.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }],
                },
              ],
            }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message ||
              `HTTP error! status: ${response.status}`,
          );
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        const content =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Content generation failed - no content returned";

        newContent.push({
          id: section.id,
          title: section.title,
          content: content,
        });
      }

      setGeneratedContent(newContent);
      setStep(4);
    } catch (error) {
      console.error("Full error:", error);
      alert(
        "Error generating content: " +
          error.message +
          "\n\nPlease check:\n1. Your API key is valid\n2. You have API quota remaining\n3. The Gemini API is enabled in your Google Cloud project",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const refineSection = async () => {
    if (!refinementPrompt || !selectedSection) return;

    setIsGenerating(true);
    const section = generatedContent.find((s) => s.id === selectedSection);

    try {
      const prompt = `Refine the following content based on this instruction: "${refinementPrompt}"

Original Content:
${section.content}

Please provide the refined version maintaining professional quality.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const refinedContent =
        data.candidates?.[0]?.content?.parts?.[0]?.text || section.content;

      setGeneratedContent(
        generatedContent.map((s) =>
          s.id === selectedSection ? { ...s, content: refinedContent } : s,
        ),
      );
      setRefinementPrompt("");
    } catch (error) {
      console.error("Refinement error:", error);
      alert("Error refining content: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportAsDocx = async () => {
    setIsExporting(true);
    try {
      // Load docx library from CDN
      if (!window.docx) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/docx@7.8.2/build/index.js";
          script.onload = () => {
            // Wait a bit for the library to initialize
            setTimeout(resolve, 100);
          };
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const {
        Document,
        Paragraph,
        TextRun,
        HeadingLevel,
        AlignmentType,
        Packer,
      } = window.docx;

      const sections = generatedContent
        .map((section) => {
          const paragraphs = [
            new Paragraph({
              text: section.title,
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
          ];

          const contentParagraphs = section.content.split("\n\n").map(
            (text) =>
              new Paragraph({
                children: [new TextRun(text.trim())],
                spacing: { after: 200 },
              }),
          );

          return [...paragraphs, ...contentParagraphs];
        })
        .flat();

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: docTitle,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
              }),
              ...sections,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docTitle}.docx`;
      a.click();
      URL.revokeObjectURL(url);

      alert("Document exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Error exporting document: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPptx = async () => {
    setIsExporting(true);
    try {
      // Load PptxGenJS from CDN
      if (!window.PptxGenJS) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const pptx = new window.PptxGenJS();

      // Title slide
      const titleSlide = pptx.addSlide();
      titleSlide.addText(docTitle, {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 1.5,
        fontSize: 44,
        bold: true,
        align: "center",
        color: "363636",
      });

      // Content slides
      generatedContent.forEach((section) => {
        const slide = pptx.addSlide();

        slide.addText(section.title, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 0.8,
          fontSize: 32,
          bold: true,
          color: "363636",
        });

        const contentLines = section.content.split("\n\n");
        const bullets = contentLines.map((line) => ({
          text: line.trim(),
          options: { fontSize: 16, color: "555555" },
        }));

        slide.addText(bullets, {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 4.5,
          bullet: true,
          fontSize: 16,
        });
      });

      await pptx.writeFile({ fileName: `${docTitle}.pptx` });
      alert("Presentation exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Error exporting presentation: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };
  const exportDocument = () => {
    if (docType === "Word Document") {
      exportAsDocx();
    } else {
      exportAsPptx();
    }
  };

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "40px",
            maxWidth: "400px",
            width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <Sparkles size={48} color="#667eea" style={{ margin: "0 auto" }} />
            <h1
              style={{ margin: "15px 0 5px", fontSize: "28px", color: "#333" }}
            >
              AI Doc Agent
            </h1>
            <p style={{ color: "#666", fontSize: "14px" }}>
              Generate professional documents with AI
            </p>
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "15px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAuth(e)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "20px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />

            {authError && (
              <div
                style={{
                  background: "#fee",
                  color: "#c33",
                  padding: "10px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  marginBottom: "15px",
                }}
              >
                {authError}
              </div>
            )}

            <button
              onClick={handleAuth}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                marginBottom: "10px",
              }}
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>

            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                width: "100%",
                padding: "12px",
                background: "transparent",
                color: "#667eea",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Sparkles size={28} />
          <h1 style={{ margin: 0, fontSize: "24px" }}>AI Doc Agent</h1>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowSaved(!showSaved)}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            <FolderOpen size={18} />
            My Documents
          </button>
          <button
            onClick={handleSignOut}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}
      >
        {/* Saved Documents View */}
        {showSaved && (
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "40px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "30px",
              }}
            >
              <h2 style={{ margin: 0 }}>My Saved Documents</h2>
              <button
                onClick={() => setShowSaved(false)}
                style={{
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Create New
              </button>
            </div>

            {savedDocuments.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#666",
                  padding: "40px 0",
                }}
              >
                No saved documents yet. Create your first document!
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "20px",
                }}
              >
                {savedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "10px",
                      padding: "20px",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      position: "relative",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,0,0,0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.boxShadow = "none")
                    }
                  >
                    <div onClick={() => loadDocument(doc)}>
                      {doc.docType === "Word Document" ? (
                        <FileText
                          size={32}
                          color="#667eea"
                          style={{ marginBottom: "10px" }}
                        />
                      ) : (
                        <Presentation
                          size={32}
                          color="#667eea"
                          style={{ marginBottom: "10px" }}
                        />
                      )}
                      <h3 style={{ margin: "10px 0 5px", fontSize: "18px" }}>
                        {doc.docTitle}
                      </h3>
                      <p
                        style={{
                          color: "#666",
                          fontSize: "13px",
                          margin: "5px 0",
                        }}
                      >
                        {doc.docType} • {doc.generatedContent?.length || 0}{" "}
                        sections
                      </p>
                    </div>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      style={{
                        position: "absolute",
                        top: "15px",
                        right: "15px",
                        background: "#fee",
                        border: "none",
                        color: "#c33",
                        padding: "8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!showSaved && (
          <>
            {/* Progress Steps */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "40px",
                gap: "20px",
              }}
            >
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background:
                        step >= s
                          ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                          : "#e0e0e0",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "600",
                    }}
                  >
                    {s}
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      color: step >= s ? "#667eea" : "#999",
                    }}
                  >
                    {s === 1
                      ? "Type"
                      : s === 2
                        ? "Outline"
                        : s === 3
                          ? "Generate"
                          : "Refine"}
                  </span>
                </div>
              ))}
            </div>

            {/* Step 1: Document Type Selection */}
            {step === 1 && (
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "40px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                  Select Document Type
                </h2>
                <p style={{ color: "#666", marginBottom: "30px" }}>
                  Choose the type of document you want to create
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                    marginBottom: "30px",
                  }}
                >
                  <div
                    onClick={() => setDocType("Word Document")}
                    style={{
                      border:
                        docType === "Word Document"
                          ? "3px solid #667eea"
                          : "2px solid #e0e0e0",
                      borderRadius: "12px",
                      padding: "30px",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.3s",
                    }}
                  >
                    <FileText
                      size={48}
                      color={docType === "Word Document" ? "#667eea" : "#999"}
                      style={{ margin: "0 auto 15px" }}
                    />
                    <h3 style={{ margin: "0 0 5px" }}>Word Document</h3>
                    <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
                      Create professional .docx files
                    </p>
                  </div>

                  <div
                    onClick={() => setDocType("PowerPoint")}
                    style={{
                      border:
                        docType === "PowerPoint"
                          ? "3px solid #667eea"
                          : "2px solid #e0e0e0",
                      borderRadius: "12px",
                      padding: "30px",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.3s",
                    }}
                  >
                    <Presentation
                      size={48}
                      color={docType === "PowerPoint" ? "#667eea" : "#999"}
                      style={{ margin: "0 auto 15px" }}
                    />
                    <h3 style={{ margin: "0 0 5px" }}>PowerPoint</h3>
                    <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
                      Create engaging .pptx presentations
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Document Title"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "16px",
                    marginBottom: "20px",
                    boxSizing: "border-box",
                  }}
                />

                <button
                  onClick={() => docType && docTitle && setStep(2)}
                  disabled={!docType || !docTitle}
                  style={{
                    background:
                      docType && docTitle
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "#ccc",
                    color: "white",
                    border: "none",
                    padding: "14px 30px",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: docType && docTitle ? "pointer" : "not-allowed",
                    width: "100%",
                  }}
                >
                  Continue to Outline
                </button>
              </div>
            )}

            {/* Step 2: Define Outline */}
            {step === 2 && (
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "40px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                  Define Document Outline
                </h2>
                <p style={{ color: "#666", marginBottom: "30px" }}>
                  Structure your document by adding sections
                </p>

                {outline.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      background: "#f9fafb",
                      padding: "20px",
                      borderRadius: "10px",
                      marginBottom: "15px",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginBottom: "10px",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          background: "#667eea",
                          color: "white",
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}
                      >
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Section Title"
                        value={item.title}
                        onChange={(e) =>
                          updateOutlineItem(item.id, "title", e.target.value)
                        }
                        style={{
                          flex: 1,
                          padding: "10px",
                          border: "1px solid #e0e0e0",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                      />
                      {outline.length > 1 && (
                        <button
                          onClick={() => removeOutlineItem(item.id)}
                          style={{
                            background: "#fee",
                            border: "none",
                            color: "#c33",
                            padding: "8px",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    <textarea
                      placeholder="Section Description (what should be covered)"
                      value={item.description}
                      onChange={(e) =>
                        updateOutlineItem(
                          item.id,
                          "description",
                          e.target.value,
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #e0e0e0",
                        borderRadius: "6px",
                        fontSize: "14px",
                        minHeight: "80px",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                ))}

                <button
                  onClick={addOutlineItem}
                  style={{
                    background: "transparent",
                    border: "2px dashed #667eea",
                    color: "#667eea",
                    padding: "12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    width: "100%",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  <Plus size={20} />
                  Add Section
                </button>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      background: "#f0f0f0",
                      color: "#333",
                      border: "none",
                      padding: "14px 30px",
                      borderRadius: "8px",
                      fontSize: "16px",
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      border: "none",
                      padding: "14px 30px",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer",
                      flex: 2,
                    }}
                  >
                    Continue to Generate
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: API Key & Generate */}
            {step === 3 && (
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "40px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                  Generate Content
                </h2>
                <p style={{ color: "#666", marginBottom: "30px" }}>
                  Enter your Gemini API key to generate AI-powered content
                </p>

                <input
                  type="password"
                  placeholder="Gemini API Key"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    marginBottom: "10px",
                    boxSizing: "border-box",
                  }}
                />
                <p
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "30px",
                  }}
                >
                  Get your API key from{" "}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    style={{ color: "#667eea" }}
                  >
                    Google AI Studio
                  </a>
                </p>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setStep(2)}
                    style={{
                      background: "#f0f0f0",
                      color: "#333",
                      border: "none",
                      padding: "14px 30px",
                      borderRadius: "8px",
                      fontSize: "16px",
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={generateContent}
                    disabled={isGenerating || !geminiKey}
                    style={{
                      background:
                        isGenerating || !geminiKey
                          ? "#ccc"
                          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      border: "none",
                      padding: "14px 30px",
                      borderRadius: "8px",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor:
                        isGenerating || !geminiKey ? "not-allowed" : "pointer",
                      flex: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw
                          size={20}
                          style={{ animation: "spin 1s linear infinite" }}
                        />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Generate Content
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Refine & Export */}
            {step === 4 && (
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "40px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "30px",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <h2 style={{ margin: "0 0 5px" }}>
                      Review & Refine Content
                    </h2>
                    <p style={{ color: "#666", margin: 0 }}>
                      Edit sections and export your document
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={saveDocumentToFirebase}
                      disabled={isSaving}
                      style={{
                        background: isSaving ? "#ccc" : "#10b981",
                        color: "white",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        cursor: isSaving ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      <Save size={18} />
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={exportDocument}
                      disabled={isExporting}
                      style={{
                        background: isExporting
                          ? "#ccc"
                          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        cursor: isExporting ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      <Download size={18} />
                      {isExporting
                        ? "Exporting..."
                        : `Export ${docType === "Word Document" ? ".docx" : ".pptx"}`}
                    </button>
                  </div>
                </div>

                {generatedContent.map((section) => (
                  <div
                    key={section.id}
                    style={{
                      marginBottom: "25px",
                      border:
                        selectedSection === section.id
                          ? "2px solid #667eea"
                          : "1px solid #e0e0e0",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      onClick={() =>
                        setSelectedSection(
                          selectedSection === section.id ? null : section.id,
                        )
                      }
                      style={{
                        background:
                          selectedSection === section.id
                            ? "#f0f4ff"
                            : "#f9fafb",
                        padding: "15px 20px",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: "18px" }}>
                        {section.title}
                      </h3>
                      <Edit2 size={18} color="#667eea" />
                    </div>

                    {selectedSection === section.id && (
                      <div style={{ padding: "20px" }}>
                        <div
                          style={{
                            background: "#f9fafb",
                            padding: "15px",
                            borderRadius: "8px",
                            marginBottom: "15px",
                            fontSize: "14px",
                            lineHeight: "1.6",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {section.content}
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                          <input
                            type="text"
                            placeholder="How would you like to refine this section?"
                            value={refinementPrompt}
                            onChange={(e) =>
                              setRefinementPrompt(e.target.value)
                            }
                            style={{
                              flex: 1,
                              padding: "10px",
                              border: "1px solid #e0e0e0",
                              borderRadius: "6px",
                              fontSize: "14px",
                            }}
                          />
                          <button
                            onClick={refineSection}
                            disabled={isGenerating || !refinementPrompt}
                            style={{
                              background:
                                isGenerating || !refinementPrompt
                                  ? "#ccc"
                                  : "#667eea",
                              color: "white",
                              border: "none",
                              padding: "10px 20px",
                              borderRadius: "6px",
                              cursor:
                                isGenerating || !refinementPrompt
                                  ? "not-allowed"
                                  : "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "14px",
                              fontWeight: "600",
                            }}
                          >
                            {isGenerating ? (
                              <RefreshCw
                                size={16}
                                style={{ animation: "spin 1s linear infinite" }}
                              />
                            ) : (
                              <Sparkles size={16} />
                            )}
                            Refine
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={resetApp}
                  style={{
                    background: "#f0f0f0",
                    color: "#333",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    cursor: "pointer",
                    width: "100%",
                    marginTop: "20px",
                  }}
                >
                  Start New Document
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
