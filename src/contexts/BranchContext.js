import React, {createContext, useState, useContext, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BranchContext = createContext(null);

export const BranchProvider = ({children}) => {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedBranch();
  }, []);

  const loadSavedBranch = async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedBranch');
      if (saved) {
        setSelectedBranch(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved branch:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectBranch = async branch => {
    setSelectedBranch(branch);
    if (branch) {
      try {
        await AsyncStorage.setItem('selectedBranch', JSON.stringify(branch));
      } catch (error) {
        console.error('Error saving branch:', error);
      }
    } else {
      try {
        await AsyncStorage.removeItem('selectedBranch');
      } catch (error) {
        console.error('Error removing branch:', error);
      }
    }
  };

  return (
    <BranchContext.Provider
      value={{
        selectedBranch,
        selectBranch,
        branches,
        setBranches,
        loading,
      }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within BranchProvider');
  }
  return context;
};
