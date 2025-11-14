// Simple script to check if service worker file exists
// This runs in the browser context to verify the file is accessible

fetch('/service-worker.js')
  .then(response => {
    if (response.ok) {
      console.log('✅ Service worker file is accessible');
      return true;
    } else {
      console.warn('⚠️ Service worker file returned status:', response.status);
      return false;
    }
  })
  .catch(error => {
    console.warn('⚠️ Service worker file is not accessible:', error.message);
    return false;
  });