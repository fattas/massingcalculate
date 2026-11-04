import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

/**
 * Encode a plan object into a shareable string
 */
export function encodePlan(plan) {
  try {
    const json = JSON.stringify(plan);
    return compressToEncodedURIComponent(json);
  } catch (e) {
    console.error('Failed to encode plan:', e);
    return null;
  }
}

/**
 * Decode a plan string back into an object
 */
export function decodePlan(encoded) {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to decode plan:', e);
    return null;
  }
}

/**
 * Generate a shareable URL with the plan encoded in it
 */
export function generateShareURL(plan) {
  const encoded = encodePlan(plan);
  if (!encoded) return null;
  const baseURL = window.location.origin + window.location.pathname;
  return `${baseURL}?plan=${encoded}`;
}

/**
 * Extract plan from URL if present
 */
export function extractPlanFromURL() {
  const params = new URLSearchParams(window.location.search);
  const planData = params.get('plan');
  if (!planData) return null;
  return decodePlan(planData);
}

/**
 * Generate a short code for copying
 */
export function generatePlanCode(plan) {
  return encodePlan(plan);
}

/**
 * Import plan from code
 */
export function importPlanCode(code) {
  return decodePlan(code);
}

/**
 * Export plan to JSON file
 */
export function exportPlanJSON(plan, filename = 'massing-plan.json') {
  const json = JSON.stringify(plan, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import plan from JSON file
 */
export function importPlanJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const plan = JSON.parse(e.target.result);
        resolve(plan);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
