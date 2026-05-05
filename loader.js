/**
 * Connect Widget Loader
 *
 * This is a lightweight loader that fetches the main widget script.
 * Host this on your CDN and provide it to customers.
 *
 * Usage:
 * <script>
 *   window.ConnectWidgetConfig = {
 *     companyName: 'Your Company',
 *     phone: '555-123-4567',
 *     // ... other options
 *   };
 * </script>
 * <script src="https://your-cdn.com/connect-widget/loader.js" async></script>
 */
(function() {
    var script = document.createElement('script');
    script.src = (window.ConnectWidgetConfig && window.ConnectWidgetConfig.baseUrl)
        || 'https://your-cdn.com/connect-widget/connect-widget.js';
    script.async = true;
    document.head.appendChild(script);
})();
