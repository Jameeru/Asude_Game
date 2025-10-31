import './RulesModal.css';
import PropTypes from 'prop-types';

const RulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="rules-modal-overlay" onClick={onClose}>
      <div className="rules-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="rules-modal-header">
          <h2>🎯 Asude Competator GAme Rules & Mechanics</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="rules-modal-body">
          {/* Basic Objective */}
          <section className="rules-section">
            <h3>🏆 Objective</h3>
            <p>Be the first player to eliminate all <strong>8 opponent coins</strong> by moving your coins strategically and using special zone powers!</p>
          </section>

          {/* Board Layout */}
          <section className="rules-section">
            <h3>🗺️ Board Layout</h3>
            <ul>
              <li><strong>13x13 grid</strong> (R1C1 to R13C13)</li>
              <li><strong>🟢 Green Zone:</strong> Player 1 home area</li>
              <li><strong>🔵 Blue Zone:</strong> Player 2 home area</li>
              <li><strong>🟡 Observer Zones:</strong> R2C7 & R12C7</li>
              <li><strong>🎯 Target Zones:</strong> R1C7 & R13C7</li>
              <li><strong>⚫ Forbidden Zone:</strong> Center 3x3 grid (R6C6-R8C8)</li>
            </ul>
          </section>

          {/* Movement Rules */}
          <section className="rules-section">
            <h3>🚀 Movement Rules</h3>
            <ul>
              <li><strong>Primary Movement:</strong> Diagonal only (1-2 steps)</li>
              <li><strong>Corner Movement:</strong> Straight movement allowed (1 step) from corner positions</li>
              <li><strong>Range:</strong> Most moves are 1-2 steps in chosen direction</li>
            </ul>
          </section>

          {/* Special Power Positions */}
          <section className="rules-section">
            <h3>⚡ Special Power Positions</h3>
            <div className="power-position">
              <h4>📍 R3C7 & R11C7 - Strategic Gateway Positions:</h4>
              <ul>
                <li><strong>🟡 Observer Zone Access:</strong> Move to any observer zone in 1 step</li>
                <li><strong>🎯 Direct Target Access:</strong> Move to any target zone in 2 steps</li>
                <li><strong>💡 Strategic Value:</strong> Gateway positions for powerful moves</li>
                <li><strong>💡 Tip:</strong> Use these positions to gain tactical advantages and quick access to key zones!</li>
              </ul>
            </div>
          </section>

          {/* Observer Zone Powers */}
          <section className="rules-section">
            <h3>🟡 Observer Zone Powers</h3>
            <div className="power-position">
              <h4>🔋 R2C7 & R12C7 - Observer zones with multiple abilities:</h4>
              <ul>
                <li><strong>⚡ Elimination Power:</strong> Can eliminate in ANY target zone</li>
                <li><strong>⬅️ Backward Movement:</strong> Gain 1-step backward movement ability</li>
                <li><strong>🎯 Target Access:</strong> Direct path to own target zone</li>
                <li><strong> Observer zones are power-up positions that unlock new movement and elimination abilities!</strong></li>
              </ul>
            </div>
          </section>

          {/* Corner Positions */}
          <section className="rules-section">
            <h3>🏰 Corner Positions</h3>
            <div className="power-position">
              <h4>📍 R12C1, R13C1, R1C1, R2C1, R1C13, R2C13, R12C13, R13C13 - Corner positions:</h4>
              <ul>
                <li><strong>🎯 Initial Setup:</strong> Coins can be placed here during initial setup phase</li>
                <li><strong>↗️ Diagonal Only:</strong> ONLY diagonal movement (1-2 steps) - no forward, backward, or side movement</li>
                <li><strong>🚫 No Straight Movement:</strong> Cannot move up, down, left, or right - diagonal movement only</li>
                <li><strong>🏠 Home Zone:</strong> Located within respective player home zones</li>
                <li><strong>💡 Corner positions have standard diagonal movement only - same as regular board positions!</strong></li>
              </ul>
            </div>
          </section>

          {/* Stacking Rules */}
          <section className="rules-section">
            <h3>📚 Stacking Rules</h3>
            <div className="stacking-rules">
              <h4>🔄 Coin Stacking Mechanics:</h4>
              <div className="stacking-allowed">
                <h5>✅ Allowed Stacking:</h5>
                <ul>
                  <li><strong>🎯 Target Zone ONLY:</strong> Same player coins can stack ONLY in target zones (R1C7 and R13C7)</li>
                  <li><strong>🎯 Target Zone Stacking:</strong> Used for elimination and scoring points</li>
                </ul>
              </div>
              <div className="stacking-forbidden">
                <h5>❌ Forbidden Stacking:</h5>
                <ul>
                  <li><strong>No Opponent Stacking:</strong> Player 1 coins cannot stack on Player 2 coins anywhere</li>
                  <li><strong>No Opponent Stacking:</strong> Player 2 coins cannot stack on Player 1 coins anywhere</li>
                  <li><strong>🏠 Home Zone Exception:</strong> No stacking allowed in home zones (green/blue areas)</li>
                  <li><strong>🚫 Regular Board:</strong> No stacking allowed anywhere outside target zones</li>
                </ul>
              </div>
              <p className="stacking-tip"><strong>💡 Stacking is now ONLY allowed in target zones (R1C7, R13C7) for scoring!</strong></p>
            </div>
          </section>

          {/* Controls */}
          <section className="rules-section">
            <h3>🎮 Game Controls</h3>
            <ul>
              <li><strong>Click coin</strong> to select (only your coins on your turn)</li>
              <li><strong>Click destination</strong> to move selected coin</li>
              <li><strong>Valid moves</strong> are highlighted on the board</li>
              <li><strong>Stacked coins</strong> show count numbers</li>
              <li><strong>Special zones</strong> have distinct colors and effects</li>
            </ul>
          </section>

          {/* Winning */}
          <section className="rules-section">
            <h3>🏆 How to Win</h3>
            <p><strong>Victory Condition:</strong> Be the first player to eliminate all 8 opponent coins by moving them into valid target zones!</p>
            <div className="win-tips">
              <h4>🎯 Pro Tips:</h4>
              <ul>
                <li>Visit observer zones to gain elimination power</li>
                <li>Use special power positions as gateways</li>
                <li>Stack coins strategically for protection</li>
                <li>Control key positions to limit opponent movement</li>
                <li>Plan your route through special zones</li>
              </ul>
            </div>
          </section>
        </div>
        
        <div className="rules-modal-footer">
          <button className="close-rules-btn" onClick={onClose}>
            🎮 Start Playing!
          </button>
        </div>
      </div>
    </div>
  );
};

RulesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default RulesModal;
