import React, { useState, useEffect } from 'react';
import { useSurvey } from './hooks/useSurvey';
import { useTheme } from './hooks/useTheme';
import { ThemeProvider } from './context/ThemeContext';
import { useQualitativeAnalysis } from './hooks/useQualitativeAnalysis';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { EmptyState } from './components/layout/EmptyState';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { QuestionMappingViewer } from './components/dashboard/QuestionMappingViewer';
import { RawDataPreview } from './components/dashboard/RawDataPreview';
import { QuestionMappingDrawer } from './components/dashboard/QuestionMappingDrawer';
import { SourceSelectorModal } from './components/data/SourceSelectorModal';
import { GoogleDriveSelectorModal } from './components/data/GoogleDriveSelectorModal';
import { GoogleFormsModal } from './components/data/GoogleFormsModal';
import { SurveyMappingReviewModal } from './components/data/SurveyMappingReviewModal';
import { DataSourcePage } from './pages/DataSourcePage';
import { SettingsPage } from './pages/SettingsPage';
import { QuestionMapping, Survey, AnalysisDisplaySettings } from './types/survey';
import { DataProfilerResult } from './services/data/dataProfiler';
import { ParseResult } from './services/data/fileParser';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthService } from './services/auth/authService';
import { AuthModal } from './components/auth/AuthModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { ThemeSelectorModal } from './components/theme/ThemeSelectorModal';

const SIDEBAR_COLLAPSED_KEY = 'survey_analyzer_sidebar_collapsed';

