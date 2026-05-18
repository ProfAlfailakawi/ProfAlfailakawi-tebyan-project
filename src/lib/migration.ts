
/**
 * LocalStorage Migration Utility
 * Migrates data from legacy 'tibyan_' keys to new 'tebyan_' keys to prevent data loss after renaming.
 */

export function migrateLegacyData() {
    console.log('[Migration] Checking for legacy data...');
    
    const mappings: Record<string, string> = {
        'tibyan_search_history': 'tebyan_search_history',
        'tibyan_memory': 'tebyan_memory',
        'tibyan_cognitive_memory': 'tebyan_cognitive_memory',
        'tibyan_galaxy_cache': 'tebyan_galaxy_cache',
        'tibyan_custom_avatar': 'tebyan_custom_avatar',
        'tibyan_sage_progress': 'tebyan_sage_progress',
        'tibyan_usage_stats': 'tebyan_usage_stats',
        'tibyan_panic_mode': 'tebyan_panic_mode',
        'tibyan_style_confirmed': 'tebyan_style_confirmed',
        'tibyan_analytics_logs': 'tebyan_analytics_logs'
    };

    let migrationPerformed = false;

    Object.entries(mappings).forEach(([oldKey, newKey]) => {
        const oldData = localStorage.getItem(oldKey);
        const newData = localStorage.getItem(newKey);

        if (oldData && !newData) {
            console.log(`[Migration] Migrating ${oldKey} -> ${newKey}`);
            localStorage.setItem(newKey, oldData);
            // We keep the old key for now just in case, or we can remove it.
            // localStorage.removeItem(oldKey);
            migrationPerformed = true;
        }
    });

    if (migrationPerformed) {
        console.log('[Migration] Data migration completed successfully.');
    } else {
        console.log('[Migration] No legacy data found or already migrated.');
    }
}
