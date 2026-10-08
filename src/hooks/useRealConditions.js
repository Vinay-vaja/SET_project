// useRealConditions.js — Custom hook to consume real-world environmental conditions
import { useRealData } from '../context/RealDataContext.jsx';

export function useRealConditions() {
  return useRealData();
}

export default useRealConditions;
