import React from 'react';

export default function ItineraryDayCard({ day, dayIndex }) {
  // Use dummy data if day.items is missing or doesn't fit the new design
  const items = Array.isArray(day?.items) && day.items.length > 0 ? day.items : [
    { time: "8:30 AM", title: "Breakfast with Matterhorn views", tag: "Dining", duration: "1h 30m" },
    { time: "9:30 AM", title: "Guided hike: Five Lakes Trail", tag: "Activity", duration: "4-5 hrs" },
    { time: "1:00 PM", title: "Alpine picnic lunch", tag: "Dining", duration: "Included" },
    { time: "4:00 PM", title: "Free time & spa at hotel", tag: "Wellness", duration: "2 hrs" },
  ];

  const imageUrls = [
    "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=300&q=80"
  ];

  const imageUrl = imageUrls[dayIndex % imageUrls.length];

  return (
    <div className="itinerary-day-card">
      <div className="day-header">
        <div className="day-badge">{day?.dayNumber || dayIndex + 1}</div>
        <h3>Day {day?.dayNumber || dayIndex + 1} <span className="day-title">{day?.title || "Zermatt Explorer"}</span></h3>
        <div className="day-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Zermatt
        </div>
      </div>

      <div className="day-content">
        <div className="timeline-container">
          {items.map((item, idx) => (
            <div key={idx} className="timeline-row">
              <div className="time">{item.time || "10:00 AM"}</div>
              <div className="activity-title">{item.title}</div>
              <div className="tags">
                {item.tag && <span className="tag-pill">{item.tag}</span>}
                {item.duration && <span className="duration-text">{item.duration}</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="image-container">
           <img src={imageUrl} alt="Location" className="location-image" />
           <div className="map-pin">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
           </div>
        </div>
      </div>

      <style jsx>{`
        .itinerary-day-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .day-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #F3F4F6;
        }

        .day-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #9D5A4A;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .day-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }

        .day-title {
          font-weight: 500;
          margin-left: 8px;
        }

        .day-location {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #6B7280;
          font-size: 13px;
          margin-left: auto;
        }

        .day-content {
          display: grid;
          grid-template-columns: 1fr 180px;
          gap: 24px;
        }

        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .timeline-row {
          display: grid;
          grid-template-columns: 80px 1fr auto;
          gap: 16px;
          align-items: center;
        }

        .time {
          font-size: 13px;
          color: #6B7280;
          font-weight: 500;
        }

        .activity-title {
          font-size: 14px;
          color: #374151;
        }

        .tags {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 140px;
        }

        .tag-pill {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          background: #FFF8E1;
          color: #B45309;
          border: 1px solid #FDE68A;
        }

        .duration-text {
          font-size: 12px;
          color: #6B7280;
        }

        .image-container {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          height: 120px;
        }

        .location-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .map-pin {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          color: #374151;
        }
      `}</style>
    </div>
  );
}
