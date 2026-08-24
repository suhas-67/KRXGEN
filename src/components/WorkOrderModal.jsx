import React, { useState } from 'react'

export default function WorkOrderModal({ isOpen, onClose, economicDispatch, diagnosis, thermalState, soilingLossPct, onDispatchSuccess }) {
  const [isSent, setIsSent] = useState(false)

  if (!isOpen) return null

  const handleDispatch = async () => {
    try {
      const botToken = "8820953577:AAGOl8xF0tzaucTszeqOSVcjRtLHGdlQlXU"
      const chatId = "8361047625"
      const defectStr = diagnosis?.status === 'BYPASS_DIODE_FAULT' 
        ? 'Blown Bypass Diode (33.3% Vmp Drop)' 
        : `Uniform Soiling + ${soilingLossPct}% Dust Accumulation (SI = ${(1 - soilingLossPct/100).toFixed(2)})`;
      
      const thermalAlert = thermalState?.isCriticalHotspot 
        ? `\n🔥 URGENT: Thermal Hotspot detected! Shaded cell junction estimated at ${thermalState.tHotspot}°C.`
        : "";

      const messageText = `🚨 MAINTENANCE WORK ORDER\n\nTarget Asset: String 2, Panel #4-9\nDetected Defect: ${defectStr}${thermalAlert}\n\nFinancial Urgency: Avoidable Loss of ₹${economicDispatch?.dailyRevenueLost || 0}/day.\nWeather Clearance: Rain probability ${economicDispatch?.maxRainProb || 0}% for next 72h. Safe to wash/repair.\n\nPlease confirm dispatch receipt and ETA by replying "yes".`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: messageText })
      })

      if (response.ok) {
        setIsSent(true)
        if (onDispatchSuccess) onDispatchSuccess();
        setTimeout(() => {
          setIsSent(false)
          onClose()
        }, 2000)
      } else {
        console.error("Telegram API Error", await response.text());
        alert("Failed to send message via Telegram API");
      }
    } catch(err) {
      console.error(err);
      alert("Error sending dispatch.");
    }
  }

  return (
    <div className="modal-overlay">
      <div className="work-order-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>📱 Automated Dispatch Preview</h2>
        <p className="modal-subtitle">The AI engine is formatting a Telegram / WhatsApp work order for the field tech.</p>

        <div className="ticket-preview">
          <div className="ticket-header">
            <strong>🤖 HelioSense Bot</strong>
            <span className="ticket-time">Just Now</span>
          </div>
          <div className="ticket-body">
            <p><strong>🚨 MAINTENANCE WORK ORDER</strong></p>
            <br/>
            <p><strong>Target Asset:</strong> String 2, Panel #4-9</p>
            <p><strong>Detected Defect:</strong> {diagnosis?.status === 'BYPASS_DIODE_FAULT' ? 'Blown Bypass Diode (33.3% Vmp Drop)' : 'Uniform Soiling'} + {soilingLossPct}% Dust Accumulation (SI = {(1 - soilingLossPct/100).toFixed(2)})</p>
            
            {thermalState?.isCriticalHotspot && (
              <p className="ticket-alert">🔥 <strong>URGENT:</strong> Thermal Hotspot detected! Shaded cell junction estimated at {thermalState.tHotspot}°C.</p>
            )}

            <p><strong>Financial Urgency:</strong> Avoidable Loss of ₹{economicDispatch?.dailyRevenueLost || 0}/day.</p>
            <p><strong>Weather Clearance:</strong> Rain probability {economicDispatch?.maxRainProb || 0}% for next 72h. Safe to wash/repair.</p>
            <br/>
            <p><em>Please confirm dispatch receipt and ETA.</em></p>
          </div>
        </div>

        <div className="modal-actions">
          <button className={`send-dispatch-btn ${isSent ? 'sent' : ''}`} onClick={handleDispatch} disabled={isSent}>
            {isSent ? '✅ SENT SUCCESSFULLY' : '✉️ SEND TO TECHNICIAN NOW'}
          </button>
        </div>
      </div>
    </div>
  )
}
