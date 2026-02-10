import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import './BrandUpload.css';

const BrandUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ total: 0, uploaded: 0, skipped: 0 });
  const [message, setMessage] = useState('');

  // CSV 파싱 함수 (따옴표 처리)
  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const line = lines[i];
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      if (values.length >= headers.length) {
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        data.push(row);
      }
    }
    
    return data;
  };

  // 가맹점 수 문자열을 숫자로 변환 (예: "1,998" -> 1998)
  const parseStoreCount = (storeCountStr) => {
    if (!storeCountStr || storeCountStr.trim() === '') return 0;
    const numStr = storeCountStr.replace(/,/g, '').trim();
    const num = parseInt(numStr, 10);
    return isNaN(num) ? 0 : num;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setMessage('');
    } else {
      setMessage('CSV 파일만 업로드 가능합니다.');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    setMessage('');
    setProgress({ total: 0, uploaded: 0, skipped: 0 });

    try {
      const text = await file.text();
      const csvData = parseCSV(text);

      if (csvData.length === 0) {
        setMessage('CSV 파일에 데이터가 없습니다.');
        setUploading(false);
        return;
      }

      setProgress(prev => ({ ...prev, total: csvData.length }));

      let uploaded = 0;
      let skipped = 0;

      for (const row of csvData) {
        const brandName = row['브랜드명'] || row['brandName'] || '';
        
        if (!brandName || brandName.trim() === '') {
          skipped++;
          continue;
        }

        const brandNameLower = brandName.toLowerCase().trim();
        
        // 중복 체크
        const existingQuery = query(
          collection(db, 'brands'),
          where('nameLower', '==', brandNameLower)
        );
        const existingDocs = await getDocs(existingQuery);
        
        if (!existingDocs.empty) {
          skipped++;
          continue;
        }

        // 데이터 준비
        const brandData = {
          name: brandName.trim(),
          nameLower: brandNameLower,
          category: row['카테고리'] || row['category'] || '',
          storeCount: parseStoreCount(row['가맹점 수'] || row['storeCount'] || ''),
          expectedCost: row['예상 창업 비용'] || row['expectedCost'] || '',
          note: row['비고'] || row['note'] || '',
          isCustom: false,
          isActive: true,
          createdAt: serverTimestamp(),
          usageCount: 0
        };

        // Firestore에 추가
        await addDoc(collection(db, 'brands'), brandData);
        uploaded++;
        
        setProgress(prev => ({ ...prev, uploaded, skipped }));
      }

      setMessage(`업로드 완료: ${uploaded}개 추가, ${skipped}개 건너뜀 (중복 또는 빈 값)`);
      setFile(null);
      setUploading(false);
    } catch (error) {
      console.error('업로드 오류:', error);
      setMessage(`업로드 중 오류가 발생했습니다: ${error.message}`);
      setUploading(false);
    }
  };

  return (
    <div className="brand-upload-container">
      <h2 className="brand-upload-title">브랜드 업로드(사용 금지, 베타 테스트 중)</h2>
      <div className="brand-upload-content">
        <div className="brand-upload-form">
          <label className="brand-upload-label">
            CSV 파일 선택:
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={uploading}
              className="brand-upload-input"
            />
          </label>
          
          {file && (
            <div className="brand-upload-file-info">
              선택된 파일: {file.name}
            </div>
          )}

          {uploading && (
            <div className="brand-upload-progress">
              <div className="progress-text">
                진행 중: {progress.uploaded} / {progress.total} ({progress.skipped}개 건너뜀)
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${progress.total > 0 ? (progress.uploaded / progress.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          )}

          {message && (
            <div className={`brand-upload-message ${message.includes('오류') ? 'error' : ''}`}>
              {message}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="brand-upload-button"
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandUpload;
