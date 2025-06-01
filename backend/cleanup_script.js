// backend/cleanup_script.js
import { connectDB, closeDB } from './config/database.js';
import MessPlanModel from './models/messPlan.model.js';

// Define the threshold for deletion in months
// Records older than this many months will be deleted.
const MONTHS_THRESHOLD = 1; // Keep records for 1 month

async function cleanupOldMessPlans() {
  console.log(`[Cleanup Script] Starting cleanup of mess plans older than ${MONTHS_THRESHOLD} month(s).`);

  try {
    // Establish a database connection specifically for the script
    await connectDB();
    const messPlanModel = new MessPlanModel();

    // Perform the deletion
    const affectedRows = await messPlanModel.deleteOldMessPlans(MONTHS_THRESHOLD);

    console.log(`[Cleanup Script] Successfully deleted ${affectedRows} old mess plan(s).`);
  } catch (error) {
    console.error('[Cleanup Script] Error during cleanup:', error);
  } finally {
    // Always close the database connection
    await closeDB();
    console.log('[Cleanup Script] Cleanup script finished.');
  }
}

// Execute the cleanup function
cleanupOldMessPlans();