/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { duLieuApp, Company } from './data/du_lieu_app.ts';
import { ThresholdConfig, DEFAULT_THRESHOLDS } from './utils/metrics.ts';
import { Header } from './components/Header.tsx';
import { ThresholdModal } from './components/ThresholdModal.tsx';
import { HomeScreen } from './components/HomeScreen.tsx';
import { CompanyDetailScreen } from './components/CompanyDetailScreen.tsx';
import { TestRunScreen, CustomTestPayload } from './components/TestRunScreen.tsx';
import { UploadScreen } from './components/UploadScreen.tsx';

type ScreenState = 'home' | 'company-detail' | 'test-run' | 'upload';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('home');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [customData, setCustomData] = useState<CustomTestPayload | null>(null);

  // Thresholds state
  const [thresholds, setThresholds] = useState<ThresholdConfig>(DEFAULT_THRESHOLDS);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);

  // Navigate to Company Detail
  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setCustomData(null);
    setCurrentScreen('company-detail');
  };

  // Navigate to Test Run from Company Detail
  const handleStartTesting = () => {
    setCurrentScreen('test-run');
  };

  // Navigate to Upload Screen
  const handleGoToUpload = () => {
    setSelectedCompany(null);
    setCustomData(null);
    setCurrentScreen('upload');
  };

  // Run Custom Test from Uploaded CSV
  const handleRunCustomTest = (payload: CustomTestPayload) => {
    setCustomData(payload);
    setSelectedCompany(null);
    setCurrentScreen('test-run');
  };

  // Return to Home
  const handleBackToHome = () => {
    setSelectedCompany(null);
    setCustomData(null);
    setCurrentScreen('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Persistent Header */}
      <Header
        onOpenThresholds={() => setIsThresholdModalOpen(true)}
        thresholds={thresholds}
        onNavigateHome={handleBackToHome}
        showBackHome={currentScreen !== 'home'}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentScreen === 'home' && (
          <HomeScreen
            companies={duLieuApp.companies}
            onSelectCompany={handleSelectCompany}
            onGoToUpload={handleGoToUpload}
          />
        )}

        {currentScreen === 'company-detail' && selectedCompany && (
          <CompanyDetailScreen
            company={selectedCompany}
            onBack={handleBackToHome}
            onStartTesting={handleStartTesting}
          />
        )}

        {currentScreen === 'test-run' && (
          <TestRunScreen
            company={selectedCompany || undefined}
            customData={customData || undefined}
            thresholds={thresholds}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentScreen === 'upload' && (
          <UploadScreen
            onBack={handleBackToHome}
            onRunCustomTest={handleRunCustomTest}
          />
        )}
      </main>

      {/* Threshold Configuration Modal */}
      <ThresholdModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        thresholds={thresholds}
        onSave={(newThresholds) => setThresholds(newThresholds)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-medium text-slate-600">
            Trạm kiểm thử suy giảm mô hình AML · Minh họa nghiên cứu trôi dạt dữ liệu trên đồ thị Bitcoin Elliptic
          </p>
          <p className="text-slate-400 text-2xs">
            Toàn bộ tính toán AP, ECE, PSI và quy tắc phân luồng can thiệp chạy trực tiếp 100% trong trình duyệt người dùng.
          </p>
        </div>
      </footer>
    </div>
  );
}
