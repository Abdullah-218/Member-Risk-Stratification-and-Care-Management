import React, { createContext, useState, useContext } from 'react';

const MemberContext = createContext();

export const useMembers = () => {
  const context = useContext(MemberContext);
  if (!context) {
    throw new Error('useMembers must be used within a MemberProvider');
  }
  return context;
};

export const MemberProvider = ({ children }) => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addMembers = (newMembers) => {
    setMembers(newMembers);
  };

  const updateMember = (memberId, updates) => {
    setMembers(prev =>
      prev.map(member =>
        member.id === memberId ? { ...member, ...updates } : member
      )
    );
  };

  const clearMembers = () => {
    setMembers([]);
    setSelectedMember(null);
  };

  const value = {
    members,
    selectedMember,
    setSelectedMember,
    addMembers,
    updateMember,
    clearMembers,
    loading,
    setLoading,
    error,
    setError
  };

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
};

export default MemberContext;