/**
 * Instagram Bulk Action Script (Likes & Comments)
 * Targeted for 2025 Bloks UI
 */

(async () => {
    // --- CONFIGURATION ---
    const CONFIG = {
        batchSize: 30,       // Number of items to select per round (Keep < 50 for safety)
        clickDelay: 300,     // Speed of selecting checkmarks (ms)
        actionDelay: 2000,   // Wait for menus/popups to open (ms)
    };

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // Helper: Find elements by text (robust for Select/Unlike/Delete)
    const findElementByText = (text, tags = ['span', 'div', 'button']) => {
        for (const tag of tags) {
            const elements = document.querySelectorAll(tag);
            for (let el of elements) {
                if (el.innerText && el.innerText.trim() === text) return el;
            }
        }
        return null;
    };

    // Helper: Click the popup confirmation (Handles "Unlike" AND "Delete")
    const clickConfirmationButton = async () => {
        // 1. Target the specific class for the new UI (works for both Unlike and Delete)
        const specificClassBtn = document.querySelector('div._ap3a._aacp._aacw._aac-._aad6');
        if (specificClassBtn) {
            const text = specificClassBtn.innerText.trim();
            if (text === 'Unlike' || text === 'Delete') {
                specificClassBtn.click();
                return true;
            }
        }
        
        // 2. Fallback: Generic Dialog search (if class name changes)
        const dialog = document.querySelector('div[role="dialog"]');
        if (dialog) {
            const buttons = dialog.querySelectorAll('div, button, span');
            for (let btn of buttons) {
                const text = btn.innerText.trim();
                if (text === 'Unlike' || text === 'Delete') {
                    btn.click();
                    return true;
                }
            }
        }
        return false;
    };

    // --- MAIN LOOP ---
    let consecutiveEmptyRuns = 0;

    while (true) {
        console.log(`%c 🚀 Starting New Batch...`, "color: cyan; font-weight: bold");

        // 1. ACTIVATE SELECT MODE
        // We check for either "Unlike" (Likes page) or "Delete" (Comments page) in footer
        let footerActionBtn = findElementByText("Unlike") || findElementByText("Delete");
        
        // Only click "Select" if the footer action button isn't already visible
        if (!footerActionBtn) {
            const selectBtn = findElementByText("Select");
            if (selectBtn) {
                selectBtn.click();
                await sleep(CONFIG.actionDelay); // Wait for checkboxes to appear
            } else {
                console.log("⚠️ 'Select' button not found yet. Retrying...");
                await sleep(2000);
                continue; // Restart loop to check again
            }
        }

        // 2. SELECT ITEMS
        // Target the specific Bloks icons used for checkboxes
        const allIcons = document.querySelectorAll('div[data-bloks-name="ig.components.Icon"]');
        let batchCount = 0;

        for (const icon of allIcons) {
            if (batchCount >= CONFIG.batchSize) break;

            const style = icon.getAttribute('style');
            // Check for unselected state (circle outline)
            if (style && style.includes('circle__outline')) {
                // Click parent container to ensure click registers
                if (icon.parentElement) {
                    icon.parentElement.click();
                } else {
                    icon.click();
                }
                batchCount++;
                await sleep(CONFIG.clickDelay); 
            }
        }

        if (batchCount === 0) {
            console.log("⚠️ No visible items found. Scrolling to load more...");
            window.scrollBy(0, 1000);
            await sleep(3000);
            
            consecutiveEmptyRuns++;
            if (consecutiveEmptyRuns > 3) {
                console.log("🛑 No more items found after 3 scrolls. Script finished.");
                break;
            }
            continue;
        }
        
        consecutiveEmptyRuns = 0;
        console.log(`✅ Selected ${batchCount} items.`);

        // 3. CLICK FOOTER ACTION (Unlike / Delete)
        footerActionBtn = findElementByText("Unlike") || findElementByText("Delete");
        if (footerActionBtn) {
            footerActionBtn.click();
            await sleep(CONFIG.actionDelay);
        } else {
            console.log("❌ Footer button missing. Restarting loop...");
            continue;
        }

        // 4. CLICK POPUP CONFIRMATION
        const confirmed = await clickConfirmationButton();
        if (confirmed) {
            console.log("✅ Popup confirmed.");
        } else {
            console.log("⚠️ No popup found (might have auto-deleted).");
        }

        // 5. SMART WAIT FOR PAGE REFRESH
        console.log("⏳ Waiting for page to refresh...");
        
        // We loop here until the "Select" button comes back
        let refreshRetries = 0;
        while (refreshRetries < 15) { // Wait up to 30 seconds max
            await sleep(2000); // Check every 2 seconds
            
            const selectBtnAgain = findElementByText("Select");
            const footerGone = !(findElementByText("Unlike") || findElementByText("Delete"));

            // Logic: Ready if "Select" is visible AND the footer action button is gone
            if (selectBtnAgain && footerGone) {
                console.log("✅ Page refreshed. Ready for next batch.");
                break;
            }
            console.log(`... still waiting for refresh (${refreshRetries}/15)`);
            refreshRetries++;
        }
    }
    
    console.log("🏁 Process Complete.");
})();
