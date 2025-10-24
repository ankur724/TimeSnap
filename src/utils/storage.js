// storage.js
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const savePunchRecord = (record) => {
  try {
    const existing = storage.getString('punchHistory');
    const history = existing ? JSON.parse(existing) : [];
    const filtered = [...history, record].slice(-5); // Keep last 5 records
    storage.set('punchHistory', JSON.stringify(filtered));
  } catch (e) {
    console.log('Error saving record', e);
  }
};

export const loadPunchHistory = () => {
  try {
    const existing = storage.getString('punchHistory');
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    console.log('Error loading history', e);
    return [];
  }
};
