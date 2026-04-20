import React, { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../../common/Button/Button';
import styles from './CarePlanAssignmentModal.module.css';

const CARE_TEAMS = [
  { id: 1, name: 'Dr. Sarah Mitchell', specialty: 'Primary Care', members: 12 },
  { id: 2, name: 'Dr. James Chen', specialty: 'Cardiology', members: 8 },
  { id: 3, name: 'Dr. Emily Rodriguez', specialty: 'Endocrinology', members: 10 },
  { id: 4, name: 'Dr. Michael Thompson', specialty: 'Neurology', members: 7 },
  { id: 5, name: 'Dr. Patricia Kim', specialty: 'Pulmonology', members: 9 },
];

const INTERVENTION_TYPES = [
  { id: 1, name: 'Remote Monitoring', description: 'Continuous health tracking via wearables' },
  { id: 2, name: 'Medication Management', description: 'Medication adherence support' },
  { id: 3, name: 'Care Coordination', description: 'Coordinate care across providers' },
  { id: 4, name: 'Behavioral Health', description: 'Mental health and wellness support' },
  { id: 5, name: 'Nutrition Counseling', description: 'Personalized nutrition plans' },
];

function CarePlanAssignmentModal({ member, onClose, onAssign, position = null }) {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedInterventions, setSelectedInterventions] = useState([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleIntervention = (id) => {
    setSelectedInterventions(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (!selectedTeam) {
      alert('Please select a care team');
      return;
    }

    setIsSubmitting(true);
    try {
      const assignment = {
        memberId: member.id,
        careTeamId: selectedTeam,
        interventions: selectedInterventions,
        notes,
        assignedDate: new Date().toISOString(),
      };

      onAssign(assignment);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error assigning care team:', error);
      setIsSubmitting(false);
    }
  };

  const selectedTeamInfo = CARE_TEAMS.find(t => t.id === selectedTeam);
  const selectedInterventionLabels = selectedInterventions
    .map(id => INTERVENTION_TYPES.find(i => i.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Assign Care Team</h2>
            <p className={styles.subtitle}>
              Member: <strong>{member.name}</strong> (ID: {member.id})
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Care Team Selection */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Select Care Team</h3>
            <div className={styles.teamGrid}>
              {CARE_TEAMS.map(team => (
                <button
                  key={team.id}
                  className={`${styles.teamCard} ${selectedTeam === team.id ? styles.selected : ''}`}
                  onClick={() => setSelectedTeam(team.id)}
                >
                  <div className={styles.teamName}>{team.name}</div>
                  <div className={styles.teamSpecialty}>{team.specialty}</div>
                  <div className={styles.teamMembers}>{team.members} members assigned</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interventions Selection */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Select Interventions</h3>
            <div className={styles.interventionList}>
              {INTERVENTION_TYPES.map(intervention => (
                <label key={intervention.id} className={styles.interventionItem}>
                  <input
                    type="checkbox"
                    checked={selectedInterventions.includes(intervention.id)}
                    onChange={() => toggleIntervention(intervention.id)}
                    className={styles.checkbox}
                  />
                  <div className={styles.interventionContent}>
                    <div className={styles.interventionName}>{intervention.name}</div>
                    <div className={styles.interventionDesc}>{intervention.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Additional Notes (Optional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions or notes for the care team..."
              className={styles.textarea}
              rows={3}
            />
          </div>

          {/* Summary */}
          {selectedTeam && (
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Care Team:</span>
                <span className={styles.summaryValue}>{selectedTeamInfo?.name}</span>
              </div>
              {selectedInterventionLabels && (
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Interventions:</span>
                  <span className={styles.summaryValue}>{selectedInterventionLabels}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={!selectedTeam || isSubmitting}
          >
            {isSubmitting ? 'Assigning...' : 'Assign Care Team'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CarePlanAssignmentModal;
