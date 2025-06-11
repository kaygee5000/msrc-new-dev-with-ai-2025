import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Custom NProgress styles
const npProgressStyle = `
  #nprogress .bar {
    background: #2196f3 !important;
    height: 3px !important;
  }
  #nprogress .peg {
    box-shadow: 0 0 10px #2196f3, 0 0 5px #2196f3 !important;
  }
`;

let styleElement = null;

/**
 * Configure and initialize NProgress with custom styling
 */
export const setupNProgress = () => {
  // Configure NProgress
  NProgress.configure({ 
    showSpinner: false,
    minimum: 0.1,
    easing: 'ease',
    speed: 500,
    trickleSpeed: 200,
    parent: 'body'
  });
  
  // Add custom styles if not already added
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.textContent = npProgressStyle;
    document.head.appendChild(styleElement);
  }
};

/**
 * Start the progress bar
 */
export const startProgress = () => {
  NProgress.start();
};

/**
 * Complete the progress bar
 */
export const completeProgress = () => {
  NProgress.done();
};

/**
 * Increment the progress bar by a specific amount
 * @param {number} amount - Amount to increment (0-1)
 */
export const incrementProgress = (amount) => {
  NProgress.inc(amount);
};

/**
 * Clean up NProgress styles
 */
export const cleanupNProgress = () => {
  if (styleElement && document.head.contains(styleElement)) {
    document.head.removeChild(styleElement);
    styleElement = null;
  }
};

// Default export for convenience
export default {
  setup: setupNProgress,
  start: startProgress,
  done: completeProgress,
  inc: incrementProgress,
  cleanup: cleanupNProgress
};
