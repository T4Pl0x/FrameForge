export function ApprovalsCard(){
  return (
    <div>
      <div className="widget-title">Approvals</div>
      <div className="muted" style={{marginBottom:8}}>Pending proposals will appear here.</div>
      <ul style={{listStyle:'none', padding:0, margin:0}}>
        <li style={{padding:'6px 0', borderTop:'1px solid var(--border)'}}>
          <strong className="muted">No pending approvals</strong>
        </li>
      </ul>
    </div>
  );
}

