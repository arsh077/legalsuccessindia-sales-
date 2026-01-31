
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Lead, LeadAssignment, Sale, AuditLog } from '../types';
import { db } from '../services/db'; // Keep this for login/manual async ops if needed, or direct firestore
import { db as firestore } from '../src/lib/firebase';
import { collection, onSnapshot, query, orderBy, where, addDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSyncing: boolean;
  data: {
    users: User[];
    leads: Lead[];
    assignments: LeadAssignment[];
    sales: Sale[];
  };
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshAllData: () => Promise<void>; // Kept for interface compatibility, though auto-sync handles it
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(true);

  const [data, setData] = useState({
    users: [] as User[],
    leads: [] as Lead[],
    assignments: [] as LeadAssignment[],
    sales: [] as Sale[]
  });

  // Real-time synchronization
  useEffect(() => {
    // 1. Users Listener
    const unsubUsers = onSnapshot(query(collection(firestore, 'users'), orderBy('id')), (snap) => {
      const users = snap.docs.map(d => ({ ...d.data(), id: d.data().id } as User));
      setData(prev => ({ ...prev, users }));

      // Update current session user in real-time
      const savedUserId = localStorage.getItem('lsi_session_uid');
      if (savedUserId) {
        const found = users.find(u => u.id === parseInt(savedUserId));
        if (found && found.is_active) {
          setUser(found);
        } else if (found && !found.is_active) {
          // Auto logout if deactivated
          if (localStorage.getItem('lsi_session_uid')) { // Only if currently logged in
            setUser(null);
            localStorage.removeItem('lsi_session_uid');
          }
        }
      }
    });

    // 2. Leads Listener
    const unsubLeads = onSnapshot(query(collection(firestore, 'leads'), orderBy('id', 'desc')), (snap) => {
      const leads = snap.docs.map(d => d.data() as Lead);
      setData(prev => ({ ...prev, leads }));
    });

    // 3. Assignments Listener
    const unsubAssigns = onSnapshot(collection(firestore, 'assignments'), (snap) => {
      const assignments = snap.docs.map(d => d.data() as LeadAssignment);
      setData(prev => ({ ...prev, assignments }));
    });

    // 4. Sales Listener
    const unsubSales = onSnapshot(collection(firestore, 'sales'), (snap) => {
      const sales = snap.docs.map(d => d.data() as Sale);
      setData(prev => ({ ...prev, sales }));
    });

    // Initial loading done when first snapshots arrive (approximate)
    // We'll set loading to false after a short timeout to allow initial data to populate
    // or we could track all ready states. For simplicity:
    const timer = setTimeout(() => {
      setLoading(false);
      setIsSyncing(false);
    }, 1000);

    return () => {
      unsubUsers();
      unsubLeads();
      unsubAssigns();
      unsubSales();
      clearTimeout(timer);
    };
  }, []);

  const refreshAllData = async () => {
    // No-op mainly, as listeners handle it. 
    // Could be used to force a specific check if needed, but not with onSnapshot
    console.log("Data auto-synced via Firestore");
  };

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    // Use the data currently loaded in state for instant check
    // Or query firestore directly to be safe
    const { getDocs, query, where, collection } = await import('firebase/firestore');
    const q = query(collection(firestore, 'users'), where('email', '==', cleanEmail));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const userData = snap.docs[0].data() as User;
      if (userData.is_active && userData.password === password) {
        setUser(userData);
        localStorage.setItem('lsi_session_uid', userData.id.toString());

        // Log login
        await addDoc(collection(firestore, 'audit_logs'), {
          user_id: userData.id,
          action_type: 'USER_LOGIN',
          entity_type: 'user',
          entity_id: userData.id,
          created_at: new Date().toISOString()
        });
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    if (user) {
      // Fire and forget log
      addDoc(collection(firestore, 'audit_logs'), {
        user_id: user.id,
        action_type: 'USER_LOGOUT',
        entity_type: 'user',
        entity_id: user.id,
        created_at: new Date().toISOString()
      });
    }
    setUser(null);
    localStorage.removeItem('lsi_session_uid');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isSyncing, data, login, logout, refreshAllData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
