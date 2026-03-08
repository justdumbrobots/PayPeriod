/**
 * Offline-first local cache using IndexedDB via Dexie.
 * Mirrors the Supabase schema for offline access.
 */
import Dexie, { type Table } from 'dexie'
import type { Bill, ExtraItem, UserProfile } from '../types'

class PayPeriodDB extends Dexie {
  userProfiles!: Table<UserProfile>
  bills!: Table<Bill>
  extraItems!: Table<ExtraItem>

  constructor() {
    super('PayPeriodDB')
    this.version(1).stores({
      userProfiles: 'id, authUserId',
      bills: 'id, userId, status, frequency, sortOrder',
      extraItems: 'id, userId, periodIndex',
    })
  }
}

export const db = new PayPeriodDB()

// ─── Sync Helpers ─────────────────────────────────────────────────────────────

/** Write profile to local cache */
export async function cacheProfile(profile: UserProfile) {
  await db.userProfiles.put(profile)
}

/** Read profile from local cache */
export async function getCachedProfile(userId: string): Promise<UserProfile | undefined> {
  return db.userProfiles.where('authUserId').equals(userId).first()
}

/** Write bills to local cache */
export async function cacheBills(bills: Bill[]) {
  await db.bills.bulkPut(bills)
}

/** Read bills from local cache */
export async function getCachedBills(userId: string): Promise<Bill[]> {
  return db.bills.where('userId').equals(userId).toArray()
}

/** Write extra items to local cache */
export async function cacheExtraItems(items: ExtraItem[]) {
  await db.extraItems.bulkPut(items)
}

/** Read extra items from local cache */
export async function getCachedExtraItems(userId: string): Promise<ExtraItem[]> {
  return db.extraItems.where('userId').equals(userId).toArray()
}

/** Clear all cached data for a user (on sign out) */
export async function clearUserCache(userId: string) {
  await db.userProfiles.where('authUserId').equals(userId).delete()
  await db.bills.where('userId').equals(userId).delete()
  await db.extraItems.where('userId').equals(userId).delete()
}

/** Clear all local data */
export async function clearAllCache() {
  await db.userProfiles.clear()
  await db.bills.clear()
  await db.extraItems.clear()
}
