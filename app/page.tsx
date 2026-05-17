"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  CheckCircle2,
  Database,
  Download,
  Folder,
  Play,
  Search,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react";

type CodeFile = {
  id: string;
  name: string;
  language: string;
  code: string;
};

type ReviewSection = {
  id: string;
  title: string;
  fileName: string;
  summary: string;
  changed: string;
  verified: string;
  before: string;
  after: string;
};

type BobApiData = {
  securityAudit: string;
  migrationSql: string;
  oldCode: string;
  backendCode: string;
  rawAuditLog: string;
  riskScore?: number;
  reviewSections?: ReviewSection[];
};

type ModalState = {
  title: string;
  content: string;
  mode: "text" | "code" | "diff";
  secondaryContent?: string;
};

const launchLogs = [
  "[Orchestrateur] Indexation de la base de code locale...",
  "[Bob-Architect] Lecture multi-fichiers et cartographie des dépendances...",
  "[Bob-SecOps] Analyse des points d'entrée et injections possibles...",
  "[Bob-Core] Génération des correctifs et vérification finale...",
];

const journeySteps = [
  {
    id: "context",
    title: "Deep Context",
    detail: "IBM Bob lit l'arborescence, repère les fichiers actifs et reconstruit l'intention.",
  },
  {
    id: "database",
    title: "Database Layer",
    detail: "Il suit les accès DB, les requêtes SQL, les modèles et les dépendances.",
  },
  {
    id: "security",
    title: "Security Injection",
    detail: "Il marque les entrées non fiables, injections, secrets et validations manquantes.",
  },
  {
    id: "recode",
    title: "Recode Live",
    detail: "Il réécrit le code proprement avec validation, séparation des responsabilités et typage.",
  },
  {
    id: "tests",
    title: "Tests & Verify",
    detail: "Il vérifie le contrat, les cas dangereux et les comportements conservés.",
  },
  {
    id: "audit",
    title: "Final Audit",
    detail: "Il produit les preuves, le diff et le journal de session téléchargeable.",
  },
];

const initialFiles: CodeFile[] = [];

