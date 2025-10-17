import React, { useState } from 'react';

export default function PromptLabView() {
  const [prompt, setPrompt] = useState('Create a login form with email and password fields.');
  const [variantA, setVariantA] = useState('');
  const [variantB, setVariantB] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runABTest = () => {
    setIsRunning(true);

    // Simulate A/B testing locally (no network calls)
    setTimeout(() => {
      // Variant A: More detailed/verbose
      setVariantA(`## Variant A: Detailed Approach

I'll create a comprehensive login form with the following components:

1. **Email Field**: Email input with validation
   - Type: email
   - Required: true
   - Placeholder: "Enter your email address"
   - Pattern validation for email format

2. **Password Field**: Secure password input
   - Type: password
   - Required: true
   - Minimum length: 8 characters
   - Show/hide password toggle

3. **Submit Button**: Primary action button
   - Text: "Sign In"
   - Disabled state during submission
   - Loading spinner when processing

4. **Accessibility Considerations**:
   - Proper ARIA labels
   - Keyboard navigation support
   - Screen reader friendly

5. **Visual Design**:
   - Clean, modern appearance
   - Responsive layout for mobile/desktop
   - Form validation error states
   - Success feedback on login`);

      // Variant B: Concise/direct
      setVariantB(`## Variant B: Minimal Approach

Login Form Components:

**Email Input**
- Type: email, required, placeholder "your@email.com"

**Password Input**
- Type: password, required, min length 8

**Login Button**
- Text: "Login", primary style, submit type

**Form Features**
- Client-side validation only
- Basic styling
- No extra animations or states`);

      setIsRunning(false);
    }, 1000); // Simulate processing time
  };

  return (
    <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Prompt Lab</h2>
          <p style={{ margin: 4, fontSize: 12, color: '#6B7280' }}>
            Test and compare prompt variations locally (no network calls)
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16, height: 'calc(100% - 80px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Test Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                width: '100%',
                height: 120,
                padding: 8,
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                fontSize: 13,
                fontFamily: 'monospace'
              }}
              placeholder="Enter a prompt to test different variations..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
            <div>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Variant A (Detailed)</h3>
              <div style={{
                height: 400,
                padding: 12,
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                background: '#F9FAFB',
                overflow: 'auto',
                fontSize: 12,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap'
              }}>
                {variantA || 'Click "Run A/B Test" to generate variants...'}
              </div>
            </div>

            <div>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Variant B (Concise)</h3>
              <div style={{
                height: 400,
                padding: 12,
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                background: '#F9FAFB',
                overflow: 'auto',
                fontSize: 12,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap'
              }}>
                {variantB || 'Click "Run A/B Test" to generate variants...'}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={runABTest}
              disabled={isRunning || !prompt.trim()}
              style={{
                padding: '8px 12px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500,
                cursor: isRunning ? 'not-allowed' : 'pointer',
                opacity: (isRunning || !prompt.trim()) ? 0.6 : 1
              }}
            >
              {isRunning ? 'Generating...' : 'Run A/B Test'}
            </button>

            <div style={{ padding: 12, background: '#F3F4F6', borderRadius: 4 }}>
              <h4 style={{ margin: 0, marginBottom: 8, fontSize: 12, fontWeight: 600 }}>How it works</h4>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#6B7280' }}>
                <li>Variant A: Detailed, comprehensive approach</li>
                <li>Variant B: Minimal, direct approach</li>
                <li>Both generated locally (no API calls)</li>
                <li>Compare different communication styles</li>
              </ul>
            </div>

            {variantA && variantB && (
              <div style={{ padding: 12, background: '#ECFDF5', border: '1px solid #10B981', borderRadius: 4 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#047857' }}>
                  ✅ A/B test complete! Both variants generated locally.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
