// Create a new file: src/utils/walletModalStyling.js

export function initWalletModalStyling() {
    // Setup a mutation observer to detect when the wallet modal is added to the DOM
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          // Look for the wallet modal in the DOM
          const modal = document.querySelector('[data-testid="wallet-modal"]');
          if (modal) {
            // Apply styles directly to the modal and its children
            applyStyles();
            // No need to keep observing once we've styled the modal
            break;
          }
        }
      }
    });
  
    // Start observing the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
  
    // Function to apply styles directly to the elements
    function applyStyles() {
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        [data-testid="wallet-modal"] {
          background-color: white !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
          border: 1px solid #e5e7eb !important;
          padding: 24px !important;
          max-width: 400px !important;
          width: 100% !important;
        }
  
        [data-testid="wallet-modal"] > div > h3 {
          font-size: 20px !important;
          font-weight: 600 !important;
          color: #111827 !important;
          margin-bottom: 16px !important;
        }
  
        [data-testid="wallet-option"] {
          display: flex !important;
          align-items: center !important;
          padding: 12px 16px !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 12px !important;
          margin-bottom: 12px !important;
          background-color: white !important;
          transition: all 0.2s !important;
        }
  
        [data-testid="wallet-option"]:hover {
          background-color: #f9fafb !important;
          border-color: #d1d5db !important;
          transform: translateY(-1px) !important;
        }
  
        [data-testid="wallet-option"] img {
          width: 32px !important;
          height: 32px !important;
          margin-right: 12px !important;
          border-radius: 50% !important;
        }
  
        [data-testid="wallet-modal"] button:last-of-type {
          color: #4f46e5 !important;
          font-weight: 500 !important;
          text-align: left !important;
          margin-top: 8px !important;
        }
  
        [data-testid="modal-overlay"] {
          background: rgba(0, 0, 0, 0.5) !important;
          backdrop-filter: blur(4px) !important;
        }
      `;
      document.head.appendChild(styleElement);
    }
  
    // Return a cleanup function
    return () => observer.disconnect();
  }
  