function MainAppContent() {
  const { isDark, toggleTheme } = useTheme();
  const {
    survey,
    processedData,
    activeTab,
    setActiveTab,
    isSourceModalOpen,
    setIsSourceModalOpen,
    selectedQuestionId,
    setSelectedQuestionId,
    updateQuestionMapping,
    loadSurvey,
    refreshSurvey,
    clearSurvey,
  } = useSurvey();

  const {
    analysisMap,
    isAnalyzingAll,
    analyzeQuestion,
    analyzeAllQualitative,
  } = useQualitativeAnalysis(survey, processedData);

  const { projects, activeProjectId, loadProject } = useAuth();

  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isFormsModalOpen, setIsFormsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Collapsible sidebar state (persisted)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    }
    return false;
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  // Review Modal state for non-Google Forms sources (Data Profiler Pipeline)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [surveyForReview, setSurveyForReview] = useState<Survey | null>(null);
  const [profilerResultForReview, setProfilerResultForReview] = useState<DataProfilerResult | null>(
    null
  );

  // Auto-load active project if one is set and no survey is currently loaded
  useEffect(() => {
    if (!survey && activeProjectId) {
      loadProject(activeProjectId)
        .then((res) => {
          if (res?.survey) {
            loadSurvey(res.survey);
          }
        })
        .catch(() => {});
    }
  }, [activeProjectId]);

  // Auto-load Google Drive default survey on startup if no active project is selected
  const [hasAttemptedDefaultSurvey, setHasAttemptedDefaultSurvey] = useState(false);
  useEffect(() => {
    if (!survey && !activeProjectId && !hasAttemptedDefaultSurvey) {
      setHasAttemptedDefaultSurvey(true);
      AuthService.getDefaultPublicSurvey()
        .then((res) => {
          if (res?.survey) {
            loadSurvey(res.survey);
          }
        })
        .catch((err) => {
          console.info('Default Google Drive survey could not be auto-loaded:', err.message);
        });
    }
  }, [survey, activeProjectId, hasAttemptedDefaultSurvey, loadSurvey]);

  const selectedQuestion = React.useMemo(() => {
    if (!survey || !selectedQuestionId) return null;
    return survey.questions.find((q) => q.id === selectedQuestionId) || null;
  }, [survey, selectedQuestionId]);

  const selectedMapping = React.useMemo(() => {
    if (!survey || !selectedQuestionId) return null;
    return survey.mappings[selectedQuestionId] || null;
  }, [survey, selectedQuestionId]);

  // Handler when non-Forms data (Drive, CSV, XLSX, URL) is loaded and needs review
  const handleStartReview = (surveyToReview: Survey, profilerResult?: DataProfilerResult) => {
    setSurveyForReview(surveyToReview);
    setProfilerResultForReview(profilerResult || null);
    setIsReviewModalOpen(true);
  };

  // Handler when user confirms the reviewed survey
  const handleConfirmReview = (reviewedSurvey: Survey) => {
    loadSurvey(reviewedSurvey);
    setIsReviewModalOpen(false);
    setSurveyForReview(null);
    setProfilerResultForReview(null);
  };

  const handleSelectProject = (projectSurvey: Survey, settings?: AnalysisDisplaySettings) => {
    loadSurvey(projectSurvey);
  };

  const handleNewBlankProject = () => {
    clearSurvey();
    setActiveTab('dashboard');
  };

  const handleRestoreBackup = (backupData: any) => {
    if (backupData?.survey) {
      loadSurvey(backupData.survey);
    }
  };

  return (
    <div className="min-h-screen bg-theme-canvas text-theme-main flex flex-col font-sans antialiased selection:bg-theme-primary selection:text-white transition-colors duration-150">
      {/* Top Header */}
      <Header
        appName="AI Survey Analyzer"
        dataSource={survey?.source}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex w-full overflow-hidden">
        {/* Collapsible Sidebar with Dashboards Selector */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onNewAnalysis={() => setIsSourceModalOpen(true)}
          dataSource={survey?.source}
          questionCount={survey?.questions.length ?? 0}
          respondentCount={survey?.responses.length ?? 0}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          currentSurvey={survey}
          onSelectProject={handleSelectProject}
          onNewBlankProject={handleNewBlankProject}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full max-w-full transition-all duration-200">
          <div className="max-w-7xl mx-auto w-full">
            {!survey ? (
              <EmptyState
                onConnectForms={() => setIsFormsModalOpen(true)}
                onConnectGoogle={() => setIsDriveModalOpen(true)}
                onUploadFile={() => setIsSourceModalOpen(true)}
                onRestoreBackup={handleRestoreBackup}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && processedData && (
                  <DashboardOverview
                    processedData={processedData}
                    isDark={isDark}
                    onOpenMapping={(qId) => setSelectedQuestionId(qId)}
                    analysisMap={analysisMap}
                    onAnalyzeQuestion={analyzeQuestion}
                    onAnalyzeAllQualitative={analyzeAllQualitative}
                    isAnalyzingAll={isAnalyzingAll}
                    onRefreshData={refreshSurvey}
                  />
                )}

                {activeTab === 'mapping' && processedData && (
                  <QuestionMappingViewer
                    processedData={processedData}
                    onEditMapping={(qId) => setSelectedQuestionId(qId)}
                  />
                )}

                {activeTab === 'source' && (
                  <DataSourcePage
                    dataSource={survey.source}
                    onOpenSourceModal={() => setIsSourceModalOpen(true)}
                  />
                )}

                {activeTab === 'responses' && <RawDataPreview survey={survey} />}

                {activeTab === 'settings' && (
                  <SettingsPage isDark={isDark} onToggleTheme={toggleTheme} />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Question Mapping Edit Drawer / Modal */}
      <QuestionMappingDrawer
        question={selectedQuestion}
        mapping={selectedMapping}
        isOpen={Boolean(selectedQuestionId)}
        onClose={() => setSelectedQuestionId(null)}
        onSave={(qId, updates) => updateQuestionMapping(qId, updates)}
      />

      {/* Data Source Selector Modal */}
      <SourceSelectorModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onOpenGoogleDrive={() => setIsDriveModalOpen(true)}
        onOpenGoogleForms={() => setIsFormsModalOpen(true)}
        onParsedSurveyReady={(result: ParseResult) => {
          handleStartReview(result.survey, result.profilerResult);
        }}
        onRestoreBackup={handleRestoreBackup}
      />

      {/* Google Forms Import & Review Modal */}
      <GoogleFormsModal
        isOpen={isFormsModalOpen}
        onClose={() => setIsFormsModalOpen(false)}
        onSurveyLoaded={(newSurvey) => loadSurvey(newSurvey)}
      />

      {/* Google Drive & Spreadsheets Explorer Modal */}
      <GoogleDriveSelectorModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onSurveyLoaded={(newSurvey) => loadSurvey(newSurvey)}
        onSpreadsheetReady={(newSurvey, profilerResult) => {
          handleStartReview(newSurvey, profilerResult);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Data Profiler Review Modal */}
      <SurveyMappingReviewModal
        isOpen={isReviewModalOpen}
        survey={surveyForReview}
        profilerResult={profilerResultForReview}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSurveyForReview(null);
          setProfilerResultForReview(null);
        }}
        onConfirm={handleConfirmReview}
      />

      {/* Theme Selector Modal (20 Themes) */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Global Auth Modal */}
      <AuthModal />

      {/* Global Settings & Credentials Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
