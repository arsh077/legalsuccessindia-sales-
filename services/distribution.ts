
import { db } from './db';
import { Lead, User, UserRole } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';

export type DistributionStrategy = 'equal' | 'target-based' | 'skill-based';

// Fixed: distributeLeads is now async to handle Promise-based DB calls
export const distributeLeads = async (
  leadsToDistribute: Lead[],
  strategy: DistributionStrategy,
  adminId: number
) => {
  const today = new Date().toISOString().split('T')[0];

  // Fixed: Query only today's assignments instead of all
  // Note: Firestore doesn't support startsWith, so we query by range
  const startOfDay = `${today}T00:00:00`;
  const endOfDay = `${today}T23:59:59`;

  const assignmentsQuery = query(
    collection(await import('../src/lib/firebase').then(m => m.db), 'assignments'),
    where('active', '==', true),
    where('assigned_at', '>=', startOfDay),
    where('assigned_at', '<=', endOfDay)
  );

  const assignmentsSnap = await getDocs(assignmentsQuery);
  const activeAssignments = assignmentsSnap.docs.map(d => d.data() as any);

  // 1. Get all active employees and calculate their REAL-TIME assignment state
  // Fixed: Await the Promise returned by getUsers()
  const users = await db.getUsers();
  const employeesWithCapacity = users
    .filter(u => u.role === UserRole.EMPLOYEE && u.is_active)
    .map(emp => {
      const assignedCount = activeAssignments.filter(a => a.assigned_to === emp.id).length;
      return {
        ...emp,
        assigned_count: assignedCount,
        remaining_capacity: emp.daily_lead_target - assignedCount
      };
    })
    .filter(emp => emp.remaining_capacity > 0);

  if (employeesWithCapacity.length === 0) {
    return { assigned: 0, skipped: leadsToDistribute.length, error: 'No active employees with remaining capacity found.' };
  }

  const results: { employee_id: number; lead_id: number }[] = [];

  // Sort leads for processing
  const leadsQueue = [...leadsToDistribute];

  // 2. DISTRIBUTION LOOP
  for (const lead of leadsQueue) {
    // Re-evaluate the pool after every single assignment for perfect balance
    // We sort by: 
    // a) Experience Level (Senior first)
    // b) Assigned Count Today (ASC - the one with the FEWEST leads today gets next)
    // c) Remaining Capacity (DESC - tie breaker)
    employeesWithCapacity.sort((a, b) => {
      // Priority 1: Seniors get priority over New
      if (a.experience_level === 'senior' && b.experience_level === 'new') return -1;
      if (a.experience_level === 'new' && b.experience_level === 'senior') return 1;

      // Priority 2: EQUAL DIVISION (Least assigned today gets it next)
      if (a.assigned_count !== b.assigned_count) {
        return a.assigned_count - b.assigned_count;
      }

      // Priority 3: If counts are same, pick the one with more target left
      return b.remaining_capacity - a.remaining_capacity;
    });

    if (employeesWithCapacity.length === 0) break;

    // Filter by skills if the strategy demands it
    let candidatePool = employeesWithCapacity;
    if (strategy === 'skill-based') {
      const skilled = employeesWithCapacity.filter(e => e.skills.includes(lead.process_type));
      if (skilled.length > 0) candidatePool = skilled;
    }

    const chosen = candidatePool[0];

    // Safety check
    if (!chosen) continue;

    results.push({ employee_id: chosen.id, lead_id: lead.id });

    // Update local tracker for next iteration in this loop
    chosen.assigned_count++;
    chosen.remaining_capacity--;

    // Remove if they hit their absolute limit
    if (chosen.remaining_capacity <= 0) {
      const idx = employeesWithCapacity.findIndex(e => e.id === chosen.id);
      if (idx !== -1) employeesWithCapacity.splice(idx, 1);
    }
  }

  // 3. PERSIST TO BACKEND
  // Fixed: Use for...of to correctly await inside loop
  for (const res of results) {
    await db.assignLead(res.lead_id, res.employee_id, `auto_dist_admin_${adminId}`);
    await db.addAuditLog({
      user_id: adminId,
      action_type: 'LEAD_ASSIGNED',
      entity_type: 'lead',
      entity_id: res.lead_id,
      new_value: {
        assigned_to: res.employee_id,
        reason: 'Seniority Balanced Round-Robin'
      }
    });
  }

  return {
    assigned: results.length,
    skipped: leadsToDistribute.length - results.length
  };
};
