export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Page - No Auth</h1>
      <p>If you can see this, the basic Next.js app is working!</p>
      <p>Time: {new Date().toLocaleString()}</p>
      <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
        <strong>This page bypasses all authentication and complex components.</strong>
      </div>
    </div>
  )
}