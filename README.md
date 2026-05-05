# Connect Widget

A lightweight, customizable contact widget that can be embedded on any website via a simple script tag. Similar to Scorpion Connect, it provides Text, Call, Email, and Chat options in an elegant floating interface.

## Features

- **Text Form** - Visitors can send text messages with their contact info
- **Call Button** - One-click calling via `tel:` links
- **Email Button** - One-click email via `mailto:` links
- **Chat** - Placeholder for live chat integration (coming soon)
- **Fully Customizable** - Colors, branding, messaging, position
- **Mobile Responsive** - Works great on all devices
- **Lightweight** - Single JavaScript file, no dependencies
- **WordPress Agnostic** - Works on any website

## Quick Start

Add this code snippet to your website, just before the closing `</body>` tag:

```html
<!-- Connect Widget Configuration -->
<script>
  window.ConnectWidgetConfig = {
    companyName: 'Your Company Name',
    companyLogo: 'https://example.com/logo.png',
    primaryColor: '#4285f4',
    phone: '555-123-4567',
    email: 'contact@example.com',
    webhookUrl: 'https://your-api.com/leads',
  };
</script>
<!-- Connect Widget Script -->
<script src="https://your-cdn.com/connect-widget.js" async></script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `companyName` | string | `'Your Company'` | Your company name displayed in the widget |
| `companyLogo` | string | `''` | URL to your company logo image |
| `primaryColor` | string | `'#4285f4'` | Primary brand color (hex format) |
| `phone` | string | `''` | Phone number for the "Call" button |
| `email` | string | `''` | Email address for the "Email" button |
| `webhookUrl` | string | `''` | URL to receive form submissions (POST) |
| `textEnabled` | boolean | `true` | Show/hide the "Text" option |
| `callEnabled` | boolean | `true` | Show/hide the "Call" option |
| `emailEnabled` | boolean | `true` | Show/hide the "Email" option |
| `chatEnabled` | boolean | `false` | Show/hide the "Chat" option |
| `welcomeMessage` | string | `"I'm here if you have any questions..."` | Welcome message text |
| `position` | string | `'right'` | Widget position: `'left'` or `'right'` |
| `textConsentOptions` | array | `['Yes', 'No']` | Options for "Can we text you?" dropdown |

## JavaScript API

### Open the widget programmatically

```javascript
ConnectWidget.open();
```

### Close the widget programmatically

```javascript
ConnectWidget.close();
```

### Access current configuration

```javascript
console.log(ConnectWidget.config);
```

## Webhook Payload

When a form is submitted, the following JSON payload is POSTed to your webhook URL:

```json
{
  "type": "text",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "(555) 123-4567",
  "canText": "Yes",
  "message": "I need help with...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "page": "https://example.com/contact"
}
```

## Hosting

### Option 1: Self-hosted

1. Upload `connect-widget.js` to your web server or CDN
2. Update the script src in your embed code to point to your hosted file

### Option 2: GitHub Pages

1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Use the GitHub Pages URL for your script src

### Option 3: CDN (jsDelivr)

If you push to GitHub, you can use jsDelivr to serve the file:

```html
<script src="https://cdn.jsdelivr.net/gh/YOUR_USERNAME/connect-widget@main/connect-widget.js"></script>
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome for Android)

## Development

### Local Testing

1. Clone the repository
2. Open `example.html` in your browser
3. The widget will appear in the bottom-right corner

### Building for Production

The widget is already production-ready as a single JavaScript file. For additional minification:

```bash
# Using terser (install via npm install -g terser)
terser connect-widget.js -o connect-widget.min.js -c -m
```

## Customization Examples

### Blue theme (default)

```javascript
window.ConnectWidgetConfig = {
  primaryColor: '#4285f4',
};
```

### Green theme

```javascript
window.ConnectWidgetConfig = {
  primaryColor: '#10b981',
};
```

### Orange theme

```javascript
window.ConnectWidgetConfig = {
  primaryColor: '#f97316',
};
```

### Left-positioned widget

```javascript
window.ConnectWidgetConfig = {
  position: 'left',
};
```

### Text-only (no call/email)

```javascript
window.ConnectWidgetConfig = {
  textEnabled: true,
  callEnabled: false,
  emailEnabled: false,
  chatEnabled: false,
};
```

## License

MIT License - feel free to use this in commercial projects.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
