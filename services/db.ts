
import { db as firestore } from '../lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
  getDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { User, Lead, LeadAssignment, Sale, AuditLog } from '../types';

export class DBService {
  // --- USERS ---
  async getUsers(): Promise<User[]> {
    const q = query(collection(firestore, 'users'), orderBy('id'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.data().id } as User));
  }

  async addUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    // We need to maintain the numeric ID system for now to avoid breaking the rest of the app,
    // even though Firestore uses string IDs.
    // In a full refactor, we would switch to string IDs everywhere.
    // For now, we'll find the max ID and increment.
    const allUsers = await this.getUsers();
    const nextId = Math.max(0, ...allUsers.map(u => u.id || 0)) + 1;

    const newUser: User = {
      ...user,
      id: nextId,
      created_at: new Date().toISOString()
    };

    // We use the numeric ID as the document ID for easier lookup/compatibility
    await updateDoc(doc(firestore, 'users', nextId.toString()), newUser).catch(async () => {
      // If update fails (doc doesn't exist), we use setDoc logic via specific doc ref or addDoc if we didn't care about ID
      // But here we want custom ID.
      // specific way to write to a custom id in v9:
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(firestore, 'users', nextId.toString()), newUser);
    });

    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<void> {
    const userRef = doc(firestore, 'users', id.toString());
    await updateDoc(userRef, updates);
  }

  async removeUser(id: number): Promise<void> {
    await deleteDoc(doc(firestore, 'users', id.toString()));
  }

  // --- LEADS ---
  async getLeads(): Promise<Lead[]> {
    const q = query(collection(firestore, 'leads'), orderBy('id', 'desc')); // Newer leads first
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Lead);
  }

  async addLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    // Get max ID for leads (Auto-increment emulation)
    // efficient way: keep a counter doc. simple way (ok for low volume): read all.
    // optimization: query for only 1 doc ordered by id desc.
    const q = query(collection(firestore, 'leads'), orderBy('id', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    const maxId = snapshot.empty ? 0 : snapshot.docs[0].data().id;
    const nextId = maxId + 1;

    const newLead: Lead = {
      ...lead,
      id: nextId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Use setDoc to force custom ID usage
    const { setDoc } = await import('firebase/firestore');
    await setDoc(doc(firestore, 'leads', nextId.toString()), newLead);
    return newLead;
  }

  async updateLeadStatus(leadId: number, status: Lead['status']): Promise<any> {
    const leadRef = doc(firestore, 'leads', leadId.toString());
    const snap = await getDoc(leadRef);

    if (snap.exists()) {
      const oldStatus = snap.data().status;
      await updateDoc(leadRef, {
        status,
        updated_at: new Date().toISOString()
      });
      return { status: oldStatus };
    }
    return null;
  }

  // --- ASSIGNMENTS ---
  async getAssignments(): Promise<LeadAssignment[]> {
    // Optimize: maybe load only today's? For now, load all to keep consistent with old logic
    const snapshot = await getDocs(collection(firestore, 'assignments'));
    return snapshot.docs.map(doc => doc.data() as LeadAssignment);
  }

  async assignLead(leadId: number, userId: number, assignedBy: string): Promise<LeadAssignment | null> {
    const today = new Date().toISOString().split('T')[0];

    // 1. Check User Limit
    const userRef = doc(firestore, 'users', userId.toString());
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    const user = userSnap.data() as User;

    if (user.role === 'employee') {
      const q = query(
        collection(firestore, 'assignments'),
        where('assigned_to', '==', userId),
        where('active', '==', true)
      );
      const snaps = await getDocs(q);
      // Client-side date filter because Firestore string-matching is tricky with "startsWith" without specific index
      // Or store proper ISO dates.
      const todayCount = snaps.docs.filter(d => d.data().assigned_at.startsWith(today)).length;

      if (todayCount >= user.daily_lead_target) return null;
    }

    // 2. Deactivate old assignments for this lead
    const oldAssignsQuery = query(collection(firestore, 'assignments'), where('lead_id', '==', leadId));
    const oldAssignsSnap = await getDocs(oldAssignsQuery);

    const batchOps = [];
    const { writeBatch } = await import('firebase/firestore');
    const batch = writeBatch(firestore);

    oldAssignsSnap.forEach(d => {
      batch.update(d.ref, { active: false });
    });

    // 3. Create new assignment
    // Get Max ID
    const qMax = query(collection(firestore, 'assignments'), orderBy('id', 'desc'), limit(1));
    const maxSnap = await getDocs(qMax);
    const nextId = maxSnap.empty ? 1 : maxSnap.docs[0].data().id + 1;

    const newAssignment: LeadAssignment = {
      id: nextId,
      lead_id: leadId,
      assigned_to: userId,
      assigned_by: assignedBy,
      assigned_at: new Date().toISOString(),
      active: true
    };

    const newRef = doc(firestore, 'assignments', nextId.toString());
    batch.set(newRef, newAssignment);

    await batch.commit();
    return newAssignment;
  }

  // --- SALES ---
  async getSales(): Promise<Sale[]> {
    const snapshot = await getDocs(collection(firestore, 'sales'));
    return snapshot.docs.map(doc => doc.data() as Sale);
  }

  async addSale(sale: Omit<Sale, 'id' | 'sale_date' | 'sale_time' | 'timestamp' | 'created_at'>): Promise<Sale> {
    const now = new Date();

    const qMax = query(collection(firestore, 'sales'), orderBy('id', 'desc'), limit(1));
    const maxSnap = await getDocs(qMax);
    const nextId = maxSnap.empty ? 1 : maxSnap.docs[0].data().id + 1;

    const newSale: Sale = {
      ...sale,
      id: nextId,
      sale_date: now.toISOString().split('T')[0],
      sale_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.toISOString(),
      created_at: now.toISOString()
    };

    const { setDoc } = await import('firebase/firestore');
    await setDoc(doc(firestore, 'sales', nextId.toString()), newSale);
    return newSale;
  }

  // --- AUDIT ---
  async addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    const { addDoc, collection } = await import('firebase/firestore');
    // Using auto-ID for logs, don't care about numeric ID here as much
    await addDoc(collection(firestore, 'audit_logs'), {
      ...log,
      created_at: new Date().toISOString()
    });
  }
}

export const db = new DBService();
