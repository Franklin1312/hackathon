import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PCOL   = { high:'#c0392b', medium:'#8b6914', low:'#4a7c59' }
const SCOL   = { pending:'#8b6914', 'in-progress':'#2563a8', resolved:'#4a7c59' }
const CICON  = { pothole:'🕳️', garbage:'🗑️', streetlight:'💡', water:'💧', road:'🚧' }

function pinIcon(priority, status) {
  const col = status === 'resolved' ? SCOL.resolved : (PCOL[priority] || '#4a7c59')
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <div style="width:14px;height:14px;border-radius:50%;background:${col};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>
      <div style="width:2px;height:8px;background:${col};border-radius:0 0 2px 2px;"></div>
    </div>`,
    iconSize: [14, 22], iconAnchor: [7, 22], popupAnchor: [0, -26],
  })
}

function LocationPicker({ onSelect }) {
  useMapEvents({ click: e => onSelect && onSelect(e.latlng) })
  return null
}

export default function MapComponent({ issues = [], onLocationSelect, selectedLocation, height = '400px' }) {
  const navigate = useNavigate()
  const center = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : [28.6139, 77.2090]

  return (
    <MapContainer center={center} zoom={13} style={{ height, width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {onLocationSelect && <LocationPicker onSelect={onLocationSelect} />}

      {selectedLocation && (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={L.divIcon({
            className: '',
            html: `<div style="display:flex;flex-direction:column;align-items:center;">
              <div style="width:16px;height:16px;border-radius:50%;background:#4a7c59;border:2.5px solid white;box-shadow:0 0 0 4px rgba(74,124,89,0.2);"></div>
              <div style="width:2px;height:8px;background:#4a7c59;"></div>
            </div>`,
            iconSize: [16, 26], iconAnchor: [8, 26],
          })}
        >
          <Popup><span style={{ fontFamily: 'Jost, sans-serif', fontSize: '13px' }}>📍 Selected location</span></Popup>
        </Marker>
      )}

      {issues.map(issue => {
        const coords = issue.location?.coordinates
        if (!coords || coords.length < 2) return null
        const [lng, lat] = coords
        return (
          <Marker key={issue._id} position={[lat, lng]} icon={pinIcon(issue.priority, issue.status)}>
            <Popup>
              <div style={{ fontFamily: 'Jost, sans-serif', minWidth: '170px', padding: '2px' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '14px', fontWeight: 700, color: '#2d1f0e', marginBottom: '4px', lineHeight: 1.3 }}>
                  {CICON[issue.category]} {issue.title}
                </div>
                <div style={{ fontSize: '12px', color: '#8a7a65', marginBottom: '8px' }}>📍 {issue.location?.address}</div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px',
                    background: issue.status === 'resolved' ? 'rgba(74,124,89,0.12)' : issue.status === 'in-progress' ? 'rgba(37,99,168,0.1)' : 'rgba(139,105,20,0.1)',
                    color: issue.status === 'resolved' ? '#2d5a3d' : issue.status === 'in-progress' ? '#2563a8' : '#8b6914',
                    border: `1px solid ${issue.status === 'resolved' ? 'rgba(74,124,89,0.2)' : issue.status === 'in-progress' ? 'rgba(37,99,168,0.2)' : 'rgba(139,105,20,0.2)'}`,
                  }}>
                    {issue.status === 'in-progress' ? 'In Progress' : issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                  </span>
                  <span style={{ fontSize: '11px', color: '#8a7a65' }}>👍 {issue.upvotes}</span>
                </div>
                <button
                  onClick={() => navigate(`/issues/${issue._id}`)}
                  style={{
                    width: '100%', padding: '6px', borderRadius: '8px', fontSize: '12px',
                    background: 'linear-gradient(135deg,#4a7c59,#2d5a3d)',
                    border: 'none', color: '#e8d5b0', cursor: 'pointer',
                    fontFamily: 'Jost, sans-serif', fontWeight: 600,
                  }}
                >
                  View Details →
                </button>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
