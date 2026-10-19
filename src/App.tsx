import React, { useState, useEffect, useMemo } from 'react';
import { duLieuApp, Company } from './data/du_lieu_app.ts';
import { ThresholdConfig, DEFAULT_THRESHOLDS } from './utils/metrics.ts';
import { Sidebar, ScreenState } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { HomeScreen } from './components/HomeScreen.tsx';
import { CompanyDetailScreen } from './components/CompanyDetailScreen.tsx';
import { TestRunScreen, CustomTestPayload } from './components/TestRunScreen.tsx';
import { UploadScreen } from './components/UploadScreen.tsx';
import { ThresholdModal } from './components/ThresholdModal.tsx';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('home');
  const [selectedCompanyCode, setSelectedCompanyCode] = useState<string>('A');
  const [customData, setCustomData] = useState<CustomTestPayload | null>(null);

  // Thresholds state
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [showThresholdModal, setShowThresholdModal] = useState<boolean>(false);

  // Sync dark mode class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Selected company object
  const currentCompany = useMemo(() => {
    return duLieuApp.companies.find((c) => c.code === selectedCompanyCode) || duLieuApp.companies[0];
  }, [selectedCompanyCode]);

  // Navigate to Company Detail
  const handleSelectCompany = (company: Company) => {
    setSelectedCompanyCode(company.code);
    setCustomData(null);
    setCurrentScreen('company_detail');
  };

  // Start Testing from Company Detail
  const handleStartTesting = () => {
    setCurrentScreen('testing');
  };

  // Navigate to Upload Screen
  const handleGoToUpload = () => {
    setCurrentScreen('upload');
  };

  // Run Custom Test from Uploaded CSV
  const handleRunCustomTest = (payload: CustomTestPayload) => {
    setCustomData(payload);
    setCurrentScreen('testing');
  };

  // Return to Home
  const handleBackToHome = () => {
    setCustomData(null);
    setCurrentScreen('home');
  };

  return (
    <div className="min-h-screen flex font-sans bg-[#FAF4EB] dark:bg-[#1A1513] text-[#38312C] dark:text-[#F5EFE8] transition-colors duration-200">
      {/* ==================== CỘT BÊN TRÁI (SIDEBAR CLAYMORPHIC) ==================== */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenThresholds={() => setShowThresholdModal(true)}
        thresholds={thresholds}
        currentCompanyName={customData ? customData.name : currentCompany?.name}
        hasSelectedCompany={!!currentCompany || !!customData}
      />

      {/* ==================== KHU VỰC NỘI DUNG CHÍNH (BÊN PHẢI) ==================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Khu Vực Nội Dung */}
        <Header
          onOpenThresholds={() => setShowThresholdModal(true)}
          thresholds={thresholds}
        />

        {/* Content Screens */}
        {currentScreen === 'home' && (
          <HomeScreen
            companies={duLieuApp.companies}
            onSelectCompany={handleSelectCompany}
            onGoToUpload={handleGoToUpload}
          />
        )}

        {currentScreen === 'company_detail' && (
          <CompanyDetailScreen
            company={currentCompany}
            onBack={handleBackToHome}
            onStartTesting={handleStartTesting}
          />
        )}

        {currentScreen === 'testing' && (
          <TestRunScreen
            company={customData ? undefined : currentCompany}
            customData={customData || undefined}
            thresholds={thresholds}
            onBackToHome={handleBackToHome}
            isDarkMode={isDarkMode}
          />
        )}

        {currentScreen === 'upload' && (
          <UploadScreen
            onBack={handleBackToHome}
            onRunCustomTest={handleRunCustomTest}
          />
        )}

        {/* Threshold Configuration Modal */}
        <ThresholdModal
          isOpen={showThresholdModal}
          onClose={() => setShowThresholdModal(false)}
          thresholds={thresholds}
          onSave={(newThresholds) => setThresholds(newThresholds)}
        />
      </div>
    </div>
  );
}
