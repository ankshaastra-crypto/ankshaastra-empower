/**
 * Suppress DEP0169 deprecation warning from dependencies
 * 
 * This warning comes from third-party packages (nodemailer, ioredis, follow-redirects, etc.)
 * that use url.parse() internally. Since we can't modify their code, we suppress the warning.
 * 
 * The warning is safe to suppress as:
 * 1. It's from dependencies, not our code
 * 2. These packages will be updated by their maintainers
 * 3. The warning doesn't affect functionality
 */

// Suppress DEP0169 warnings (url.parse deprecation)
if (typeof process !== 'undefined' && process.emitWarning) {
  const originalEmitWarning = process.emitWarning;
  
  process.emitWarning = function(warning, ...args) {
    // Suppress DEP0169 deprecation warnings
    if (typeof warning === 'string' && warning.includes('DEP0169')) {
      return; // Suppress this specific warning
    }
    // Also check if it's an Error object with DEP0169
    if (warning instanceof Error && warning.code === 'DEP0169') {
      return; // Suppress this specific warning
    }
    // Pass through all other warnings
    return originalEmitWarning.call(process, warning, ...args);
  };
}

// Export nothing - this is a side-effect module
export {};