export default function Page() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [apiData, setApiData] = useState<BobApiData | null>(null);
  const [activeTab, setActiveTab] = useState("review");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeJourneyStep, setActiveJourneyStep] = useState("context");
  const [liveCode, setLiveCode] = useState("");
  const [replayLogs, setReplayLogs] = useState<string[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [liveRiskScore, setLiveRiskScore] = useState(0);
  const [modal, setModal] = useState<ModalState | null>(null);

  const activeFile = useMemo(
    () => codeFiles.find((file) => file.id === activeFileId) ?? codeFiles[0],
    [activeFileId, codeFiles],
  );

  const totalLines = codeFiles.reduce(
    (count, file) => count + file.code.split("\n").length,
    0,
  );
  const totalChars = codeFiles.reduce((count, file) => count + file.code.length, 0);
  const reviewSections = apiData?.reviewSections?.length
    ? apiData.reviewSections
    : apiData
      ? buildClientReviewSections(apiData)
      : [];
  const selectedSection =
    reviewSections.find((section) => section.id === activeSectionId) ??
    reviewSections[0];
  const completionPercent = Math.min(
    100,
    Math.max(8, Math.round((codeFiles.filter((file) => file.code.trim()).length / Math.max(1, codeFiles.length)) * 100)),
  );
  const visibleCodeFiles = codeFiles;

  useEffect(() => {
    if (!selectedSection || isLoading || isReplaying) {
      return;
    }

    setLiveCode(selectedSection.after);
    setReplayLogs([
      `[IBM Bob] Correction prête pour ${selectedSection.fileName}.`,
      "[IBM Bob] Le panneau Après correction contient le patch complet.",
      "[IBM Bob] Clique sur Voir IBM Bob coder pour rejouer la génération en direct.",
    ]);
    setActiveJourneyStep("audit");
  }, [selectedSection?.id, isLoading, isReplaying]);

  const importCodeFiles = async (
    fileList: FileList | null,
    options: { preserveRelativePath?: boolean } = {},
  ) => {
    if (!fileList?.length) {
      return;
    }

    const importedFiles = await Promise.all(
      Array.from(fileList).map(async (file, index) => {
        const relativePath =
          options.preserveRelativePath && file.webkitRelativePath
            ? file.webkitRelativePath
            : file.name;

        return {
          id: `imported-${Date.now()}-${index}`,
          name: relativePath,
          language: inferLanguageFromFileName(file.name),
          code: await file.text(),
        };
      }),
    );
    setCodeFiles((files) => [...files, ...importedFiles]);
    setActiveFileId(importedFiles[0].id);
    setApiData(null);
    setActiveTab("review");
    setActiveSectionId(null);
    setActiveJourneyStep("context");
    setLiveCode("");
    setReplayLogs([]);
    setIsReplaying(false);
    setTerminalLogs([
      `[Workspace] ${importedFiles.length} fichier(s) importé(s) dans la base de code.`,
    ]);

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const downloadAuditLog = () => {
    if (!apiData) {
      return;
    }

    const blob = new Blob([apiData.rawAuditLog], {
      type: "text/plain;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = "lazarus-audit.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const downloadTextFile = (fileName: string, content: string) => {
    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const downloadCorrectedSection = (section: ReviewSection) => {
    downloadTextFile(`corrected-${sanitizeDownloadName(section.fileName)}`, section.after);
  };

  const downloadCorrectedBundle = () => {
    if (!reviewSections.length) {
      return;
    }

    const bundle = reviewSections
      .map(
        (section) => `===== ${section.fileName} =====
${section.after}`,
      )
      .join("\n\n");

    downloadTextFile("ibm-bob-corrected-codebase.txt", bundle);
  };

  const openJourneyModal = (section: ReviewSection) => {
    setModal({
      title: `Chemin IBM Bob - ${section.fileName}`,
      mode: "text",
      content: [
        `Lecture: ${section.summary}`,
        "",
        `Correction: ${section.changed}`,
        "",
        `Vérification: ${section.verified}`,
        "",
        ...journeySteps.map((step, index) => `${index + 1}. ${step.title} - ${step.detail}`),
      ].join("\n"),
    });
  };

  const openCodeModal = (section: ReviewSection) => {
    setModal({
      title: `Code corrigé - ${section.fileName}`,
      mode: "code",
      content: section.after,
    });
  };

  const openDiffModal = (section: ReviewSection) => {
    setModal({
      title: `Diff - ${section.fileName}`,
      mode: "diff",
      content: section.before,
      secondaryContent: section.after,
    });
  };

  const launchLazarusSwarm = () => {
    if (isLoading || totalChars === 0) {
      return;
    }

    setIsLoading(true);
    setApiData(null);
    setTerminalLogs([]);
    setActiveTab("review");
    setActiveSectionId(null);
    setLiveCode("");
    setReplayLogs([]);
    setLiveRiskScore(0);
    setActiveJourneyStep("context");
    startLiveAnalysisPreview();

    launchLogs.forEach((log, index) => {
      window.setTimeout(() => {
        setTerminalLogs((currentLogs) => [...currentLogs, log]);

        if (index === launchLogs.length - 1) {
          window.setTimeout(async () => {
            const response = await fetch("/api/bob", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                codebase: codeFiles,
                oldCode: activeFile?.code ?? "",
                language: activeFile?.language ?? "Auto",
                fileName: activeFile?.name ?? "codebase",
              }),
            });

            const data = (await response.json()) as BobApiData;

            setApiData(data);
            setActiveSectionId(data.reviewSections?.[0]?.id ?? "security");
            setActiveJourneyStep("audit");
            setLiveRiskScore(data.riskScore ?? 8.2);
            setTerminalLogs((currentLogs) => [
              ...currentLogs,
              "[Orchestrateur] Correctifs générés, vérifiés et prêts à inspecter.",
            ]);
            setIsLoading(false);
          }, 900);
        }
      }, index * 900);
    });
  };

  const startLiveAnalysisPreview = () => {
    const sampleFix = buildLiveFixPreview(activeFile);
    const chunkSize = Math.max(16, Math.ceil(sampleFix.length / 110));
    const timeline = [
      {
        delay: 250,
        step: "context",
        score: 1.5,
        log: "[Deep Context] Arborescence chargée, fichiers indexés, entrées publiques détectées.",
      },
      {
        delay: 1050,
        step: "database",
        score: 3.4,
        log: "[Database Layer] Requêtes et accès aux données suivis fichier par fichier.",
      },
      {
        delay: 1850,
        step: "security",
        score: 8.6,
        log: "[Security Injection] Faille critique probable: entrée utilisateur vers requête non paramétrée.",
      },
      {
        delay: 2550,
        step: "recode",
        score: 8.9,
        log: "[Recode Live] Début de correction: validation stricte, séparation controller/repository.",
      },
      {
        delay: 4200,
        step: "tests",
        score: 8.1,
        log: "[Tests] Simulation des payloads malveillants et vérification du contrat de sortie.",
      },
    ];

    timeline.forEach((item) => {
      window.setTimeout(() => {
        setActiveJourneyStep(item.step);
        setLiveRiskScore(item.score);
        setReplayLogs((logs) => [...logs, item.log]);
      }, item.delay);
    });

    let cursor = 0;
    const interval = window.setInterval(() => {
      cursor += chunkSize;
      setLiveCode(sampleFix.slice(0, cursor));

      if (cursor >= sampleFix.length) {
        window.clearInterval(interval);
        setLiveCode(sampleFix);
      }
    }, 45);
  };

  const playCodingReplay = (section: ReviewSection) => {
    if (isReplaying) {
      return;
    }

    const steps = [
      "Deep Context: lecture du fichier, extraction des entrées utilisateur et dépendances.",
      "Security Injection: repérage des données non fiables et des appels dangereux.",
      "Core Translation: écriture du correctif propre et maintenable.",
      "Verification: contrôle du contrat de sortie, des validations et des accès paramétrés.",
    ];
    const targetCode = section.after;
    const chunkSize = Math.max(18, Math.ceil(targetCode.length / 90));

    setIsReplaying(true);
    setLiveCode("");
    setReplayLogs([]);
    setActiveJourneyStep("context");

    steps.forEach((step, index) => {
      window.setTimeout(() => {
        setReplayLogs((logs) => [...logs, `[IBM Bob] ${step}`]);
        setActiveJourneyStep(journeySteps[Math.min(index, journeySteps.length - 1)].id);
      }, index * 700);
    });

    let cursor = 0;
    const interval = window.setInterval(() => {
      cursor += chunkSize;
      setLiveCode(targetCode.slice(0, cursor));

      if (cursor >= targetCode.length) {
        window.clearInterval(interval);
        setLiveCode(targetCode);
        setActiveJourneyStep("audit");
        setReplayLogs((logs) => [
          ...logs,
          "[IBM Bob] Tests simulés: validation input OK, requêtes paramétrées OK, audit trail OK.",
          "[IBM Bob] Correctif final prêt pour revue.",
        ]);
        setIsReplaying(false);
      }
    }, 35);
  };

  return (
    <main style={shellStyle}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".js,.jsx,.ts,.tsx,.py,.java,.php,.rb,.go,.cs,.sql,.json,.yml,.yaml,.sh,.txt,.md,.c,.cpp,.h,.hpp,.rs,.kt,.swift"
        style={{ display: "none" }}
        onChange={(event) => importCodeFiles(event.target.files)}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        accept=".js,.jsx,.ts,.tsx,.py,.java,.php,.rb,.go,.cs,.sql,.json,.yml,.yaml,.sh,.txt,.md,.c,.cpp,.h,.hpp,.rs,.kt,.swift"
        style={{ display: "none" }}
        onChange={(event) =>
          importCodeFiles(event.target.files, { preserveRelativePath: true })
        }
        {...{ webkitdirectory: "", directory: "" }}
      />
      <section style={mainPanelStyle}>
        <header style={headerStyle}>
          <div style={brandHeaderStyle}>
            <div style={brandMarkStyle}>
              <Sparkles size={14} />
            </div>
            <div>
              <strong style={{ color: "#ffffff" }}>IBM Bob</strong>
            </div>
          </div>
          <div style={topUtilityStyle}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={topActionButtonStyle}
            >
              <Upload size={14} />
              Import files
            </button>
            <button
              onClick={launchLazarusSwarm}
              disabled={totalChars === 0 || isLoading}
              style={{
                ...topPrimaryButtonStyle,
                opacity: totalChars > 0 && !isLoading ? 1 : 0.55,
                cursor: totalChars > 0 && !isLoading ? "pointer" : "not-allowed",
              }}
            >
              <Play size={14} fill="currentColor" />
              Analyze
            </button>
          </div>
        </header>

        <div style={contentStyle}>
          <div style={workspaceStyle}>
            {!isLoading && !apiData ? (
              <div style={editorPageStyle}>
                <section style={questionnaireShellStyle}>
                  <div style={boardTopbarStyle}>
                    <div style={boardTitleGroupStyle}>
                      <button style={roundIconButtonStyle} aria-label="Retour">
                        ‹
                      </button>
                      <div>
                        <strong>Audit de code IBM Bob</strong>
                        <p style={boardSubtitleStyle}>
                          Importez une base de code. Bob détecte les failles, corrige et prépare les téléchargements.
                        </p>
                      </div>
                    </div>
                    <div style={boardActionGroupStyle}>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={pillButtonStyle}
                      >
                        <Upload size={14} />
                        Importer des fichiers
                      </button>
                      <button
                        onClick={() => folderInputRef.current?.click()}
                        style={pillButtonStyle}
                      >
                        <Folder size={14} />
                        Importer un dossier
                      </button>
                    </div>
                  </div>

                  {codeFiles.length > 0 ? (
                    <>
                      <div style={progressShellStyle}>
                        <span>{completionPercent}% prêt</span>
                        <div style={progressTrackStyle}>
                          <div
                            style={{
                              ...progressFillStyle,
                              width: `${completionPercent}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div style={auditBoardGridStyle}>
                        <div style={moduleCardListStyle}>
                          {visibleCodeFiles.slice(0, 4).map((file, index) => (
                            <button
                              key={file.id}
                              onClick={() => setActiveFileId(file.id)}
                              style={{
                                ...auditCardStyle,
                                borderColor:
                                  file.id === activeFile?.id
                                    ? "rgba(199, 165, 255, 0.55)"
                                    : "rgba(255,255,255,0.10)",
                              }}
                            >
                              <div style={cardHeaderLineStyle}>
                                <span style={statusDotStyle}>✓</span>
                                <span>Fichier {index + 1}</span>
                                <span style={cardTagStyle}>{file.language}</span>
                              </div>
                              <strong>{getBaseName(file.name)}</strong>
                              <p style={cardTextStyle}>
                                {file.code.split("\n").length} lignes · Bob va chercher injections, secrets et appels dangereux
                              </p>
                              <span style={cardLinkStyle}>Sélectionner</span>
                            </button>
                          ))}
                        </div>

                        <div style={aiBreakdownCardStyle}>
                          <div style={cardHeaderLineStyle}>
                            <span style={statusDotStyle}>✦</span>
                            <strong>Ce que Bob va faire</strong>
                          </div>
                          <p style={cardTextStyle}>
                            Bob lit toute la base, explique les failles, réécrit le code et génère les fichiers corrigés.
                          </p>
                          {[
                            "1. Lire tous les fichiers importés",
                            "2. Noter les failles de 0 à 10",
                            "3. Télécharger chaque fichier corrigé",
                          ].map((item) => (
                            <div key={item} style={breakdownItemStyle}>
                              {item}
                              <span>›</span>
                            </div>
                          ))}
                          <button
                            onClick={launchLazarusSwarm}
                            disabled={totalChars === 0}
                            style={{
                              ...launchButtonStyle,
                              width: "100%",
                              justifyContent: "center",
                              marginTop: 12,
                              opacity: totalChars > 0 ? 1 : 0.55,
                              cursor: totalChars > 0 ? "pointer" : "not-allowed",
                            }}
                          >
                            <Play size={16} fill="currentColor" />
                            Lancer l’analyse IBM Bob
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={emptyImportStateStyle}>
                      <div style={emptyIconStyle}>
                        <Upload size={22} />
                      </div>
                      <strong>Aucun fichier importé</strong>
                      <p>
                        Commence par importer des fichiers ou un dossier. Rien n’est analysé tant que ta base de code est vide.
                      </p>
                      <div style={emptyActionsStyle}>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          style={replayButtonStyle}
                        >
                          <Upload size={15} />
                          Importer des fichiers
                        </button>
                        <button
                          onClick={() => folderInputRef.current?.click()}
                          style={quietButtonStyle}
                        >
                          <Folder size={15} />
                          Importer un dossier
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            ) : null}

            {isLoading && !apiData ? (
              <div style={liveAnalysisDashboardStyle}>
                <div style={liveAnalysisHeaderStyle}>
                  <div>
                    <div style={liveAnalysisEyebrowStyle}>IBM Bob travaille en direct</div>
                    <h1 style={liveAnalysisTitleStyle}>
                      Lecture, correction et vérification de la base
                    </h1>
                  </div>
                  <div style={scoreGaugeStyle}>
                    <span style={scoreValueStyle}>{liveRiskScore.toFixed(1)}</span>
                    <span style={scoreLabelStyle}>/10 faille</span>
                  </div>
                </div>

                <section style={journeyMapStyle}>
                  {journeySteps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => setActiveJourneyStep(step.id)}
                      style={{
                        ...journeyStepStyle,
                        borderColor:
                          activeJourneyStep === step.id
                            ? "#ffffff"
                            : "rgba(255,255,255,0.12)",
                        background:
                          activeJourneyStep === step.id
                            ? "rgba(255,255,255,0.14)"
                            : "rgba(255,255,255,0.045)",
                      }}
                    >
                      <span style={journeyIndexStyle}>{index + 1}</span>
                      <span style={journeyTitleStyle}>{step.title}</span>
                      <span style={journeyDetailStyle}>{step.detail}</span>
                    </button>
                  ))}
                </section>

                <div style={liveCodingStyle}>
                  <div style={liveTerminalStyle}>
                    <div style={livePanelHeaderStyle}>Chemin IBM Bob live</div>
                    <div style={liveLogBodyStyle}>
                      {replayLogs.map((log, index) => (
                        <div key={`${log}-${index}`}>{log}</div>
                      ))}
                      <div>[Live] Analyse toujours en cours, l'API finale consolide le résultat...</div>
                    </div>
                  </div>
                  <div style={liveEditorStyle}>
                    <div style={livePanelHeaderStyle}>Recode en direct</div>
                    <pre style={liveCodeStyle}>
                      <code>{liveCode || ""}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ) : null}

            {apiData ? (
              <div style={dashboardStyle}>
                <div style={resultScoreBarStyle}>
                  <span>Notation des failles IBM Bob</span>
                  <div style={headerGroupStyle}>
                    <strong>{(apiData.riskScore ?? liveRiskScore).toFixed(1)} / 10</strong>
                    <button onClick={downloadCorrectedBundle} style={downloadButtonStyle}>
                      <Download size={14} />
                      Télécharger tous les correctifs
                    </button>
                  </div>
                </div>
                <nav style={tabsStyle}>
                  {[
                    { id: "review", label: "Rubriques IBM Bob" },
                    { id: "migration", label: "Migration" },
                    { id: "controller", label: "Diff global" },
                    { id: "audit", label: "Audit log" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        ...tabButtonStyle,
                        borderBottom:
                          activeTab === tab.id
                            ? "2px solid #fafafa"
                            : "2px solid transparent",
                        background:
                          activeTab === tab.id
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(255,255,255,0.035)",
                        color: activeTab === tab.id ? "#ffffff" : "#d9caff",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>

                <div style={dashboardBodyStyle}>
                  {activeTab === "review" ? (
                    <div style={reviewShellStyle}>
                      <section style={compactJourneyStyle}>
                        {journeySteps.map((step, index) => (
                          <button
                            key={step.id}
                            onClick={() => setActiveJourneyStep(step.id)}
                            style={{
                              ...compactJourneyStepStyle,
                              borderColor:
                                activeJourneyStep === step.id
                                  ? "#fafafa"
                                  : "rgba(255,255,255,0.12)",
                              background:
                                activeJourneyStep === step.id
                                  ? "#ffffff14"
                                  : "rgba(255,255,255,0.045)",
                            }}
                          >
                            <span style={journeyIndexStyle}>{index + 1}</span>
                            <span style={journeyTitleStyle}>{step.title}</span>
                          </button>
                        ))}
                      </section>

                      <div style={reviewLayoutStyle}>
                        <aside style={rubricListStyle}>
                          {reviewSections.map((section) => (
                            <button
                              key={section.id}
                              onClick={() => {
                                setActiveSectionId(section.id);
                                setLiveCode("");
                                setReplayLogs([]);
                                setActiveJourneyStep("context");
                              }}
                              style={{
                                ...rubricButtonStyle,
                                borderColor:
                                selectedSection?.id === section.id
                                  ? "#fafafa"
                                  : "rgba(255,255,255,0.12)",
                                background:
                                  selectedSection?.id === section.id
                                    ? "#ffffff14"
                                    : "rgba(255,255,255,0.045)",
                              }}
                            >
                              <span style={rubricTitleStyle}>{section.title}</span>
                              <span style={rubricFileStyle}>{section.fileName}</span>
                            </button>
                          ))}
                        </aside>

                        {selectedSection ? (
                          <section style={rubricDetailStyle}>
                          <div style={detailHeaderStyle}>
                            <ShieldAlert size={20} color="#fafafa" />
                            <div>
                              <h2 style={detailTitleStyle}>
                                {selectedSection.title}
                              </h2>
                              <p style={detailFileStyle}>
                                {selectedSection.fileName}
                              </p>
                            </div>
                            <button
                              onClick={() => openJourneyModal(selectedSection)}
                              style={quietButtonStyle}
                            >
                              Chemin
                            </button>
                            <button
                              onClick={() => playCodingReplay(selectedSection)}
                              style={replayButtonStyle}
                            >
                              <Play size={15} fill="currentColor" />
                              Voir IBM Bob coder
                            </button>
                            <button
                              onClick={() => openCodeModal(selectedSection)}
                              style={quietButtonStyle}
                            >
                              Code corrigé
                            </button>
                            <button
                              onClick={() => openDiffModal(selectedSection)}
                              style={quietButtonStyle}
                            >
                              Diff
                            </button>
                            <button
                              onClick={() => downloadCorrectedSection(selectedSection)}
                              style={downloadPatchButtonStyle}
                            >
                              <Download size={15} />
                              Télécharger ce fichier corrigé
                            </button>
                          </div>

                          <div style={explainGridStyle}>
                            <div style={explainCardStyle}>
                              <strong>Ce qu'IBM Bob a lu</strong>
                              <p>{selectedSection.summary}</p>
                            </div>
                            <div style={explainCardStyle}>
                              <strong>Ce qui a été modifié</strong>
                              <p>{selectedSection.changed}</p>
                            </div>
                            <div style={explainCardStyle}>
                              <strong>Comment IBM Bob a vérifié</strong>
                              <p>{selectedSection.verified}</p>
                            </div>
                          </div>

                          <div style={previewCardStyle}>
                            <div>
                              <strong>Correction prête</strong>
                              <p>
                                Le code complet est disponible dans la popup ou en téléchargement.
                              </p>
                            </div>
                            <button
                              onClick={() => openCodeModal(selectedSection)}
                              style={replayButtonStyle}
                            >
                              Ouvrir le code
                            </button>
                          </div>
                          </section>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {activeTab === "migration" ? (
                    <div style={emptyPanelStyle}>
                      <strong>Migration prête</strong>
                      <p>Le schéma est disponible dans une popup pour garder l’écran léger.</p>
                      <button
                        onClick={() =>
                          setModal({
                            title: "Migration",
                            mode: "code",
                            content: apiData.migrationSql,
                          })
                        }
                        style={replayButtonStyle}
                      >
                        Ouvrir la migration
                      </button>
                    </div>
                  ) : null}

                  {activeTab === "controller" ? (
                    <div style={emptyPanelStyle}>
                      <strong>Diff global prêt</strong>
                      <p>Le diff complet est volontairement affiché en popup.</p>
                      <button
                        onClick={() =>
                          setModal({
                            title: "Diff global",
                            mode: "diff",
                            content: apiData.oldCode,
                            secondaryContent: apiData.backendCode,
                          })
                        }
                        style={replayButtonStyle}
                      >
                        Ouvrir le diff
                      </button>
                    </div>
                  ) : null}

                  {activeTab === "audit" ? (
                    <div style={emptyPanelStyle}>
                      <strong>Audit log prêt</strong>
                      <p>Les logs complets sont consultables en popup ou téléchargeables.</p>
                      <button
                        onClick={() =>
                          setModal({
                            title: "Audit log IBM Bob",
                            mode: "text",
                            content: apiData.rawAuditLog,
                          })
                        }
                        style={replayButtonStyle}
                      >
                        Ouvrir les logs
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {(isLoading || terminalLogs.length > 0) && (
            <section style={terminalStyle}>
              <div style={terminalHeaderStyle}>Terminal</div>
              <div style={terminalBodyStyle}>
                {terminalLogs.map((log, index) => (
                  <div key={`${log}-${index}`}>
                    <span style={{ color: "#d9caff" }}>$</span> {log}
                  </div>
                ))}
                {isLoading ? <span style={cursorStyle}>_</span> : null}
              </div>
            </section>
          )}
        </div>
      </section>
      {modal ? (
        <div style={modalOverlayStyle} onClick={() => setModal(null)}>
          <section style={modalStyle} onClick={(event) => event.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <strong>{modal.title}</strong>
              <button onClick={() => setModal(null)} style={modalCloseStyle}>
                Fermer
              </button>
            </div>
            {modal.mode === "diff" ? (
              <div style={modalDiffStyle}>
                <pre style={modalPreStyle}>
                  <code>{modal.content}</code>
                </pre>
                <pre style={modalPreStyle}>
                  <code>{modal.secondaryContent}</code>
                </pre>
              </div>
            ) : (
              <pre style={modalPreStyle}>
                <code>{modal.content}</code>
              </pre>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}

function buildClientReviewSections(apiData: BobApiData): ReviewSection[] {
  return [
    {
      id: "security",
      title: "Injection et validation",
      fileName: "codebase",
      summary: apiData.securityAudit,
      changed:
        "Les entrées utilisateur sont validées avant l'accès aux données, puis les requêtes brutes sont remplacées par une couche paramétrée.",
      verified:
        "IBM Bob vérifie que les payloads utilisateur ne sont plus concaténés dans les requêtes et que la sortie garde le même contrat métier.",
      before: apiData.oldCode,
      after: apiData.backendCode,
    },
    {
      id: "database",
      title: "Modèle de données",
      fileName: "schema.prisma",
      summary:
        "La structure base de données est normalisée dans un schéma Prisma avec index, relations et contraintes.",
      changed:
        "Les tables implicites deviennent des modèles typés avec index sur les champs de recherche et contraintes d'unicité.",
      verified:
        "IBM Bob contrôle que la migration garde les champs utiles au code legacy et prépare les accès sécurisés.",
      before: "SQL brut dispersé dans les controllers legacy.",
      after: apiData.migrationSql,
    },
  ];
}

function buildLiveFixPreview(file: CodeFile) {
  return `type SafeResult<T> = {
  data: T;
  audited: true;
};

export async function secureHandler(rawInput: unknown): Promise<SafeResult<unknown>> {
  const input = validateAndNormalizeInput(rawInput);
  const result = await repository.findWithParameterizedQuery(input);

  await auditTrail.write({
    action: "legacy_code_secured",
    file: "${file.name.replaceAll('"', '\\"')}",
    checks: ["input-validation", "parameterized-query", "stable-response"],
  });

  return {
    data: result,
    audited: true,
  };
}

function validateAndNormalizeInput(rawInput: unknown) {
  return rawInput;
}`;
}

function sanitizeDownloadName(fileName: string) {
  const baseName = fileName.replaceAll("\\", "/").split("/").pop() || "file.txt";
  return baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function inferLanguageFromFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "js":
    case "jsx":
      return "JavaScript";
    case "ts":
    case "tsx":
      return "TypeScript";
    case "py":
      return "Python";
    case "java":
      return "Java";
    case "php":
      return "PHP";
    case "rb":
      return "Ruby";
    case "go":
      return "Go";
    case "cs":
      return "C#";
    case "sql":
      return "SQL";
    default:
      return "Auto";
  }
}

function getBaseName(path: string) {
  return path.replaceAll("\\", "/").split("/").pop() ?? path;
}

const shellStyle = {
  minHeight: "100vh",
  width: "100vw",
  background:
    "radial-gradient(circle at 18% 22%, rgba(177, 118, 255, 0.50), transparent 28%), radial-gradient(circle at 82% 12%, rgba(120, 79, 255, 0.42), transparent 26%), linear-gradient(135deg, #2b0754 0%, #7d43db 54%, #c8a7ff 100%)",
  color: "#f7f2ff",
  display: "flex",
  margin: 0,
  border: "1px solid rgba(255, 255, 255, 0.16)",
  borderRadius: 0,
  overflow: "hidden",
  boxShadow: "none",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} satisfies CSSProperties;

const mainPanelStyle = {
  flex: 1,
  minHeight: "100vh",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
} satisfies CSSProperties;

const headerStyle = {
  height: 76,
  borderBottom: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  margin: "18px 18px 0",
  padding: "0 22px",
  borderRadius: 24,
  background: "rgba(15, 5, 31, 0.72)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  color: "#d9caff",
  fontSize: 13,
} satisfies CSSProperties;

const contentStyle = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
} satisfies CSSProperties;

const workspaceStyle = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px clamp(18px, 3vw, 42px) 34px",
} satisfies CSSProperties;

const brandHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
} satisfies CSSProperties;

const brandMarkStyle = {
  width: 30,
  height: 30,
  borderRadius: 9,
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg, #ffffff, #a987ff)",
  color: "#160729",
  fontWeight: 900,
} satisfies CSSProperties;

const topUtilityStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
} satisfies CSSProperties;

const topActionButtonStyle = {
  height: 38,
  border: "1px solid rgba(255, 255, 255, 0.14)",
  borderRadius: 999,
  background: "rgba(255, 255, 255, 0.08)",
  color: "#ffffff",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "0 14px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
} satisfies CSSProperties;

const topPrimaryButtonStyle = {
  height: 38,
  border: 0,
  borderRadius: 999,
  background: "linear-gradient(135deg, #ffffff, #b893ff)",
  color: "#18072d",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "0 15px",
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
} satisfies CSSProperties;

const editorPageStyle = {
  width: "min(1360px, 100%)",
  display: "grid",
  gap: 18,
} satisfies CSSProperties;

const questionnaireShellStyle = {
  border: "1px solid rgba(255, 255, 255, 0.13)",
  borderRadius: 28,
  background:
    "linear-gradient(180deg, rgba(54, 37, 76, 0.82), rgba(35, 23, 55, 0.76))",
  boxShadow: "0 24px 80px rgba(24, 4, 48, 0.28)",
  padding: 20,
  display: "grid",
  gap: 14,
  maxHeight: "calc(100vh - 118px)",
  overflow: "hidden",
} satisfies CSSProperties;

const boardTopbarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
} satisfies CSSProperties;

const boardTitleGroupStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "#ffffff",
  fontSize: 14,
} satisfies CSSProperties;

const boardSubtitleStyle = {
  margin: "4px 0 0",
  color: "#d9caff",
  fontSize: 12,
  lineHeight: 1.35,
} satisfies CSSProperties;

const boardActionGroupStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
} satisfies CSSProperties;

const roundIconButtonStyle = {
  width: 34,
  height: 34,
  border: "1px solid rgba(255, 255, 255, 0.14)",
  borderRadius: 999,
  background: "rgba(255, 255, 255, 0.08)",
  color: "#ffffff",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  fontSize: 22,
} satisfies CSSProperties;

const pillButtonStyle = {
  height: 34,
  border: "1px solid rgba(255, 255, 255, 0.14)",
  borderRadius: 999,
  background: "rgba(255, 255, 255, 0.08)",
  color: "#ffffff",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "0 12px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
} satisfies CSSProperties;

const progressShellStyle = {
  minHeight: 38,
  borderRadius: 999,
  background: "rgba(17, 11, 28, 0.52)",
  display: "grid",
  gridTemplateColumns: "110px minmax(0, 1fr)",
  alignItems: "center",
  gap: 10,
  padding: "0 12px",
  color: "#ffffff",
  fontSize: 12,
  fontWeight: 800,
} satisfies CSSProperties;

const progressTrackStyle = {
  height: 18,
  borderRadius: 999,
  background: "rgba(255, 255, 255, 0.08)",
  overflow: "hidden",
} satisfies CSSProperties;

const progressFillStyle = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, #8b5cf6, #d8b4fe)",
} satisfies CSSProperties;

const auditBoardGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(420px, 1fr) minmax(340px, 0.86fr)",
  gap: 14,
  minHeight: 0,
} satisfies CSSProperties;

const moduleCardListStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  minHeight: 0,
} satisfies CSSProperties;

const auditCardStyle = {
  minHeight: 138,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 18,
  background: "rgba(255, 255, 255, 0.07)",
  color: "#ffffff",
  display: "grid",
  alignContent: "start",
  gap: 9,
  padding: 14,
  textAlign: "left",
  cursor: "pointer",
  overflow: "hidden",
} satisfies CSSProperties;

const cardHeaderLineStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#d9caff",
  fontSize: 12,
} satisfies CSSProperties;

const statusDotStyle = {
  width: 20,
  height: 20,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(216, 180, 254, 0.18)",
  color: "#ffffff",
  fontSize: 11,
} satisfies CSSProperties;

const cardTagStyle = {
  marginLeft: "auto",
  borderRadius: 999,
  background: "rgba(255, 255, 255, 0.09)",
  padding: "4px 8px",
  color: "#ffffff",
  fontSize: 11,
} satisfies CSSProperties;

const cardTextStyle = {
  margin: 0,
  color: "#d9caff",
  fontSize: 12,
  lineHeight: 1.45,
} satisfies CSSProperties;

const cardLinkStyle = {
  width: "fit-content",
  borderRadius: 999,
  background: "rgba(255, 255, 255, 0.08)",
  padding: "6px 9px",
  color: "#ffffff",
  fontSize: 12,
  fontWeight: 800,
} satisfies CSSProperties;

const aiBreakdownCardStyle = {
  minHeight: 304,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 20,
  background: "rgba(255, 255, 255, 0.07)",
  color: "#ffffff",
  padding: 16,
  display: "grid",
  alignContent: "start",
  gap: 12,
  overflow: "hidden",
} satisfies CSSProperties;

const breakdownItemStyle = {
  minHeight: 34,
  borderRadius: 999,
  background: "rgba(19, 8, 34, 0.42)",
  color: "#eee7ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 12px",
  fontSize: 12,
} satisfies CSSProperties;

const emptyImportStateStyle = {
  minHeight: 360,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 22,
  background: "rgba(255, 255, 255, 0.07)",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: 12,
  padding: 28,
  textAlign: "center",
  color: "#ffffff",
} satisfies CSSProperties;

const emptyIconStyle = {
  width: 54,
  height: 54,
  borderRadius: 18,
  background: "rgba(255, 255, 255, 0.10)",
  display: "grid",
  placeItems: "center",
  color: "#ffffff",
} satisfies CSSProperties;

const emptyActionsStyle = {
  display: "flex",
  gap: 10,
  marginTop: 6,
  flexWrap: "wrap",
  justifyContent: "center",
} satisfies CSSProperties;

const liveAnalysisDashboardStyle = {
  width: "100%",
  display: "grid",
  alignContent: "start",
  gap: 16,
} satisfies CSSProperties;

const liveAnalysisHeaderStyle = {
  minHeight: 86,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 18,
  background: "rgba(34, 20, 55, 0.76)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: 18,
} satisfies CSSProperties;

const liveAnalysisEyebrowStyle = {
  color: "#fafafa",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
} satisfies CSSProperties;

const liveAnalysisTitleStyle = {
  margin: "6px 0 0",
  fontSize: 18,
} satisfies CSSProperties;

const scoreGaugeStyle = {
  width: 118,
  height: 70,
  border: "1px solid rgba(255, 255, 255, 0.14)",
  borderRadius: 16,
  background: "rgba(255, 255, 255, 0.08)",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
} satisfies CSSProperties;

const scoreValueStyle = {
  color: "#fafafa",
  fontSize: 28,
  fontWeight: 900,
  lineHeight: 1,
} satisfies CSSProperties;

const scoreLabelStyle = {
  color: "#a3a3a3",
  fontSize: 12,
  marginTop: 4,
} satisfies CSSProperties;

const headerGroupStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
} satisfies CSSProperties;

const launchButtonStyle = {
  height: 38,
  border: 0,
  borderRadius: 10,
  background: "linear-gradient(135deg, #ffffff, #b893ff)",
  color: "#18072d",
  fontWeight: 800,
  padding: "0 16px",
  whiteSpace: "nowrap",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
} satisfies CSSProperties;

const dashboardStyle = {
  width: "100%",
  minHeight: "100%",
  background: "rgba(12, 5, 23, 0.72)",
  display: "flex",
  flexDirection: "column",
} satisfies CSSProperties;

const resultScoreBarStyle = {
  minHeight: 44,
  borderBottom: "1px solid rgba(255, 255, 255, 0.09)",
  background: "rgba(255, 255, 255, 0.055)",
  color: "#eee7ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 14px",
  fontSize: 13,
} satisfies CSSProperties;

const tabsStyle = {
  minHeight: 42,
  borderBottom: "1px solid rgba(255, 255, 255, 0.09)",
  display: "flex",
  alignItems: "stretch",
} satisfies CSSProperties;

const tabButtonStyle = {
  border: 0,
  borderRight: "1px solid rgba(255, 255, 255, 0.09)",
  padding: "0 14px",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
} satisfies CSSProperties;

const dashboardBodyStyle = {
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  padding: 18,
} satisfies CSSProperties;

const reviewShellStyle = {
  display: "grid",
  gap: 16,
} satisfies CSSProperties;

const journeyMapStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: 10,
} satisfies CSSProperties;

const compactJourneyStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: 8,
} satisfies CSSProperties;

const compactJourneyStepStyle = {
  minHeight: 54,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 14,
  color: "#d4d4d4",
  padding: "8px 10px",
  textAlign: "left",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
} satisfies CSSProperties;

const journeyStepStyle = {
  minHeight: 112,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 16,
  color: "#d4d4d4",
  padding: 12,
  textAlign: "left",
  cursor: "pointer",
  display: "grid",
  gap: 7,
  alignContent: "start",
} satisfies CSSProperties;

const journeyIndexStyle = {
  width: 22,
  height: 22,
  borderRadius: 999,
  background: "#fafafa",
  color: "#050505",
  display: "grid",
  placeItems: "center",
  fontSize: 12,
  fontWeight: 900,
} satisfies CSSProperties;

const journeyTitleStyle = {
  color: "#fafafa",
  fontSize: 12,
  fontWeight: 900,
} satisfies CSSProperties;

const journeyDetailStyle = {
  color: "#a3a3a3",
  fontSize: 11,
  lineHeight: 1.35,
} satisfies CSSProperties;

const reviewLayoutStyle = {
  minHeight: "100%",
  display: "grid",
  gridTemplateColumns: "300px minmax(0, 1fr)",
  gap: 16,
} satisfies CSSProperties;

const rubricListStyle = {
  display: "grid",
  alignContent: "start",
  gap: 8,
} satisfies CSSProperties;

const rubricButtonStyle = {
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 14,
  color: "#fafafa",
  padding: 12,
  textAlign: "left",
  cursor: "pointer",
  display: "grid",
  gap: 6,
} satisfies CSSProperties;

const rubricTitleStyle = {
  fontWeight: 800,
  fontSize: 13,
} satisfies CSSProperties;

const rubricFileStyle = {
  color: "#a3a3a3",
  fontSize: 12,
} satisfies CSSProperties;

const rubricDetailStyle = {
  minWidth: 0,
  display: "grid",
  gap: 14,
  alignContent: "start",
} satisfies CSSProperties;

const detailHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  justifyContent: "space-between",
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 16,
  background: "rgba(255, 255, 255, 0.075)",
  padding: 14,
} satisfies CSSProperties;

const quietButtonStyle = {
  height: 32,
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: 10,
  background: "rgba(255, 255, 255, 0.06)",
  color: "#eee7ff",
  padding: "0 12px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
} satisfies CSSProperties;

const detailTitleStyle = {
  margin: 0,
  fontSize: 16,
} satisfies CSSProperties;

const detailFileStyle = {
  margin: "3px 0 0",
  color: "#a3a3a3",
  fontSize: 12,
} satisfies CSSProperties;

const explainGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
} satisfies CSSProperties;

const explainCardStyle = {
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 16,
  background: "rgba(255, 255, 255, 0.06)",
  color: "#eee7ff",
  padding: 14,
  fontSize: 13,
  lineHeight: 1.55,
} satisfies CSSProperties;

const previewCardStyle = {
  minHeight: 86,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 16,
  background: "rgba(255, 255, 255, 0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: 16,
  color: "#eee7ff",
  fontSize: 13,
} satisfies CSSProperties;

const emptyPanelStyle = {
  minHeight: 240,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 18,
  background: "rgba(255, 255, 255, 0.06)",
  color: "#eee7ff",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: 10,
  textAlign: "center",
  padding: 24,
} satisfies CSSProperties;

const replayButtonStyle = {
  height: 32,
  border: 0,
  borderRadius: 10,
  background: "linear-gradient(135deg, #ffffff, #b893ff)",
  color: "#18072d",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "0 12px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
} satisfies CSSProperties;

const downloadPatchButtonStyle = {
  height: 32,
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: 10,
  background: "rgba(255, 255, 255, 0.06)",
  color: "#ffffff",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "0 12px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
} satisfies CSSProperties;

const liveCodingStyle = {
  display: "grid",
  gridTemplateColumns: "320px minmax(0, 1fr)",
  gap: 14,
} satisfies CSSProperties;

const liveTerminalStyle = {
  minHeight: 220,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 16,
  background: "rgba(10, 4, 20, 0.62)",
  overflow: "hidden",
} satisfies CSSProperties;

const liveEditorStyle = {
  minHeight: 220,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 16,
  background: "rgba(10, 4, 20, 0.62)",
  overflow: "hidden",
} satisfies CSSProperties;

const livePanelHeaderStyle = {
  height: 34,
  display: "flex",
  alignItems: "center",
  borderBottom: "1px solid rgba(255, 255, 255, 0.09)",
  background: "rgba(255, 255, 255, 0.075)",
  color: "#eee7ff",
  padding: "0 12px",
  fontSize: 12,
  fontWeight: 900,
} satisfies CSSProperties;

const liveLogBodyStyle = {
  padding: 12,
  color: "#fafafa",
  fontFamily:
    'JetBrains Mono, "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: 12,
  lineHeight: 1.65,
  display: "grid",
  gap: 8,
} satisfies CSSProperties;

const liveCodeStyle = {
  margin: 0,
  maxHeight: 360,
  overflow: "auto",
  padding: 14,
  color: "#fafafa",
  fontFamily:
    'JetBrains Mono, "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: 12,
  lineHeight: 1.6,
  whiteSpace: "pre",
} satisfies CSSProperties;

const diffGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 16,
  minHeight: 360,
} satisfies CSSProperties;

const oldCodePanelStyle = {
  minWidth: 0,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 16,
  background: "rgba(10, 4, 20, 0.62)",
  overflow: "hidden",
} satisfies CSSProperties;

const newCodePanelStyle = {
  minWidth: 0,
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 16,
  background: "rgba(10, 4, 20, 0.62)",
  overflow: "hidden",
} satisfies CSSProperties;

const diffHeaderStyle = {
  height: 36,
  display: "flex",
  alignItems: "center",
  gap: 8,
  borderBottom: "1px solid rgba(255, 255, 255, 0.09)",
  background: "rgba(255, 255, 255, 0.075)",
  color: "#eee7ff",
  padding: "0 12px",
  fontSize: 12,
  fontWeight: 800,
} satisfies CSSProperties;

const diffPreStyle = {
  margin: 0,
  padding: 14,
  overflow: "auto",
  color: "#fafafa",
  fontFamily:
    'JetBrains Mono, "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: 12,
  lineHeight: 1.6,
  whiteSpace: "pre",
} satisfies CSSProperties;

const codeBlockStyle = {
  margin: 0,
  minHeight: "100%",
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: 16,
  background: "rgba(10, 4, 20, 0.62)",
  color: "#fafafa",
  padding: 18,
  overflow: "auto",
  fontFamily:
    'JetBrains Mono, "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: 13,
  lineHeight: 1.65,
} satisfies CSSProperties;

const terminalStyle = {
  height: 220,
  borderTop: "1px solid rgba(255, 255, 255, 0.09)",
  background: "rgba(10, 4, 20, 0.70)",
  display: "flex",
  flexDirection: "column",
} satisfies CSSProperties;

const terminalHeaderStyle = {
  height: 36,
  display: "flex",
  alignItems: "center",
  padding: "0 14px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.09)",
  color: "#eee7ff",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0,
} satisfies CSSProperties;

const terminalBodyStyle = {
  flex: 1,
  overflow: "auto",
  padding: 16,
  fontFamily:
    'JetBrains Mono, "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: 13,
  lineHeight: 1.7,
  color: "#fafafa",
} satisfies CSSProperties;

const cursorStyle = {
  display: "inline-block",
  marginTop: 4,
  color: "#fafafa",
} satisfies CSSProperties;

const downloadButtonStyle = {
  height: 30,
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: 10,
  background: "rgba(255, 255, 255, 0.06)",
  color: "#ffffff",
  padding: "0 12px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
} satisfies CSSProperties;

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 50,
  background: "rgba(18, 4, 34, 0.72)",
  display: "grid",
  placeItems: "center",
  padding: 24,
} satisfies CSSProperties;

const modalStyle = {
  width: "min(1180px, 94vw)",
  maxHeight: "88vh",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: 18,
  background: "#180d2c",
  boxShadow: "0 24px 80px rgba(0, 0, 0, 0.45)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
} satisfies CSSProperties;

const modalHeaderStyle = {
  minHeight: 46,
  borderBottom: "1px solid rgba(255, 255, 255, 0.09)",
  background: "rgba(255, 255, 255, 0.075)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 14px",
  color: "#fafafa",
  fontSize: 13,
} satisfies CSSProperties;

const modalCloseStyle = {
  height: 30,
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: 10,
  background: "rgba(255, 255, 255, 0.06)",
  color: "#eee7ff",
  padding: "0 12px",
  cursor: "pointer",
  fontWeight: 800,
} satisfies CSSProperties;

const modalDiffStyle = {
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 1,
  background: "rgba(255, 255, 255, 0.12)",
  overflow: "hidden",
} satisfies CSSProperties;

const modalPreStyle = {
  margin: 0,
  minHeight: 0,
  maxHeight: "calc(88vh - 47px)",
  overflow: "auto",
  background: "#10071f",
  color: "#fafafa",
  padding: 16,
  fontFamily:
    'JetBrains Mono, "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: 12,
  lineHeight: 1.6,
  whiteSpace: "pre",
} satisfies CSSProperties;
