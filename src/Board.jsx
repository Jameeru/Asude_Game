import Coin from "./Coin";
import "./Board.css";
import PropTypes from 'prop-types';

const BOARD_SIZE = 13;

function Board({ coins, selected, validMoves, onSelect, onMove, greenZone, blueZone, forbiddenZone, observerZone, targetZone, gamePhase, placementMode, currentPlayer, coinVariant = 'human', playerVariants = {1: 'human', 2: 'animal'}, blinkingTile = null }) {
  // Baby pink zone coordinates
  const BABY_PINK_ZONE = [
    [1,2],[2,2],[1,4],[2,4],[1,6],[2,6],[1,8],[2,8],[1,10],[2,10],[1,12],[2,12],
    [12,2],[13,2],[12,4],[13,4],[12,6],[13,6],[12,8],[13,8],[12,10],[13,10],[12,12],[13,12]
  ];

  // Directional hint zones - positions that are 1 step away from target zones
  const DIRECTIONAL_HINT_ZONES = {
    'right-arrow': [[13,6], [1,6]], // R13C6 and R1C6 - need to go RIGHT to reach target
    'left-arrow': [[13,8], [1,8]],  // R13C8 and R1C8 - need to go LEFT to reach target
    'diagonal-down-right': [[12,6]], // R12C6 - need to go DIAGONAL down-right to reach R13C7
    'diagonal-up-right': [[2,6]],    // R2C6 - need to go DIAGONAL up-right to reach R1C7
    'diagonal-down-left': [[12,8]],  // R12C8 - need to go DIAGONAL down-left to reach R13C7
    'diagonal-up-left': [[2,8]]      // R2C8 - need to go DIAGONAL up-left to reach R1C7
  };

  // Helper: get zone type including safety lines
  function getZone(row, col) {
    if (greenZone.some(([r, c]) => r === row && c === col)) return "green";
    if (blueZone.some(([r, c]) => r === row && c === col)) return "blue";
    if (forbiddenZone.some(([r, c]) => r === row && c === col)) return "forbidden";
    if ((observerZone[1][0] === row && observerZone[1][1] === col) || (observerZone[2][0] === row && observerZone[2][1] === col)) return "observer";
    if ((targetZone[1][0] === row && targetZone[1][1] === col) || (targetZone[2][0] === row && targetZone[2][1] === col)) return "target";
    if (BABY_PINK_ZONE.some(([r, c]) => r === row && c === col)) return "baby-pink";
    
    // Check directional hint zones
    if (DIRECTIONAL_HINT_ZONES['right-arrow'].some(([r, c]) => r === row && c === col)) return "right-arrow";
    if (DIRECTIONAL_HINT_ZONES['left-arrow'].some(([r, c]) => r === row && c === col)) return "left-arrow";
    if (DIRECTIONAL_HINT_ZONES['diagonal-down-right'].some(([r, c]) => r === row && c === col)) return "diagonal-down-right";
    if (DIRECTIONAL_HINT_ZONES['diagonal-up-right'].some(([r, c]) => r === row && c === col)) return "diagonal-up-right";
    if (DIRECTIONAL_HINT_ZONES['diagonal-down-left'].some(([r, c]) => r === row && c === col)) return "diagonal-down-left";
    if (DIRECTIONAL_HINT_ZONES['diagonal-up-left'].some(([r, c]) => r === row && c === col)) return "diagonal-up-left";
    
    // Safety lines are now invisible - no display logic needed
    
    return "";
  }

  // Find coins at position
  function coinsAt(row, col) {
    let result = [];
    Object.entries(coins).forEach(([player, arr]) => {
      arr.forEach(coin => {
        if (coin.row === row && coin.col === col) {
          result.push({ ...coin, player: Number(player) });
        }
      });
    });
    
    // Sort by ID for consistent stacking order
    result.sort((a, b) => a.id - b.id);
    
    // Check if this is a target zone and mark all coins as stacked
    const isTargetZone = (targetZone[1][0] === row && targetZone[1][1] === col) ||
                        (targetZone[2][0] === row && targetZone[2][1] === col);
    
    if (isTargetZone && result.length > 0) {
      result = result.map(coin => ({ ...coin, stacked: true }));
    }
    
    return result;
  }

    // Check if position is a valid move or placement
  function isValidMove(row, col) {
    if (gamePhase === 'setup') {
      return isValidPlacement(row, col);
    }
    return validMoves.some(([moveRow, moveCol]) => moveRow === row && moveCol === col);
  }

  // Check if cell is part of the center ASUDE tile
  function isCenterTile(row, col) {
    return (row >= 6 && row <= 8) && (col >= 6 && col <= 8);
  }

  // Check if this is the main center cell for ASUDE text
  function isCenterTextCell(row, col) {
    return row === 7 && col === 7;
  }

  // Check if position is valid for placement during setup
  function isValidPlacement(row, col) {
    if (!placementMode || !currentPlayer) return false;
    
    const forbiddenZones = forbiddenZone || [];
    if (forbiddenZones.some(([r, c]) => r === row && c === col)) return false;
    
    if (placementMode === 'target') {
      // Must be opponent's target zone (stacking allowed)
      const opponentTarget = currentPlayer === 1 ? 
        [targetZone[2][0], targetZone[2][1]] : 
        [targetZone[1][0], targetZone[1][1]];
      return row === opponentTarget[0] && col === opponentTarget[1];
    } else if (placementMode === 'home') {
      // Must be own home zone and not occupied (no stacking in home)
      const homeZone = currentPlayer === 1 ? greenZone : blueZone;
      const isInHomeZone = homeZone.some(([r, c]) => r === row && c === col);
      if (!isInHomeZone) return false;
      
      // Check if already occupied - no stacking allowed in home zones
      const coinsHere = coinsAt(row, col);
      return coinsHere.length === 0;
    }
    
    return false;
  }

  // Render board
  const rows = [];
  for (let r = 1; r <= BOARD_SIZE; r++) {
    const cells = [];
    for (let c = 1; c <= BOARD_SIZE; c++) {
      const zone = getZone(r, c);
      const coinsHere = coinsAt(r, c);
      const isValid = isValidMove(r, c);
      const isCenterCell = isCenterTile(r, c);
      const showAsudeText = isCenterTextCell(r, c);
      const isBlinking = blinkingTile && blinkingTile.row === r && blinkingTile.col === c;
      
      // Determine which player's target zone this is
      const isPlayer1Target = targetZone[1][0] === r && targetZone[1][1] === c; // R1C7
      const isPlayer2Target = targetZone[2][0] === r && targetZone[2][1] === c; // R13C7
      
      // Get the coin variant for the target zone owner
      let targetZoneVariant = null;
      if (isPlayer1Target) {
        targetZoneVariant = playerVariants[1] || 'human';
      } else if (isPlayer2Target) {
        targetZoneVariant = playerVariants[2] || 'animal';
      }
      
      cells.push(
        <td
          key={c}
          className={`cell ${zone} ${isValid ? 'valid-move' : ''} ${gamePhase === 'setup' && isValid ? 'setup-highlight' : ''} ${isCenterCell ? 'center-tile' : ''} ${isBlinking ? 'safety-blink' : ''}`}
          data-target-variant={targetZoneVariant}
          onClick={() => onMove && onMove(r, c)}
          title={`R${r}C${c}${gamePhase === 'setup' && isValid ? ` - Place ${placementMode} coin here` : ''}`}
        >
          {/* External tile labels */}
          {!isCenterCell && (
            <>
              {/* Row label - positioned outside left edge */}
              {c === 1 && (
                <div className="external-row-label">{r}</div>
              )}
              
              {/* Column label - positioned outside top edge */}
              {r === 1 && (
                <div className="external-col-label">{c}</div>
              )}
            </>
          )}
          
          <div className="cell-content">
            {/* Show ASUDE text only in center cell */}
            {showAsudeText && (
              <div className="asude-text">
                ASUDE
              </div>
            )}
            
            {/* Hide row/col labels and coins for center tiles */}
            {!isCenterCell && (
              <>
                {/* Render coins - show only one coin with count on top */}
                <div className="coins-container">
              {coinsHere.length > 0 && (
                <>
                  {/* Show count above if more than 1 coin */}
                  {coinsHere.length > 1 && (
                    <div className="coin-count-display">
                      <span className="coin-count">
                        {coinsHere.length}
                      </span>
                    </div>
                  )}
                  
                  {/* Show only the top coin */}
                  <div 
                    className="coin-wrapper"
                    onClick={e => { 
                      e.stopPropagation(); 
                      
                      // Check if we should prioritize move over coin selection
                      const isValidMoveDestination = validMoves.some(([moveRow, moveCol]) => moveRow === r && moveCol === c);
                      const hasSelectedCoin = selected && selected.player && selected.id;
                      
                      if (hasSelectedCoin && isValidMoveDestination) {
                        // Prioritize move action over coin selection
                        onMove && onMove(r, c);
                      } else {
                        // Normal coin selection - select the top coin
                        const topCoin = coinsHere[coinsHere.length - 1];
                        onSelect && onSelect(topCoin.player, topCoin.id);
                      }
                    }}
                  >
                    <Coin 
                      player={coinsHere[coinsHere.length - 1].player} 
                      selected={selected && coinsHere.some(coin => selected.player === coin.player && selected.id === coin.id)}
                      stacked={false}
                      stackPosition={0}
                      eliminated={coinsHere[coinsHere.length - 1].eliminated || false}
                      isTargetStack={false}
                      coinId={coinsHere[coinsHere.length - 1].id}
                      // Use per-player variant mapping (playerVariants)
                      variant={playerVariants[coinsHere[coinsHere.length - 1].player] || coinVariant}
                    />
                  </div>
                </>
              )}
            </div>
                
                {/* Show valid move/placement indicator only for non-center cells */}
                {isValid && !isCenterCell && (
                  <div className="valid-move-indicator">
                  </div>
                )}
              </>
            )}
          </div>
        </td>
      );
    }
    rows.push(<tr key={r}>{cells}</tr>);
  }

  return (
    <div className="board-container">
      <table className="board">
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
Board.propTypes = {
  coins: PropTypes.object.isRequired,
  selected: PropTypes.object,
  validMoves: PropTypes.array.isRequired,
  onSelect: PropTypes.func,
  onMove: PropTypes.func,
  greenZone: PropTypes.array.isRequired,
  blueZone: PropTypes.array.isRequired,
  forbiddenZone: PropTypes.array.isRequired,
  observerZone: PropTypes.object.isRequired,
  targetZone: PropTypes.object.isRequired,
  gamePhase: PropTypes.string.isRequired,
  placementMode: PropTypes.string,
  currentPlayer: PropTypes.number,
  blinkingTile: PropTypes.shape({
    row: PropTypes.number,
    col: PropTypes.number
  })
};

export default Board;
