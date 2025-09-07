import React, { useState, useCallback } from 'react';
import type { BusinessInfo } from './types';
import { extractInfoFromUrl, extractInfoFromText } from './services/geminiService';
import { Loader } from './components/Loader';
import { BusinessInfoTable } from './components/BusinessInfoTable';
import { MapPinIcon } from './components/icons/MapPinIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import { ClipboardIcon } from './components/icons/ClipboardIcon';

declare var XLSX: any;

const App: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [pastedText, setPastedText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');

  const [extractedData, setExtractedData] = useState<BusinessInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtractFromUrl = useCallback(async () => {
    if (!url) {
      setError('Please enter a Google Maps URL.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const infoList = await extractInfoFromUrl(url);
      if (infoList.length === 0) {
        setError("No business details could be extracted from this URL. Please try another.");
      } else {
        setExtractedData(prevData => [...infoList, ...prevData]);
      }
      setUrl(''); // Clear input on success
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  const handleExtractFromText = useCallback(async () => {
    if (!pastedText.trim()) {
      setError('Please paste some text to extract from.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const infoList = await extractInfoFromText(pastedText);
      if (infoList.length === 0) {
        setError("No business details could be extracted from the pasted text.");
      } else {
        setExtractedData(prevData => [...infoList, ...prevData]);
      }
      setPastedText(''); // Clear textarea on success
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [pastedText]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExtractFromUrl();
    }
  };
  
  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all extracted data?")) {
      setExtractedData([]);
    }
  };

  const handleDownloadXlsx = () => {
    if (extractedData.length === 0) return;

    const headers = ['S.No.', 'Business Name', 'Address', 'Contact Number'];
    const dataToExport = extractedData.map((row, index) => [
      index + 1,
      row.name,
      row.address,
      row.phone
    ]);
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataToExport]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Google Maps Data');
    
    // Auto-size columns
    const cols = Object.keys(worksheet).filter(key => key.match(/^[A-Z]+1$/)).map(key => {
        const col = key.replace(/[0-9]/g, '');
        const dataForCol = [headers[XLSX.utils.decode_col(col)], ...dataToExport.map(row => row[XLSX.utils.decode_col(col)])];
        const maxLength = Math.max(...dataForCol.map(item => String(item || '').length));
        return { wch: maxLength + 2 }; // +2 for padding
    });
    worksheet['!cols'] = cols;

    XLSX.writeFile(workbook, 'google_maps_data.xlsx');
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
            Bulk Maps Info Extractor
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            Paste a Google Maps URL or text to extract business details. To build a large list, go to the next page of results on Maps, then paste the new URL here.
          </p>
        </header>

        <main className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-slate-200">
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('url')}
              aria-pressed={activeTab === 'url'}
              className={`flex items-center gap-2 px-4 py-3 text-lg font-semibold border-b-4 transition-colors duration-300 ${activeTab === 'url' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <MapPinIcon className="w-6 h-6" />
              Extract from URL
            </button>
            <button
              onClick={() => setActiveTab('text')}
              aria-pressed={activeTab === 'text'}
              className={`flex items-center gap-2 px-4 py-3 text-lg font-semibold border-b-4 transition-colors duration-300 ${activeTab === 'text' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <ClipboardIcon className="w-6 h-6" />
              Paste & Extract
            </button>
          </div>

          {activeTab === 'url' ? (
            <div className="relative flex flex-col sm:flex-row items-center gap-4">
              <MapPinIcon className="absolute left-4 top-4 text-slate-400 hidden sm:block" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="https://www.google.com/maps/..."
                className="w-full h-14 pl-4 sm:pl-12 pr-40 py-2 text-lg text-slate-700 bg-slate-100 border-2 border-transparent rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 transition-shadow duration-300"
                disabled={isLoading}
              />
              <button
                onClick={handleExtractFromUrl}
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 sm:static sm:transform-none sm:h-14 sm:w-auto w-[calc(100%-1rem)] sm:px-8 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? 'Extracting...' : 'Extract Info'}
              </button>
            </div>
          ) : (
             <div className="flex flex-col items-center gap-4">
               <textarea
                 value={pastedText}
                 onChange={(e) => setPastedText(e.target.value)}
                 placeholder="Paste text copied from Google Maps here..."
                 className="w-full h-40 p-4 text-lg text-slate-700 bg-slate-100 border-2 border-transparent rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:border-indigo-500 transition-shadow duration-300 resize-none"
                 disabled={isLoading}
                 aria-label="Pasted text from Google Maps"
               />
               <button
                 onClick={handleExtractFromText}
                 disabled={isLoading}
                 className="w-full sm:w-auto h-14 px-8 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300"
               >
                 {isLoading ? 'Extracting...' : 'Extract from Text'}
               </button>
             </div>
          )}
        </main>

        <section className="mt-8">
          {isLoading && <Loader />}
          {error && (
            <div className="text-center p-4 bg-red-100 text-red-700 border border-red-200 rounded-lg" role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}

          {extractedData.length > 0 && (
            <div className="animate-fade-in">
              <div className="flex justify-end items-center gap-4 mb-4">
                 <button onClick={handleDownloadXlsx} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-colors duration-300">
                  <DownloadIcon className="w-5 h-5" />
                  Download Excel
                </button>
                 <button onClick={handleClearAll} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300 transition-colors duration-300">
                  <TrashIcon className="w-5 h-5" />
                  Clear All
                </button>
              </div>
              <BusinessInfoTable data={extractedData} />
            </div>
          )}
        </section>
        
        <footer className="text-center mt-12 text-slate-500 text-sm">
            <p>Powered by Google Gemini</p>
        </footer>
      </div>
       <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
        `}</style>
    </div>
  );
};

export default App;