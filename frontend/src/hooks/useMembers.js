import { useContext } from 'react';
import MemberContext from '../context/MemberContext';

export const useMembers = () => {
  const context = useContext(MemberContext);
  
  if (!context) {
    throw new Error('useMembers must be used within a MemberProvider');
  }
  
  return context;
};

export default useMembers;