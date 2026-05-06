export default function ShareScreen({ onBackToWorkspace }) {
  return (
    <section className="screen-frame">
      <div className="frame-panel">
        <span className="frame-label">Transmission</span>
        <h2>Share your Voyage</h2>
        <p className="lede">Project your itinerary to collaborators and devices.</p>

        <div className="share-list">
          <div className="share-row">
            <strong>Direct Link</strong>
            <span>Generate a secure URL for mobile viewing.</span>
          </div>
          <div className="share-row">
            <strong>Collaborator Access</strong>
            <span>Invite others to co-edit the itinerary.</span>
          </div>
          <div className="share-row">
            <strong>PDF Export</strong>
            <span>Create a high-fidelity print snapshot.</span>
          </div>
        </div>

        <button className="button button-primary" onClick={onBackToWorkspace} style={{ marginTop: "32px", width: "100%" }}>
          Return to Workspace
        </button>
      </div>
    </section>
  );
}
