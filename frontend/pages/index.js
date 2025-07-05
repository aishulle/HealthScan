// pages/index.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TrendChart from '../components/TrendChart';
import { motion, AnimatePresence } from 'framer-motion';
import BodyDiagram from '../components/BodyDiagram';

export default function Home() {
  const router = useRouter();

  const [file, setFile] = useState(null);
  const [insights, setInsights] = useState([]);
  const [medicalInsights, setMedicalInsights] = useState([]);
  const [patientInfo, setPatientInfo] = useState({});
  const [bodyAnalysis, setBodyAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);

  /* ─────────── ROUTE-PROTECTION ─────────── */
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('authenticated') !== 'true') {
      router.replace('/login');
    }
  }, [router]);

  /* ─────────── CONSTANTS ─────────── */
  const idealValues = {
    Hemoglobin: 15.0,
    'RBC Count': 5.0,
    PCV: 45,
    MCV: 90,
    MCH: 30,
    MCHC: 33,
    'RDW (CV)': 13,
    'RDW-SD': 40,
    TLC: 7.0,
    Neutrophils: 60,
    Lymphocytes: 30,
    Monocytes: 5,
    Eosinophils: 2,
    Basophils: 0.5,
    'Platelet Count': 280,
    'Neutrophils Absolute': 4.0,
    'Lymphocytes Absolute': 2.0,
    'Monocytes Absolute': 0.5,
    'Eosinophils Absolute': 0.2,
    'Basophils Absolute': 0.05
  };

  const importantTests = [
    'Hemoglobin',
    'TLC',
    'Platelet Count',
    'Lymphocytes',
    'MCHC',
    'Neutrophils',
    'RBC Count'
  ];

  /* ─────────── HELPERS ─────────── */
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const processAnalysisData = (analysisData) => {
    if (!analysisData || !analysisData.analysis) {
      console.error('No analysis data received');
      return;
    }

    const { analysis, insights: backendInsights } = analysisData;
    
    setPatientInfo(analysis.patient_info || {});
    
    if (Array.isArray(backendInsights)) {
      setMedicalInsights(backendInsights);
    } else {
      setMedicalInsights([]);
    }
    
    if (analysis.body_analysis) {
      setBodyAnalysis(analysis.body_analysis);
    }
    
    const processedResults = analysis.test_results.map(test => ({
      name: test.test,
      value: test.value,
      unit: test.unit,
      status: test.status,
      status_type: test.status_type,
      flag: test.flag,
      flag_message: test.flag_message,
      normal_range: test.normal_range,
      body_part: test.body_part,
      isImportant: importantTests.includes(test.test)
    }));
    
    setInsights(processedResults);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setHasUploaded(true);

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('http://127.0.0.1:8000/upload', { 
        method: 'POST', 
        body: fd 
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      processAnalysisData(data);
      
    } catch (err) {
      console.error('Upload error:', err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const chartData = insights
    .filter((r) => idealValues[r.name] && importantTests.includes(r.name))
    .map((r) => ({ 
      parameter: r.name, 
      Current: r.value, 
      Ideal: idealValues[r.name] 
    }));

  return (
    <main className="min-h-screen bg-[#f6efea] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-6xl bg-white shadow-xl rounded-2xl overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#c0a58e] to-[#997156] p-6 text-center text-black">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold">
              <span className="inline-block mr-2">
                <svg className="w-6 h-6 md:w-8 md:h-8 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </span>
              MyHealthScan
            </h1>
            <p className="mt-2 text-sm opacity-90">
              Upload a report to view comprehensive health insights and trends
            </p>
          </motion.div>

          {patientInfo.name && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm inline-block"
            >
              <p className="text-sm">
                <strong>Patient:</strong> {patientInfo.name}
                {patientInfo.date && (
                  <span className="ml-3 md:ml-4">
                    <strong>Date:</strong> {patientInfo.date}
                  </span>
                )}
              </p>
            </motion.div>
          )}
        </header>

        {/* Main Content */}
        <div className="p-6 md:p-8">
          {/* Two Column Section */}
          <section className="flex flex-col lg:flex-row gap-6 mb-6">
            {/* Left Column */}
            <div className="w-full lg:w-1/2 space-y-5">
              {/* File Upload Card */}
              <motion.div 
                className="bg-white border border-[#e7d8c5] rounded-lg p-5 shadow-sm"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center mb-4">
                  <div className="bg-[#f3e9e0] p-2 rounded-full mr-3">
                    <svg className="w-5 h-5 text-[#997156]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-[#3a2e26]">Upload Lab Report</h3>
                </div>
                
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-[#111011] border-2 border-dashed border-[#e7d8c5] rounded-lg p-4 hover:border-[#997156] transition cursor-pointer"
                  />

                  <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className={`w-full py-3 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2
                      ${loading ? 'bg-gray-400' : 'bg-[#997156] hover:bg-[#7a3b3b] shadow-md'}`}
                  >
                    {loading ? (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          className="animate-spin h-5 w-5 text-white"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Upload & Analyze
                      </>
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Body Analysis Section */}
              <AnimatePresence>
                {bodyAnalysis && (
                  <motion.div
                    key="body-analysis"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="p-5 bg-white border border-[#e7d8c5] rounded-lg shadow-sm"
                  >
                    <div className="flex items-center mb-3">
                      <svg className="w-5 h-5 mr-2 text-[#997156]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a4 4 0 008 0V7M8 7H4m4 0h4m4 0a4 4 0 014 4v1a3 3 0 003 3h1m-8-8h1m4 0h1" />
                      </svg>
                      <h3 className="text-lg font-semibold text-[#3a2e26]">Body Analysis</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-[#3a2e26]">
                        <strong>Affected Systems:</strong> 
                        <span className="ml-2">
                          {bodyAnalysis.affected_parts.join(', ') || 'None'}
                        </span>
                      </p>
                      <p className="text-sm text-[#3a2e26]">
                        <strong>Most Affected:</strong> 
                        <span className="ml-2">
                          {bodyAnalysis.most_affected_part}
                        </span>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Body Impact Visualization */}
              <AnimatePresence>
                {bodyAnalysis && (
                  <motion.div
                    key="body-diagram"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="bg-white p-5 border border-[#e7d8c5] rounded-lg shadow-sm"
                  >
                    <div className="flex items-center mb-3">
                      <svg className="w-5 h-5 mr-2 text-[#997156]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-[#3a2e26]">Body Impact Visualization</h3>
                    </div>
                    <BodyDiagram 
                      affectedParts={bodyAnalysis.affected_parts} 
                      mostAffected={bodyAnalysis.most_affected_part}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Medical Insights Section */}
              <AnimatePresence>
                {medicalInsights.length > 0 && (
                  <motion.div
                    key="insights"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="p-5 bg-white border border-[#e7d8c5] rounded-lg shadow-sm"
                  >
                    <div className="flex items-center mb-3">
                      <svg className="w-5 h-5 mr-2 text-[#997156]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-[#3a2e26]">Key Medical Insights</h3>
                    </div>
                    
                    <ul className="space-y-3">
                      {medicalInsights.map((insight, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-3 rounded-md ${
                            insight.severity === 'danger'
                              ? 'bg-red-50 border-l-4 border-red-500'
                              : insight.severity === 'warning'
                              ? 'bg-amber-50 border-l-4 border-amber-500'
                              : 'bg-[#f5f5f0] border-l-4 border-[#997156]'
                          }`}
                        >
                          <div className="flex items-start">
                            <span className={`mt-0.5 mr-2 ${
                              insight.severity === 'danger'
                                ? 'text-red-500'
                                : insight.severity === 'warning'
                                ? 'text-amber-500'
                                : 'text-[#997156]'
                            }`}>
                              {insight.severity === 'danger' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-[#3a2e26]">
                                {insight.message}
                              </p>
                              {insight.body_part && (
                                <div className="mt-1 flex items-center text-xs text-gray-500">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span>Affected system: {insight.body_part}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column */}
            <div className="w-full lg:w-1/2 space-y-6">
              {/* Results Table */}
              <AnimatePresence>
                {insights.length > 0 && (
                  <motion.div
                    key="table"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    <div className="p-4 border-b border-[#e7d8c5]">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-[#997156]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="text-lg font-semibold text-[#3a2e26]">Complete Blood Count Results</h3>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-[#f5ebe0] text-[#3a2e26] font-medium">
                          <tr>
                            <th className="py-3 px-4 text-left">Parameter</th>
                            <th className="py-3 px-4 text-left">Value</th>
                            <th className="py-3 px-4 text-left">Unit</th>
                            <th className="py-3 px-4 text-left">Range</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-left">System</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e7d8c5]">
                          {insights.map((row, i) => (
                            <tr
                              key={i}
                              className={`hover:bg-[#f9f5f0] transition-colors ${
                                row.isImportant ? 'font-medium' : ''
                              }`}
                            >
                              <td className={`py-3 px-4 ${row.isImportant ? 'text-[#3a2e26]' : 'text-gray-600'}`}>
                                {row.name}
                                {row.isImportant && (
                                  <span className="ml-1 text-xs text-[#997156]">★</span>
                                )}
                              </td>
                              <td className={`py-3 px-4 ${
                                row.status === 'High' 
                                  ? 'text-red-600' 
                                  : row.status === 'Low' 
                                    ? 'text-amber-600' 
                                    : 'text-gray-600'
                              }`}>
                                {row.value}
                              </td>
                              <td className="py-3 px-4 text-gray-600">{row.unit}</td>
                              <td className="py-3 px-4 text-xs text-gray-600">{row.normal_range}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${
                                      row.status === 'High'
                                        ? 'bg-red-100 text-red-800'
                                        : row.status === 'Low'
                                        ? 'bg-amber-100 text-amber-800'
                                        : row.status === 'Normal'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                  {row.status}
                                  {row.flag && (
                                    <span className="ml-1 animate-pulse">⚠️</span>
                                  )}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs text-gray-600">
                                {row.body_part}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No Data Message */}
              {!loading && hasUploaded && insights.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center p-8 bg-white rounded-lg shadow-sm border border-[#e7d8c5]"
                >
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500">No analysis results yet. Please ensure you've uploaded a valid medical report.</p>
                </motion.div>
              )}
            </div>
          </section>

          {/* Full Width Trend Chart Section */}
          <AnimatePresence>
            {chartData.length > 0 && (
              <motion.div
                key="chart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-5 rounded-lg shadow-sm border border-[#e7d8c5] w-full"
              >
                <div className="flex items-center mb-4">
                  <svg className="w-5 h-5 mr-2 text-[#997156]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-[#3a2e26]">Key Metrics Comparison</h3>
                </div>
                <div className="w-full h-96">
                  <TrendChart data={chartData} />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ★ indicates clinically important parameters
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#ecebe4] p-4 text-center">
          <button
            onClick={() => {
              localStorage.removeItem('authenticated');
              router.replace('/login');
            }}
            className="text-sm text-[#997156] hover:text-[#7a3b3b] transition flex items-center justify-center gap-1 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </footer>
      </div>
    </main>
  );
}