(function() {
    'use strict';

    // Prevent multiple initializations
    if (window.ConnectWidget) {
        return;
    }

    // Default configuration
    const defaultConfig = {
        companyName: 'Your Company',
        companyLogo: '',
        primaryColor: '#019FDB',
        primaryColorDark: '',
        primaryColorLight: '',
        phone: '',
        email: '',
        // Company info for expanded view sidebar
        address: '',
        city: '',
        state: '',
        zip: '',
        businessHours: '', // e.g. "Monday - Sunday\nOpen 24 Hours"
        // Feature toggles
        textEnabled: true,
        emailEnabled: true,
        callbackEnabled: false,
        chatEnabled: false,
        // HouseCall Pro API (for Text form - creates leads)
        hcpWorkerUrl: '', // URL to your Cloudflare Worker
        // Formspree form IDs (for Email and Callback forms)
        formspreeEmailId: '',
        formspreeCallbackId: '',
        // Chat configuration
        chatWorkerUrl: '', // URL to your chat Cloudflare Worker
        chatWelcomeMessage: "Hi! I'm here to help with plumbing, heating, and cooling questions. How can I assist you today?",
        // UI options
        welcomeMessage: "I'm here if you have any questions or need help!",
        position: 'right', // 'left' or 'right'
        textConsentOptions: ['Yes', 'No'],
    };

    // Merge user config with defaults
    const config = Object.assign({}, defaultConfig, window.ConnectWidgetConfig || {});

    // CSS Styles
    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

        .cw-widget-container {
            --cw-primary: ${config.primaryColor};
            --cw-primary-dark: ${config.primaryColorDark || adjustColor(config.primaryColor, -20)};
            --cw-primary-light: ${config.primaryColorLight || adjustColor(config.primaryColor, 40)};
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            box-sizing: border-box;
        }

        .cw-widget-container *, .cw-widget-container *::before, .cw-widget-container *::after {
            box-sizing: border-box;
        }

        /* Floating Buttons Container */
        .cw-floating-btns {
            position: fixed;
            bottom: 20px;
            ${config.position}: 20px;
            display: flex;
            flex-direction: row;
            gap: 0;
            z-index: 999998;
            background: var(--cw-primary);
            border-radius: 4px;
            padding: 12px 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }

        .cw-floating-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 8px 16px;
            background: transparent;
            border: none;
            cursor: pointer;
            text-decoration: none;
            transition: opacity 0.2s ease;
            border-radius: 4px;
        }

        .cw-floating-btn:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        .cw-floating-btn svg {
            width: 24px;
            height: 24px;
            stroke: white;
            fill: none;
        }

        .cw-floating-btn-label {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            font-size: 12px;
            font-weight: 500;
            color: white;
            white-space: nowrap;
        }


        /* Welcome Bubble */
        .cw-welcome-bubble {
            position: fixed;
            bottom: 120px;
            ${config.position}: 20px;
            background: white;
            border-radius: 4px;
            padding: 16px 20px;
            max-width: 300px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 999997;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
        }

        .cw-welcome-bubble.cw-visible {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }

        .cw-welcome-bubble::after {
            content: '';
            position: absolute;
            bottom: -8px;
            ${config.position}: 30px;
            width: 16px;
            height: 16px;
            background: white;
            transform: rotate(45deg);
            box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        .cw-welcome-bubble-close {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            padding: 0;
            border: none;
            background: #f0f0f0;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: #666;
        }

        .cw-welcome-bubble-close:hover {
            background: #e0e0e0;
        }

        .cw-welcome-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
            padding-right: 20px;
        }

        .cw-welcome-text {
            color: #666;
            font-size: 14px;
        }

        /* Main Popup */
        .cw-popup {
            position: fixed;
            bottom: 120px;
            ${config.position}: 20px;
            width: 380px;
            max-width: calc(100vw - 40px);
            max-height: calc(100vh - 140px);
            background: white;
            border-radius: 4px;
            box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
            z-index: 999999;
            overflow: visible;
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
            display: flex;
            flex-direction: column;
        }

        .cw-popup.cw-visible {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }

        /* Popup Header */
        .cw-popup-header {
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #eee;
            border-radius: 4px 4px 0 0;
            background: #fafafa;
        }

        .cw-popup-logo {
            max-height: 40px;
            max-width: 150px;
            object-fit: contain;
        }

        .cw-popup-header-actions {
            display: flex;
            gap: 8px;
        }

        .cw-popup-header-btn {
            width: 32px;
            height: 32px;
            padding: 0;
            border: none;
            background: #e8e8e8;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            transition: background 0.2s ease;
        }

        .cw-popup-header-btn:hover {
            background: #d8d8d8;
        }

        .cw-popup-header-btn svg {
            width: 16px;
            height: 16px;
        }

        /* Popup Body */
        .cw-popup-body {
            flex: 1;
            overflow-y: auto;
            padding: 24px 20px;
            position: relative;
        }

        .cw-popup-body-wrapper {
            position: relative;
            flex: 1;
            overflow: hidden;
            display: flex;
            border-radius: 4px;
            flex-direction: column;
        }

        .cw-popup-body-wrapper::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1));
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        .cw-popup-body-wrapper.cw-has-scroll::after {
            opacity: 1;
        }

        .cw-popup-body-wrapper.cw-scrolled-bottom::after {
            opacity: 0;
        }

        /* Menu View */
        .cw-menu-welcome {
            text-align: center;
            margin-bottom: 20px;
        }

        .cw-menu-welcome h2 {
            font-size: 20px;
            color: #333;
            margin: 0 0 8px 0;
        }

        .cw-menu-welcome p {
            color: #666;
            margin: 0;
            font-size: 14px;
        }

        .cw-menu-options {
            display: flex;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .cw-menu-option {
            flex: 1;
            min-width: 70px;
            max-width: 85px;
            padding: 16px 8px;
            border: 1px solid #e0e0e0;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s ease;
            text-decoration: none;
        }

        .cw-menu-option:hover {
            border-color: var(--cw-primary);
            background: var(--cw-primary-light);
        }

        .cw-menu-option svg {
            width: 28px;
            height: 28px;
            margin-bottom: 8px;
            color: #666;
        }

        .cw-menu-option:hover svg {
            color: var(--cw-primary);
        }

        .cw-menu-option span {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #666;
        }

        .cw-menu-option:hover span {
            color: var(--cw-primary);
        }

        /* Form View */
        .cw-form-header {
            margin-bottom: 20px;
        }

        .cw-form-header h2 {
            font-size: 24px;
            color: #333;
            margin: 0 0 8px 0;
        }

        .cw-form-header p {
            color: #666;
            margin: 0;
            font-size: 14px;
        }

        .cw-form-row {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
        }

        .cw-form-group {
            flex: 1;
            margin-bottom: 16px;
        }

        .cw-form-row .cw-form-group {
            margin-bottom: 0;
        }

        .cw-form-label {
            display: block;
            font-size: 12px;
            color: #888;
            margin-bottom: 4px;
            font-weight: 500;
        }

        .cw-form-input,
        .cw-form-select,
        .cw-form-textarea {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-size: 16px;
            font-family: inherit;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
            background: white;
        }

        .cw-form-input:focus,
        .cw-form-select:focus,
        .cw-form-textarea:focus {
            outline: none;
            border-color: var(--cw-primary);
            box-shadow: 0 0 0 3px var(--cw-primary-light);
        }

        .cw-form-input::placeholder,
        .cw-form-textarea::placeholder {
            color: #aaa;
        }

        .cw-form-textarea {
            resize: vertical;
            min-height: 100px;
        }

        .cw-form-select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 16px center;
            padding-right: 40px;
        }

        .cw-required::after {
            content: '*';
            color: #e74c3c;
            margin-left: 2px;
        }

        /* Form Footer */
        .cw-form-footer {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-top: 8px;
        }

        .cw-back-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 12px 16px;
            border: none;
            background: none;
            cursor: pointer;
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            font-size: 15px;
            font-weight: 500;
            color: #666;
            transition: color 0.2s ease;
        }

        .cw-back-btn:hover {
            color: #333;
        }

        .cw-back-btn svg {
            width: 16px;
            height: 16px;
        }

        .cw-submit-btn {
            flex: 1;
            padding: 14px 24px;
            border: none;
            background: var(--cw-primary);
            color: white;
            border-radius: 4px;
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .cw-submit-btn:hover {
            background: var(--cw-primary-dark);
        }

        .cw-submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Success Message */
        .cw-success {
            text-align: center;
            padding: 40px 20px;
        }

        .cw-success-icon {
            width: 64px;
            height: 64px;
            background: #4caf50;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }

        .cw-success-icon svg {
            width: 32px;
            height: 32px;
            color: white;
        }

        .cw-success h3 {
            font-size: 20px;
            color: #333;
            margin: 0 0 8px 0;
        }

        .cw-success p {
            color: #666;
            margin: 0;
        }

        /* Views */
        .cw-view {
            display: none;
        }

        .cw-view.cw-active {
            display: block;
        }

        /* Error state */
        .cw-form-input.cw-error,
        .cw-form-select.cw-error,
        .cw-form-textarea.cw-error {
            border-color: #e74c3c;
        }

        .cw-error-text {
            color: #e74c3c;
            font-size: 12px;
            margin-top: 4px;
        }

        /* Expanded/Fullscreen Mode */
        .cw-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 1000000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .cw-overlay.cw-visible {
            opacity: 1;
            pointer-events: auto;
        }

        .cw-expanded {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            width: 900px;
            max-width: calc(100vw - 40px);
            max-height: calc(100vh - 40px);
            background: white;
            border-radius: 8px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            z-index: 1000001;
            display: flex;
            overflow: hidden;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .cw-expanded.cw-visible {
            opacity: 1;
            pointer-events: auto;
            transform: translate(-50%, -50%) scale(1);
        }

        .cw-expanded-sidebar {
            width: 340px;
            background: #f8f9fa;
            padding: 30px;
            display: flex;
            flex-direction: column;
            border-right: 1px solid #eee;
        }

        .cw-expanded-logo {
            max-width: 200px;
            max-height: 120px;
            object-fit: contain;
            margin-bottom: 24px;
            border-radius: 8px;
            background: white;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .cw-expanded-company {
            font-size: 22px;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
        }

        .cw-expanded-info {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .cw-expanded-info-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }

        .cw-expanded-info-icon {
            width: 24px;
            height: 24px;
            color: var(--cw-primary);
            flex-shrink: 0;
            margin-top: 2px;
        }

        .cw-expanded-info-icon svg {
            width: 24px;
            height: 24px;
            stroke: var(--cw-primary);
            fill: none;
        }

        .cw-expanded-info-text {
            font-size: 15px;
            color: #333;
            line-height: 1.5;
        }

        .cw-expanded-info-text strong {
            display: block;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .cw-expanded-divider {
            height: 1px;
            background: #ddd;
            margin: 16px 0;
        }

        .cw-expanded-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .cw-expanded-header {
            display: flex;
            justify-content: flex-end;
            padding: 16px 20px;
            gap: 8px;
        }

        .cw-expanded-close {
            width: 36px;
            height: 36px;
            border: none;
            background: #f0f0f0;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            transition: background 0.2s ease;
        }

        .cw-expanded-close:hover {
            background: #e0e0e0;
        }

        .cw-expanded-close svg {
            width: 18px;
            height: 18px;
        }

        .cw-expanded-body {
            flex: 1;
            overflow-y: auto;
            padding: 0 40px 40px;
        }

        .cw-expanded-body .cw-form-header h2 {
            font-size: 28px;
        }

        /* Mobile adjustments for expanded */
        @media (max-width: 768px) {
            .cw-expanded {
                flex-direction: column;
                width: 100%;
                max-width: 100%;
                height: 100%;
                max-height: 100%;
                border-radius: 0;
                top: 0;
                left: 0;
                transform: none;
            }

            .cw-expanded.cw-visible {
                transform: none;
            }

            .cw-expanded-sidebar {
                width: 100%;
                padding: 20px;
                border-right: none;
                border-bottom: 1px solid #eee;
            }

            .cw-expanded-body {
                padding: 0 20px 20px;
            }
        }

        /* Mobile adjustments */
        @media (max-width: 420px) {
            .cw-popup {
                bottom: 0;
                ${config.position}: 0;
                width: 100%;
                max-width: 100%;
                max-height: 85vh;
                border-radius: 4px 4px 0 0;
            }

            .cw-floating-btns {
                bottom: 16px;
                ${config.position}: 16px;
                padding: 10px 6px;
            }

            .cw-floating-btn {
                padding: 6px 12px;
            }

            .cw-floating-btn svg {
                width: 22px;
                height: 22px;
            }

            .cw-floating-btn-label {
                font-size: 11px;
            }

            .cw-welcome-bubble {
                bottom: 86px;
                ${config.position}: 16px;
                max-width: calc(100vw - 100px);
            }
        }

        /* Chat Styles */
        .cw-chat-container {
            display: flex;
            flex-direction: column;
            height: 380px;
        }

        .cw-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #fafafa;
        }

        .cw-chat-message {
            max-width: 85%;
            padding: 12px 16px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.5;
            word-wrap: break-word;
        }

        .cw-chat-message--user {
            align-self: flex-end;
            background: var(--cw-primary);
            color: white;
            border-bottom-right-radius: 4px;
        }

        .cw-chat-message--assistant {
            align-self: flex-start;
            background: white;
            color: #333;
            border-bottom-left-radius: 4px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .cw-chat-input-area {
            display: flex;
            gap: 8px;
            padding: 16px 0 0;
            border-top: 1px solid #eee;
            background: white;
        }

        .cw-chat-input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 24px;
            resize: none;
            font-family: inherit;
            font-size: 14px;
            line-height: 1.4;
            max-height: 100px;
            overflow-y: auto;
        }

        .cw-chat-input:focus {
            outline: none;
            border-color: var(--cw-primary);
        }

        .cw-chat-input::placeholder {
            color: #999;
        }

        .cw-chat-send {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: var(--cw-primary);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background 0.2s ease, transform 0.1s ease;
        }

        .cw-chat-send:hover {
            background: var(--cw-primary-dark);
        }

        .cw-chat-send:active {
            transform: scale(0.95);
        }

        .cw-chat-send:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .cw-chat-send svg {
            width: 20px;
            height: 20px;
            stroke: white;
            fill: none;
        }

        .cw-typing-indicator {
            align-self: flex-start;
            display: flex;
            gap: 4px;
            padding: 12px 16px;
            background: white;
            border-radius: 16px;
            border-bottom-left-radius: 4px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .cw-typing-dot {
            width: 8px;
            height: 8px;
            background: #999;
            border-radius: 50%;
            animation: cw-typing 1.4s infinite ease-in-out;
        }

        .cw-typing-dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .cw-typing-dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes cw-typing {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.6;
            }
            30% {
                transform: translateY(-4px);
                opacity: 1;
            }
        }

        .cw-chat-error {
            align-self: center;
            background: #fff3f3;
            color: #c00;
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 13px;
            text-align: center;
        }

        /* Chat in expanded view */
        .cw-expanded-body .cw-chat-container {
            height: 100%;
            min-height: 400px;
        }

        .cw-expanded-body .cw-chat-messages {
            padding: 24px;
        }

        .cw-expanded-body .cw-chat-message {
            max-width: 70%;
            font-size: 15px;
        }

        .cw-expanded-body .cw-chat-input-area {
            padding: 16px 24px;
        }

        @media (max-width: 420px) {
            .cw-chat-container {
                height: calc(85vh - 60px);
            }

            .cw-chat-message {
                max-width: 90%;
            }
        }
    `;

    // Helper function to adjust color brightness
    function adjustColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }

    // Icons
    const icons = {
        chat: `<svg class="cw-icon-chat" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>`,
        close: `<svg class="cw-icon-close" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
        text: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
        call: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
        email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
        callback: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
        expand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
        back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`,
        check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
        location: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
        clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
        chatBubble: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
    };

    // Build menu options based on config
    function buildMenuOptions() {
        let options = '';

        if (config.textEnabled && config.hcpWorkerUrl) {
            options += `
                <button class="cw-menu-option" data-action="text">
                    ${icons.text}
                    <span>Text</span>
                </button>
            `;
        }

        if (config.callEnabled && config.phone) {
            options += `
                <a href="tel:${config.phone}" class="cw-menu-option">
                    ${icons.call}
                    <span>Call</span>
                </a>
            `;
        }

        if (config.emailEnabled && config.formspreeEmailId) {
            options += `
                <button class="cw-menu-option" data-action="email">
                    ${icons.email}
                    <span>Email</span>
                </button>
            `;
        }

        if (config.callbackEnabled && config.formspreeCallbackId) {
            options += `
                <button class="cw-menu-option" data-action="callback">
                    ${icons.callback}
                    <span>Callback</span>
                </button>
            `;
        }

        if (config.chatEnabled && config.chatWorkerUrl) {
            options += `
                <button class="cw-menu-option" data-action="chat">
                    ${icons.chatBubble}
                    <span>Chat</span>
                </button>
            `;
        }

        return options;
    }

    // Build text consent options
    function buildTextConsentOptions() {
        return config.textConsentOptions.map(opt =>
            `<option value="${opt}">${opt}</option>`
        ).join('');
    }

    // HTML Template
    const template = `
        <div class="cw-widget-container">
            <!-- Welcome Bubble -->
            <div class="cw-welcome-bubble" id="cw-welcome">
                <button class="cw-welcome-bubble-close" id="cw-welcome-close">&times;</button>
                <div class="cw-welcome-title">Welcome to ${config.companyName}</div>
                <div class="cw-welcome-text">${config.welcomeMessage}</div>
            </div>

            <!-- Floating Buttons -->
            <div class="cw-floating-btns" id="cw-floating-btns">
                ${config.textEnabled && config.hcpWorkerUrl ? `
                    <button class="cw-floating-btn" id="cw-btn-text" data-action="text">
                        ${icons.text}
                        <span class="cw-floating-btn-label">Text Us</span>
                    </button>
                ` : ''}
                ${config.emailEnabled && config.formspreeEmailId ? `
                    <button class="cw-floating-btn" id="cw-btn-email" data-action="email">
                        ${icons.email}
                        <span class="cw-floating-btn-label">Email Us</span>
                    </button>
                ` : ''}
                ${config.callbackEnabled && config.formspreeCallbackId ? `
                    <button class="cw-floating-btn" id="cw-btn-callback" data-action="callback">
                        ${icons.callback}
                        <span class="cw-floating-btn-label">Request Callback</span>
                    </button>
                ` : ''}
                ${config.chatEnabled && config.chatWorkerUrl ? `
                    <button class="cw-floating-btn" id="cw-btn-chat" data-action="chat">
                        ${icons.chatBubble}
                        <span class="cw-floating-btn-label">Chat</span>
                    </button>
                ` : ''}
            </div>

            <!-- Main Popup -->
            <div class="cw-popup" id="cw-popup">
                <!-- Header -->
                <div class="cw-popup-header">
                    ${config.companyLogo
                        ? `<img src="${config.companyLogo}" alt="${config.companyName}" class="cw-popup-logo">`
                        : `<span style="font-weight: 600; color: #333;">${config.companyName}</span>`
                    }
                    <div class="cw-popup-header-actions">
                        <button class="cw-popup-header-btn" id="cw-expand" title="Expand">
                            ${icons.expand}
                        </button>
                        <button class="cw-popup-header-btn" id="cw-close" title="Close">
                            ${icons.close}
                        </button>
                    </div>
                </div>

                <!-- Body -->
                <div class="cw-popup-body-wrapper" id="cw-popup-body-wrapper">
                <div class="cw-popup-body" id="cw-popup-body">
                    <!-- Menu View -->
                    <div class="cw-view cw-active" id="cw-view-menu">
                        <div class="cw-menu-welcome">
                            <h2>Welcome to ${config.companyName}</h2>
                            <p>${config.welcomeMessage}</p>
                        </div>
                        <div class="cw-menu-options">
                            ${buildMenuOptions()}
                        </div>
                    </div>

                    <!-- Text Form View (submits to HouseCall Pro via worker) -->
                    <div class="cw-view" id="cw-view-text">
                        <div class="cw-form-header">
                            <h2>Send us a text</h2>
                            <p>Let us know what you need, and we'll get back to you as soon as we can.</p>
                        </div>
                        <form id="cw-text-form" data-handler="hcp">
                            <div class="cw-form-row">
                                <div class="cw-form-group">
                                    <input type="text" class="cw-form-input" name="firstName" placeholder="First Name" required>
                                </div>
                                <div class="cw-form-group">
                                    <input type="text" class="cw-form-input" name="lastName" placeholder="Last Name" required>
                                </div>
                            </div>
                            <div class="cw-form-group">
                                <input type="tel" class="cw-form-input cw-phone-input" name="phone" placeholder="Phone Number" required>
                            </div>
                            <div class="cw-form-group">
                                <label class="cw-form-label">Can we text you?</label>
                                <select class="cw-form-select" name="canText" required>
                                    <option value="">Select an option</option>
                                    ${buildTextConsentOptions()}
                                </select>
                            </div>
                            <div class="cw-form-group">
                                <textarea class="cw-form-textarea" name="message" placeholder="Message" required></textarea>
                            </div>
                            <div class="cw-form-footer">
                                <button type="submit" class="cw-submit-btn">Send</button>
                            </div>
                        </form>
                    </div>

                    <!-- Email Form View -->
                    <div class="cw-view" id="cw-view-email">
                        <div class="cw-form-header">
                            <h2>Email us</h2>
                            <p>Send us an email and we'll respond as soon as possible.</p>
                        </div>
                        <form id="cw-email-form" data-formspree-id="${config.formspreeEmailId}">
                            <input type="hidden" name="_subject" value="New Email from Connect Widget">
                            <input type="hidden" name="_source" value="Connect Widget - Email">
                            <input type="hidden" name="Page URL" id="cw-email-page-url">
                            <div class="cw-form-row">
                                <div class="cw-form-group">
                                    <input type="text" class="cw-form-input" name="First Name" placeholder="First Name" required>
                                </div>
                                <div class="cw-form-group">
                                    <input type="text" class="cw-form-input" name="Last Name" placeholder="Last Name" required>
                                </div>
                            </div>
                            <div class="cw-form-group">
                                <input type="email" class="cw-form-input" name="Email" placeholder="Email Address" required>
                            </div>
                            <div class="cw-form-group">
                                <input type="tel" class="cw-form-input cw-phone-input" name="Phone" placeholder="Phone Number (optional)">
                            </div>
                            <div class="cw-form-group">
                                <textarea class="cw-form-textarea" name="Message" placeholder="How can we help you?" required></textarea>
                            </div>
                            <div class="cw-form-footer">
                                <button type="submit" class="cw-submit-btn">Send</button>
                            </div>
                        </form>
                    </div>

                    <!-- Callback Form View -->
                    <div class="cw-view" id="cw-view-callback">
                        <div class="cw-form-header">
                            <h2>Request a callback</h2>
                            <p>Leave your number and we'll call you back.</p>
                        </div>
                        <form id="cw-callback-form" data-formspree-id="${config.formspreeCallbackId}">
                            <input type="hidden" name="_subject" value="New Callback Request from Connect Widget">
                            <input type="hidden" name="_source" value="Connect Widget - Callback">
                            <input type="hidden" name="Page URL" id="cw-callback-page-url">
                            <div class="cw-form-row">
                                <div class="cw-form-group">
                                    <input type="text" class="cw-form-input" name="First Name" placeholder="First Name" required>
                                </div>
                                <div class="cw-form-group">
                                    <input type="text" class="cw-form-input" name="Last Name" placeholder="Last Name" required>
                                </div>
                            </div>
                            <div class="cw-form-group">
                                <input type="tel" class="cw-form-input cw-phone-input" name="Phone" placeholder="Phone Number" required>
                            </div>
                            <div class="cw-form-group">
                                <label class="cw-form-label">Best time to call</label>
                                <select class="cw-form-select" name="Best Time to Call">
                                    <option value="">Any time</option>
                                    <option value="Morning (8am-12pm)">Morning (8am-12pm)</option>
                                    <option value="Afternoon (12pm-4pm)">Afternoon (12pm-4pm)</option>
                                </select>
                            </div>
                            <div class="cw-form-group">
                                <textarea class="cw-form-textarea" name="Message" placeholder="What would you like to discuss? (optional)"></textarea>
                            </div>
                            <div class="cw-form-footer">
                                <button type="submit" class="cw-submit-btn">Request Callback</button>
                            </div>
                        </form>
                    </div>

                    <!-- Chat View -->
                    <div class="cw-view" id="cw-view-chat">
                        <div class="cw-chat-container">
                            <div class="cw-chat-messages" id="cw-chat-messages">
                                <div class="cw-chat-message cw-chat-message--assistant">${config.chatWelcomeMessage}</div>
                            </div>
                            <div class="cw-chat-input-area">
                                <textarea
                                    class="cw-chat-input"
                                    id="cw-chat-input"
                                    placeholder="Type your question..."
                                    rows="1"
                                ></textarea>
                                <button class="cw-chat-send" id="cw-chat-send" title="Send">
                                    ${icons.send}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Success View -->
                    <div class="cw-view" id="cw-view-success">
                        <div class="cw-success">
                            <div class="cw-success-icon">
                                ${icons.check}
                            </div>
                            <h3>Message Sent!</h3>
                            <p>We'll get back to you as soon as possible.</p>
                        </div>
                    </div>
                </div>
                </div>
            </div>

            <!-- Overlay for expanded view -->
            <div class="cw-overlay" id="cw-overlay"></div>

            <!-- Expanded/Fullscreen View -->
            <div class="cw-expanded" id="cw-expanded">
                <div class="cw-expanded-sidebar">
                    ${config.companyLogo ? `<img src="${config.companyLogo}" alt="${config.companyName}" class="cw-expanded-logo">` : ''}
                    <div class="cw-expanded-company">${config.companyName}</div>
                    <div class="cw-expanded-info">
                        ${config.address ? `
                            <div class="cw-expanded-info-item">
                                <div class="cw-expanded-info-icon">${icons.location}</div>
                                <div class="cw-expanded-info-text">
                                    ${config.address}<br>
                                    ${config.city}${config.state ? ', ' + config.state : ''} ${config.zip}
                                </div>
                            </div>
                        ` : ''}
                        ${config.phone ? `
                            <div class="cw-expanded-info-item">
                                <div class="cw-expanded-info-icon">${icons.call}</div>
                                <div class="cw-expanded-info-text">${config.phone}</div>
                            </div>
                        ` : ''}
                        ${config.businessHours ? `
                            <div class="cw-expanded-divider"></div>
                            <div class="cw-expanded-info-item">
                                <div class="cw-expanded-info-icon">${icons.clock}</div>
                                <div class="cw-expanded-info-text">
                                    <strong>Business Hours</strong>
                                    ${config.businessHours.replace(/\n/g, '<br>')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="cw-expanded-main">
                    <div class="cw-expanded-header">
                        <button class="cw-expanded-close" id="cw-expanded-close" title="Close">
                            ${icons.close}
                        </button>
                    </div>
                    <div class="cw-expanded-body" id="cw-expanded-body">
                        <!-- Form content will be cloned here -->
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize widget
    function init() {
        // Inject styles
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);

        // Inject HTML
        const container = document.createElement('div');
        container.innerHTML = template;
        document.body.appendChild(container.firstElementChild);

        // Get elements
        const floatingBtns = document.getElementById('cw-floating-btns');
        const popup = document.getElementById('cw-popup');
        const closeBtn = document.getElementById('cw-close');
        const expandBtn = document.getElementById('cw-expand');
        const welcomeBubble = document.getElementById('cw-welcome');
        const welcomeClose = document.getElementById('cw-welcome-close');
        const popupBodyWrapper = document.getElementById('cw-popup-body-wrapper');
        const popupBody = document.getElementById('cw-popup-body');
        const overlay = document.getElementById('cw-overlay');
        const expanded = document.getElementById('cw-expanded');
        const expandedClose = document.getElementById('cw-expanded-close');
        const expandedBody = document.getElementById('cw-expanded-body');

        // State
        let isOpen = false;
        let isExpanded = false;
        let currentView = 'menu';
        let welcomeShown = false;
        let welcomeDismissed = sessionStorage.getItem('cw-welcome-dismissed') === 'true';

        // Check if content is scrollable and update gradient
        function updateScrollIndicator() {
            const hasScroll = popupBody.scrollHeight > popupBody.clientHeight;
            const isAtBottom = popupBody.scrollTop + popupBody.clientHeight >= popupBody.scrollHeight - 5;

            popupBodyWrapper.classList.toggle('cw-has-scroll', hasScroll);
            popupBodyWrapper.classList.toggle('cw-scrolled-bottom', isAtBottom);
        }

        // Listen for scroll events on popup body
        popupBody.addEventListener('scroll', updateScrollIndicator);

        // Show welcome bubble after delay
        if (!welcomeDismissed) {
            setTimeout(() => {
                if (!isOpen && !welcomeShown) {
                    welcomeBubble.classList.add('cw-visible');
                    welcomeShown = true;
                }
            }, 2000);
        }

        // Open popup to specific view
        function openPopup(viewName) {
            isOpen = true;
            popup.classList.add('cw-visible');
            welcomeBubble.classList.remove('cw-visible');
            showView(viewName);
            // Check scroll after popup opens
            setTimeout(updateScrollIndicator, 50);
        }

        // Close popup
        function closePopup() {
            isOpen = false;
            popup.classList.remove('cw-visible');
        }

        // Show specific view
        function showView(viewName) {
            const previousView = currentView;
            currentView = viewName;
            document.querySelectorAll('.cw-view').forEach(v => v.classList.remove('cw-active'));
            const view = document.getElementById(`cw-view-${viewName}`);
            if (view) {
                view.classList.add('cw-active');
            }
            // Reset scroll and check indicator
            popupBody.scrollTop = 0;
            setTimeout(updateScrollIndicator, 50);

            // Reset chat if leaving chat view (resetChat will be defined later)
            if (previousView === 'chat' && viewName !== 'chat' && typeof resetChat === 'function') {
                resetChat();
            }
        }

        // Open expanded view
        function openExpanded(viewName) {
            isExpanded = true;
            currentView = viewName;

            // Clone the form content to expanded body
            const sourceView = document.getElementById(`cw-view-${viewName}`);
            if (sourceView) {
                expandedBody.innerHTML = sourceView.innerHTML;

                // Re-attach phone formatting to cloned inputs
                expandedBody.querySelectorAll('.cw-phone-input').forEach(phoneInput => {
                    phoneInput.addEventListener('input', (e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length > 10) value = value.slice(0, 10);
                        if (value.length >= 6) {
                            value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
                        } else if (value.length >= 3) {
                            value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                        }
                        e.target.value = value;
                    });
                });

                // Re-attach form submit handler to cloned form
                const expandedForm = expandedBody.querySelector('form');
                if (expandedForm) {
                    expandedForm.addEventListener('submit', handleFormSubmit);
                }
            }

            // Close the small popup first
            closePopup();

            // Show expanded view
            overlay.classList.add('cw-visible');
            expanded.classList.add('cw-visible');
        }

        // Close expanded view
        function closeExpanded() {
            isExpanded = false;
            overlay.classList.remove('cw-visible');
            expanded.classList.remove('cw-visible');
            expandedBody.innerHTML = '';
        }

        // Floating button clicks - open directly to form
        document.querySelectorAll('.cw-floating-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                openPopup(action);
            });
        });

        closeBtn.addEventListener('click', closePopup);

        // Expand button - open expanded view with current form
        expandBtn.addEventListener('click', () => {
            if (currentView && currentView !== 'menu' && currentView !== 'success') {
                openExpanded(currentView);
            }
        });

        // Close expanded view
        expandedClose.addEventListener('click', closeExpanded);
        overlay.addEventListener('click', closeExpanded);

        welcomeClose.addEventListener('click', () => {
            welcomeBubble.classList.remove('cw-visible');
            welcomeDismissed = true;
            sessionStorage.setItem('cw-welcome-dismissed', 'true');
        });

        welcomeBubble.addEventListener('click', (e) => {
            if (e.target === welcomeBubble || e.target.closest('.cw-welcome-title, .cw-welcome-text')) {
                // Open to menu view when clicking welcome bubble
                openPopup('menu');
            }
        });

        // Menu option clicks (in case user navigates to menu)
        document.querySelectorAll('.cw-menu-option[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                showView(action);
            });
        });

        // Submit form to HouseCall Pro via worker
        async function submitToHCP(form) {
            if (!config.hcpWorkerUrl) {
                console.error('Connect Widget: No HCP Worker URL configured');
                return false;
            }

            const formData = new FormData(form);
            const data = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                phone: formData.get('phone'),
                canText: formData.get('canText'),
                message: formData.get('message'),
                pageUrl: window.location.href,
                formType: 'Connect Widget - Text',
            };

            try {
                const response = await fetch(config.hcpWorkerUrl, {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    return true;
                } else {
                    console.error('Connect Widget: HCP error', result);
                    return false;
                }
            } catch (error) {
                console.error('Connect Widget: Form submission error', error);
                return false;
            }
        }

        // Submit form to Formspree
        async function submitToFormspree(form) {
            const formspreeId = form.dataset.formspreeId;
            if (!formspreeId) {
                console.error('Connect Widget: No Formspree ID configured');
                return false;
            }

            // Set the page URL hidden field
            const pageUrlInput = form.querySelector('[name="Page URL"]');
            if (pageUrlInput) {
                pageUrlInput.value = window.location.href;
            }

            const formData = new FormData(form);

            try {
                const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    return true;
                } else {
                    const data = await response.json();
                    console.error('Connect Widget: Formspree error', data);
                    return false;
                }
            } catch (error) {
                console.error('Connect Widget: Form submission error', error);
                return false;
            }
        }

        // Handle form submission (reusable for both popup and expanded)
        async function handleFormSubmit(e) {
            e.preventDefault();
            const form = e.target;

            const submitBtn = form.querySelector('.cw-submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            // Determine which handler to use
            const handler = form.dataset.handler;
            let success = false;

            if (handler === 'hcp') {
                success = await submitToHCP(form);
            } else {
                success = await submitToFormspree(form);
            }

            if (success) {
                // Show success based on context
                if (isExpanded) {
                    // Show success in expanded view
                    expandedBody.innerHTML = `
                        <div class="cw-success">
                            <div class="cw-success-icon">
                                ${icons.check}
                            </div>
                            <h3>Message Sent!</h3>
                            <p>We'll get back to you as soon as possible.</p>
                        </div>
                    `;
                    // Auto-close after delay
                    setTimeout(() => {
                        closeExpanded();
                    }, 3000);
                } else {
                    showView('success');
                    form.reset();
                    // Auto-close after delay
                    setTimeout(() => {
                        closePopup();
                        setTimeout(() => showView('menu'), 300);
                    }, 3000);
                }
            } else {
                alert('There was an error sending your message. Please try again.');
            }

            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }

        // Attach form handlers to original forms
        const forms = document.querySelectorAll('#cw-text-form, #cw-email-form, #cw-callback-form');
        forms.forEach(form => {
            form.addEventListener('submit', handleFormSubmit);
        });

        // =====================
        // Chat Functionality
        // =====================

        // Chat state
        let chatMessages = []; // Store conversation history for API
        let isChatLoading = false;

        // Get chat elements
        const chatMessagesContainer = document.getElementById('cw-chat-messages');
        const chatInput = document.getElementById('cw-chat-input');
        const chatSendBtn = document.getElementById('cw-chat-send');

        // Simple markdown to HTML conversion
        function renderMarkdown(text) {
            return text
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')  // **bold**
                .replace(/\*(.+?)\*/g, '<em>$1</em>')              // *italic*
                .replace(/__(.+?)__/g, '<strong>$1</strong>')      // __bold__
                .replace(/_(.+?)_/g, '<em>$1</em>')                // _italic_
                .replace(/\n/g, '<br>');                           // newlines
        }

        // Add message to chat UI
        function addChatMessage(content, role) {
            const messageEl = document.createElement('div');
            messageEl.className = `cw-chat-message cw-chat-message--${role}`;
            if (role === 'assistant') {
                messageEl.innerHTML = renderMarkdown(content);
            } else {
                messageEl.textContent = content;
            }
            chatMessagesContainer.appendChild(messageEl);
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }

        // Show typing indicator
        function showTypingIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'cw-typing-indicator';
            indicator.id = 'cw-typing-indicator';
            indicator.innerHTML = `
                <div class="cw-typing-dot"></div>
                <div class="cw-typing-dot"></div>
                <div class="cw-typing-dot"></div>
            `;
            chatMessagesContainer.appendChild(indicator);
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }

        // Hide typing indicator
        function hideTypingIndicator() {
            const indicator = document.getElementById('cw-typing-indicator');
            if (indicator) {
                indicator.remove();
            }
        }

        // Show error in chat
        function showChatError(message) {
            const errorEl = document.createElement('div');
            errorEl.className = 'cw-chat-error';
            errorEl.textContent = message;
            chatMessagesContainer.appendChild(errorEl);
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }

        // Send chat message to worker
        async function sendChatMessage(userMessage) {
            if (!config.chatWorkerUrl || isChatLoading) return;

            isChatLoading = true;
            chatSendBtn.disabled = true;

            // Add user message to UI and history
            addChatMessage(userMessage, 'user');
            chatMessages.push({ role: 'user', content: userMessage });

            // Show typing indicator
            showTypingIndicator();

            try {
                const response = await fetch(config.chatWorkerUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        messages: chatMessages,
                        companyName: config.companyName,
                    }),
                });

                const data = await response.json();

                hideTypingIndicator();

                if (response.ok && data.success && data.reply) {
                    // Add assistant response to UI and history
                    addChatMessage(data.reply, 'assistant');
                    chatMessages.push({ role: 'assistant', content: data.reply });
                } else {
                    // Show fallback message
                    const fallback = data.fallback || "I'm having trouble connecting. Please call us at (319) 899-4381.";
                    showChatError(fallback);
                }

            } catch (error) {
                console.error('Connect Widget: Chat error', error);
                hideTypingIndicator();
                showChatError("I'm having trouble connecting. Please call us at (319) 899-4381.");
            }

            isChatLoading = false;
            chatSendBtn.disabled = false;
            chatInput.focus();
        }

        // Handle chat send
        function handleChatSend() {
            const message = chatInput.value.trim();
            if (message && !isChatLoading) {
                chatInput.value = '';
                chatInput.style.height = 'auto';
                sendChatMessage(message);
            }
        }

        // Chat event listeners (only if chat elements exist)
        if (chatSendBtn && chatInput) {
            chatSendBtn.addEventListener('click', handleChatSend);

            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSend();
                }
            });

            // Auto-resize textarea
            chatInput.addEventListener('input', () => {
                chatInput.style.height = 'auto';
                chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
            });
        }

        // Reset chat when view changes away from chat
        function resetChat() {
            chatMessages = [];
            if (chatMessagesContainer) {
                chatMessagesContainer.innerHTML = `<div class="cw-chat-message cw-chat-message--assistant">${config.chatWelcomeMessage}</div>`;
            }
            if (chatInput) {
                chatInput.value = '';
                chatInput.style.height = 'auto';
            }
        }

        // Phone number formatting for all phone inputs
        document.querySelectorAll('.cw-phone-input').forEach(phoneInput => {
            phoneInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 10) value = value.slice(0, 10);

                if (value.length >= 6) {
                    value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
                } else if (value.length >= 3) {
                    value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                }

                e.target.value = value;
            });
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (isExpanded) {
                    closeExpanded();
                } else if (isOpen) {
                    closePopup();
                }
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (isOpen && !e.target.closest('.cw-popup, .cw-floating-btn, .cw-floating-btns, .cw-welcome-bubble')) {
                closePopup();
            }
        });
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose API
    window.ConnectWidget = {
        open: function(view = 'menu') {
            const popup = document.getElementById('cw-popup');
            popup.classList.add('cw-visible');
            document.querySelectorAll('.cw-view').forEach(v => v.classList.remove('cw-active'));
            const viewEl = document.getElementById(`cw-view-${view}`);
            if (viewEl) viewEl.classList.add('cw-active');
        },
        close: function() {
            const popup = document.getElementById('cw-popup');
            popup.classList.remove('cw-visible');
        },
        config: config,
    };

})();
