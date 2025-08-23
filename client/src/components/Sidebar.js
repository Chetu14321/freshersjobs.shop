import AdSlot from "./AdSlot";

export default function Sidebar() {
  return (
    <aside className="col-md-12">
      {/* Sponsored Ad */}
      <div className="p-3 bg-light rounded shadow-sm mb-3 text-center">
        <h5 className="fw-bold mb-3"></h5>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <AdSlot height={250} width={250} /> {/* Medium Rectangle */}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <AdSlot height={250} width={300} /> {/* Medium Rectangle */}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <AdSlot height={250} width={300} /> {/* Medium Rectangle */}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <AdSlot height={250} width={300} /> {/* Medium Rectangle */}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <AdSlot height={250} width={300} /> {/* Medium Rectangle */}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <AdSlot height={250} width={300} /> {/* Medium Rectangle */}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <AdSlot height={250} width={300} /> {/* Medium Rectangle */}
        </div>
      </div>

      {/* Promotions Ad */}
      <div className="p-3 bg-light rounded shadow-sm text-center">
        <h5 className="fw-bold mb-3"></h5>
        <div style={{ overflowX: "auto" }}>
          <AdSlot height={250} width={300} /> {/* Leaderboard Banner */}
        </div>
      </div>
      <div className="p-3 bg-light rounded shadow-sm text-center">
        <h5 className="fw-bold mb-3">Promotions</h5>
        <div style={{ overflowX: "auto" }}>
          <AdSlot height={250} width={300} /> {/* Leaderboard Banner */}
        </div>
      </div>
      <div className="p-3 bg-light rounded shadow-sm text-center">
        <h5 className="fw-bold mb-3">Promotions</h5>
        <div style={{ overflowX: "auto" }}>
          <AdSlot height={250} width={300} /> {/* Leaderboard Banner */}
        </div>
      </div>
      <div className="p-3 bg-light rounded shadow-sm text-center">
        <h5 className="fw-bold mb-3">Promotions</h5>
        <div style={{ overflowX: "auto" }}>
          <AdSlot height={250} width={300} /> {/* Leaderboard Banner */}
        </div>
      </div>
      <div className="p-3 bg-light rounded shadow-sm text-center">
        <h5 className="fw-bold mb-3">Promotions</h5>
        <div style={{ overflowX: "auto" }}>
          <AdSlot height={250} width={300} /> {/* Leaderboard Banner */}
        </div>
      </div>
    </aside>
  );
}
