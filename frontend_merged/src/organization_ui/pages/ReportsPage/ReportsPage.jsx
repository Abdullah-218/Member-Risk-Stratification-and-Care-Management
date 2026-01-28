import React, { useState } from "react";
import { FileText, Download, Filter } from "lucide-react";
import PredictionWindowSelector 
from "../../components/common/PredictionWindowSelector";
import { usePredictionWindow } 
from "../../context/PredictionWindowContext";


// common components (organizational_login/components)
import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";

// styles
import styles from "./ReportsPage.module.css";

const ReportsPage = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { predictionWindow } = usePredictionWindow();

  const reportsByWindow = {
  30: [
    {
      id: 1,
      title: "Monthly Risk Summary (30-Day)",
      description: "Short-term risk projection and early signals",
      date: "2026-01-25",
      type: "Risk Analysis",
      size: "1.9 MB",
    },
    {
      id: 2,
      title: "Intervention Snapshot",
      description: "Immediate intervention outcomes",
      date: "2026-01-24",
      type: "Intervention",
      size: "2.1 MB",
    },
  ],
  60: [
    {
      id: 3,
      title: "Bi-Monthly Risk Summary (60-Day)",
      description: "Mid-term population health trends",
      date: "2026-01-21",
      type: "Risk Analysis",
      size: "2.4 MB",
    },
    {
      id: 4,
      title: "Financial Impact Analysis",
      description: "Cost savings & ROI over 60 days",
      date: "2026-01-20",
      type: "Financial",
      size: "2.9 MB",
    },
  ],
  90: [
    {
      id: 5,
      title: "Quarterly Business Review (90-Day)",
      description: "Long-term outcomes & executive insights",
      date: "2026-01-16",
      type: "Executive",
      size: "4.2 MB",
    },
    {
      id: 6,
      title: "Compliance & Audit Report",
      description: "Quarterly compliance overview",
      date: "2026-01-17",
      type: "Compliance",
      size: "1.5 MB",
    },
  ],
};
const reports = reportsByWindow[predictionWindow] || [];


  const filters = ['all', 'Risk Analysis', 'Demographics', 'Intervention', 'Financial', 'Compliance', 'Executive'];

  const filteredReports = selectedFilter === 'all'
    ? reports
    : reports.filter(report => report.type === selectedFilter);

  const handleDownloadReport = (report) => {
    const filename = `${report.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
    const element = document.createElement('a');
    const file = new Blob([`Report: ${report.title}\n\n${report.description}\n\nGenerated: ${new Date().toISOString()}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <FileText className={styles.icon} />
          <h1>Reports & Analytics</h1>
        </div>
        <p className={styles.subtitle}>Access and download comprehensive reports</p>
      </div>

      {/* ✅ GLOBAL PREDICTION WINDOW */}
<PredictionWindowSelector />

      <div className={styles.filterSection}>
        <div className={styles.filterGroup}>
          <Filter size={20} />
          <span className={styles.filterLabel}>Filter by type:</span>
          <div className={styles.filterButtons}>
            {filters.map(filter => (
              <button
                key={filter}
                className={`${styles.filterButton} ${selectedFilter === filter ? styles.active : ''}`}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.reportsGrid}>
        {filteredReports.map(report => (
          <Card key={report.id} className={styles.reportCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.reportTitle}>{report.title}</h3>
                <span className={styles.reportType}>{report.type}</span>
              </div>
            </div>
            
            <p className={styles.reportDescription}>{report.description}</p>
            
            <div className={styles.cardFooter}>
              <div className={styles.reportMeta}>
                <span className={styles.date}>{new Date(report.date).toLocaleDateString()}</span>
                <span className={styles.size}>{report.size}</span>
              </div>
              <Button variant="primary" size="small" onClick={() => handleDownloadReport(report)}>
                <Download size={16} />
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className={styles.emptyState}>
          <FileText size={48} />
          <p>No reports found for this filter</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
