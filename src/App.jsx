import { useState, useEffect, useCallback } from "react";
import PropTypes from 'prop-types';
import Board from "./Board";
import Celebration from "./components/Celebration";
import RulesModal from "./components/RulesModal";
import "./App.css";

// Constants for zones
const GREEN_ZONE = [
  [1,1],[1,3],[1,5],[1,9],[1,11],[1,13],
  [2,1],[2,3],[2,5],[2,9],[2,11],[2,13]
];
const BLUE_ZONE = [
  [12,1],[12,3],[12,5],[12,9],[12,11],[12,13],
  [13,1],[13,3],[13,5],[13,9],[13,11],[13,13]
];
const FORBIDDEN_ZONE = [
  [6,6],[6,7],[6,8],
  [7,6],[7,7],[7,8],
  [8,6],[8,7],[8,8]
];
const OBSERVER_ZONE = { 1: [2,7], 2: [12,7] };
const TARGET_ZONE = { 1: [1,7], 2: [13,7] };

// Direct target access positions
const DIRECT_TARGET_ACCESS = {
  1: [[3,5], [3,9]], // Can go directly to Player 1's target
  2: [[11,5], [11,9]] // Can go directly to Player 2's target
};

// Special power positions with enhanced movement abilities
const SPECIAL_POWER_POSITIONS = [
  [3, 7],  // R3C7 - Near Player 1's area
  [11, 7]  // R11C7 - Near Player 2's area
];

// Safety line calculation - 6 tiles in plus (+) pattern with diagonals based on player's direction
function getSafetyLine(row, col, player) {
  const safetyPositions = [];
  
  // Player direction: Player 1 moves downward, Player 2 moves upward
  // Create 6-tile safety pattern: front, back, left, right, left diagonal, right diagonal
  
  if (player === 1) {
    // Player 1 moves downward - pattern oriented for downward movement
    const safetyPattern = [
      [row + 1, col],     // Front (down) - player's forward direction
      [row, col - 1],     // Left
      [row, col + 1],     // Right
      [row + 1, col - 1], // Left diagonal (down-left)
      [row + 1, col + 1]  // Right diagonal (down-right)
    ];
    
    safetyPattern.forEach(([r, c]) => {
      if (r >= 1 && r <= 13 && c >= 1 && c <= 13) {
        safetyPositions.push([r, c]);
      }
    });
  } else {
    // Player 2 moves upward - pattern oriented for upward movement
    const safetyPattern = [
      [row - 1, col],     // Front (up) - player's forward direction
      [row, col - 1],     // Left
      [row, col + 1],     // Right
      [row - 1, col - 1], // Left diagonal (up-left)
      [row - 1, col + 1]  // Right diagonal (up-right)
    ];
    
    safetyPattern.forEach(([r, c]) => {
      if (r >= 1 && r <= 13 && c >= 1 && c <= 13) {
        safetyPositions.push([r, c]);
      }
    });
  }
  
  return safetyPositions;
}

// Check if position is in boundary area (where safety line doesn't apply)
function isInBoundaryArea(row, col) {
  // Edge positions where safety line doesn't apply
  // R1C1 to R1C13, R2C1 to R2C13, R12C1 to R12C13, R13C1 to R13C13
  const isEdgePosition = (row === 1 || row === 2 || row === 12 || row === 13);
  
  return isEdgePosition ||
         GREEN_ZONE.some(([r, c]) => r === row && c === col) ||
         BLUE_ZONE.some(([r, c]) => r === row && c === col) ||
         FORBIDDEN_ZONE.some(([r, c]) => r === row && c === col) ||
         (row === 2 && col === 7) || (row === 12 && col === 7) || // Observer zones
         (row === 1 && col === 7) || (row === 13 && col === 7);   // Target zones
}

// Check if a coin has crossed its boundary (outside home zone)
function hasCrossedBoundary(row, col, player) {
  const homeZone = player === 1 ? GREEN_ZONE : BLUE_ZONE;
  return !homeZone.some(([r, c]) => r === row && c === col) && 
         !isInBoundaryArea(row, col);
}

// Initial empty board for setup phase
function getEmptyCoins() {
  return {
    1: [],
    2: []
  };
}

// Generate coins to be placed during setup
function generateCoinsForSetup(player, coinCount = 8) {
  const startId = player === 1 ? 1 : (coinCount + 1);
  return Array.from({ length: coinCount }, (_, i) => ({
    id: startId + i,
    player,
    placed: false
  }));
}

// Helper function to determine coin type based on initial placement
function determineCoinType(coin, player) {
  // If coin already has a type, use it
  if (coin.type) return coin.type;
  
  // Otherwise, determine based on initial placement logic
  // Target coins are placed in opponent's target zone during setup
  // Home coins are placed in player's own home zone during setup
  const opponentTargetRow = TARGET_ZONE[player === 1 ? 2 : 1][0];
  const opponentTargetCol = TARGET_ZONE[player === 1 ? 2 : 1][1];
  const ownHomeZone = player === 1 ? GREEN_ZONE : BLUE_ZONE;
  
  // Check if coin is in opponent's target zone (target coin)
  if (coin.row === opponentTargetRow && coin.col === opponentTargetCol) {
    return 'target';
  }
  
  // Check if coin is in own home zone (home coin)
  if (ownHomeZone.some(([r, c]) => r === coin.row && c === coin.col)) {
    return 'home';
  }
  
  // Default fallback - this shouldn't happen in normal gameplay
  return 'home';
}

// Helper function to determine which side a coin was initially placed on
function determineCoinSide(coin, player) {
  const coinType = determineCoinType(coin, player);
  
  if (coinType === 'home') {
    // Home coins are on their owner's side
    return player;
  } else if (coinType === 'target') {
    // Target coins are on the opponent's side (placed in opponent's target zone)
    return player === 1 ? 2 : 1;
  }
  
  return player; // fallback
}

// Calculate valid moves for a coin based on the rules (updated for dynamic safety lines)
function getValidMoves(coinRow, coinCol, player, allCoins) {
  const moves = [];
  
  // Rule 14 REMOVED: Coins in target area CAN now be moved out
  // No restriction on target zone coins
  
  // Rule 5: ONLY diagonal movement allowed (no straight moves)
  // Rule 6: No front/back/side movements for any positions including corners
  
  // ONLY diagonal moves (1-2 steps) - no front/back/side moves
  // Corner positions: R1C1, R2C1, R1C13, R2C13, R12C1, R13C1, R12C13, R13C13 - DIAGONAL ONLY
  const cornerPositions = [[1,1],[2,1],[1,13],[2,13],[12,1],[13,1],[12,13],[13,13]];
  const isCorner = cornerPositions.some(([r, c]) => r === coinRow && c === coinCol);
  
  for (let steps = 1; steps <= 2; steps++) {
    // Only diagonal moves: down-left, down-right, up-left, up-right
    const diagonalMoves = [
      [coinRow + steps, coinCol - steps], // down-left
      [coinRow + steps, coinCol + steps], // down-right
      [coinRow - steps, coinCol - steps], // up-left
      [coinRow - steps, coinCol + steps]  // up-right
    ];
    
    diagonalMoves.forEach(([newRow, newCol]) => {
      if (newRow >= 1 && newRow <= 13 && newCol >= 1 && newCol <= 13) {
        if (isValidMoveDestination(newRow, newCol, player, allCoins)) {
          moves.push([newRow, newCol]);
        }
      }
    });
  }
  
  // Rule 7 & 13: Move to observer zone (diagonal moves only)
  // Corner positions cannot use this rule - diagonal moves only  
  if (!isCorner) {
    const observerPos = OBSERVER_ZONE[player];
    if (observerPos) {
      const [obsRow, obsCol] = observerPos;
      const rowDiff = Math.abs(coinRow - obsRow);
      const colDiff = Math.abs(coinCol - obsCol);
      
      // Can move to observer if it's a diagonal move only
      const isDiagonal = (rowDiff <= 2 && colDiff <= 2 && rowDiff === colDiff && rowDiff > 0);
      
      if (isDiagonal) {
        if (isValidMoveDestination(obsRow, obsCol, player, allCoins)) {
          moves.push([obsRow, obsCol]);
        }
      }
    }
  }
  
  // Rule 7 & 8: From observer zone, can move directly to target
  const playerObserver = OBSERVER_ZONE[player];
  if (playerObserver && coinRow === playerObserver[0] && coinCol === playerObserver[1]) {
    const targetPos = TARGET_ZONE[player];
    if (targetPos) {
      moves.push([targetPos[0], targetPos[1]]);
    }
  }

  // SPECIAL RULE: Directional hint positions can move to target zones
  // Corner positions cannot use this rule - they are not directional hint positions
  // R2C6 can move diagonally up-right to R1C7 (Player 1's target)
  if (!isCorner && coinRow === 2 && coinCol === 6) {
    const target1 = TARGET_ZONE[1]; // R1C7
    if (isValidMoveDestination(target1[0], target1[1], player, allCoins)) {
      moves.push([target1[0], target1[1]]);
    }
  }
  
  // R2C8 can move diagonally up-left to R1C7 (Player 1's target) 
  if (!isCorner && coinRow === 2 && coinCol === 8) {
    const target1 = TARGET_ZONE[1]; // R1C7
    if (isValidMoveDestination(target1[0], target1[1], player, allCoins)) {
      moves.push([target1[0], target1[1]]);
    }
  }
  
  // R12C6 can move diagonally down-right to R13C7 (Player 2's target)
  if (!isCorner && coinRow === 12 && coinCol === 6) {
    const target2 = TARGET_ZONE[2]; // R13C7
    if (isValidMoveDestination(target2[0], target2[1], player, allCoins)) {
      moves.push([target2[0], target2[1]]);
    }
  }
  
  // R12C8 can move diagonally down-left to R13C7 (Player 2's target)
  if (!isCorner && coinRow === 12 && coinCol === 8) {
    const target2 = TARGET_ZONE[2]; // R13C7
    if (isValidMoveDestination(target2[0], target2[1], player, allCoins)) {
      moves.push([target2[0], target2[1]]);
    }
  }

  // SPECIAL RULE: Straight directional hint positions
  // Corner positions cannot use this rule
  // R1C6 and R13C6 can move right to target zones
  if (!isCorner && ((coinRow === 1 && coinCol === 6) || (coinRow === 13 && coinCol === 6))) {
    const targetPos = coinRow === 1 ? TARGET_ZONE[1] : TARGET_ZONE[2];
    if (isValidMoveDestination(targetPos[0], targetPos[1], player, allCoins)) {
      moves.push([targetPos[0], targetPos[1]]);
    }
  }
  
  // R1C8 and R13C8 can move left to target zones
  if (!isCorner && ((coinRow === 1 && coinCol === 8) || (coinRow === 13 && coinCol === 8))) {
    const targetPos = coinRow === 1 ? TARGET_ZONE[1] : TARGET_ZONE[2];
    if (isValidMoveDestination(targetPos[0], targetPos[1], player, allCoins)) {
      moves.push([targetPos[0], targetPos[1]]);
    }
  }
  
  // NEW RULE: Observer zone backward movement - coins in observer zones can move 1 step backward
  const isInObserverZone = (coinRow === OBSERVER_ZONE[1][0] && coinCol === OBSERVER_ZONE[1][1]) || 
                           (coinRow === OBSERVER_ZONE[2][0] && coinCol === OBSERVER_ZONE[2][1]);
  
  if (isInObserverZone) {
    // Determine backward direction based on which observer zone
    let backwardRow;
    if (coinRow === OBSERVER_ZONE[1][0] && coinCol === OBSERVER_ZONE[1][1]) {
      // Player 1's observer zone (R2C7) - backward is away from Player 2 (upward)
      backwardRow = coinRow - 1;
    } else if (coinRow === OBSERVER_ZONE[2][0] && coinCol === OBSERVER_ZONE[2][1]) {
      // Player 2's observer zone (R12C7) - backward is away from Player 1 (downward)
      backwardRow = coinRow + 1;
    }
    
    // Add backward movement if valid
    if (backwardRow && backwardRow >= 1 && backwardRow <= 13) {
      if (isValidMoveDestination(backwardRow, coinCol, player, allCoins)) {
        moves.push([backwardRow, coinCol]);
      }
    }
  }
  
  // Rule 12: Direct move to target if opponent's coin is in the way (crossing rule)
  const targetPos = TARGET_ZONE[player];
  if (targetPos) {
    const [targetRow, targetCol] = targetPos;
    
    // Check if there's a direct path with opponent's coin to jump over
    if (hasOpponentCoinInPath(coinRow, coinCol, targetRow, targetCol, player, allCoins)) {
      moves.push([targetRow, targetCol]);
    }
  }
  
  // Rule: Direct target access from specific positions
  const directAccessPositions = DIRECT_TARGET_ACCESS[player];
  if (directAccessPositions) {
    directAccessPositions.forEach(([accessRow, accessCol]) => {
      if (coinRow === accessRow && coinCol === accessCol) {
        const targetPos = TARGET_ZONE[player];
        if (targetPos) {
          moves.push([targetPos[0], targetPos[1]]);
        }
      }
    });
  }
  
  // NEW RULE: Special power positions R3C7 and R11C7
  const isOnSpecialPowerPosition = SPECIAL_POWER_POSITIONS.some(([r, c]) => r === coinRow && c === coinCol);
  if (isOnSpecialPowerPosition) {
    // 1. Can move to observer zone in 1 step (any player's observer zone)
    const allObserverZones = [OBSERVER_ZONE[1], OBSERVER_ZONE[2]];
    allObserverZones.forEach(observerPos => {
      if (observerPos && isValidMoveDestination(observerPos[0], observerPos[1], player, allCoins)) {
        moves.push([observerPos[0], observerPos[1]]);
      }
    });
    
    // 2. Can move to target zone in 2 steps (any target zone)
    const allTargetZones = [TARGET_ZONE[1], TARGET_ZONE[2]];
    allTargetZones.forEach(targetPos => {
      if (targetPos && isValidMoveDestination(targetPos[0], targetPos[1], player, allCoins)) {
        moves.push([targetPos[0], targetPos[1]]);
      }
    });
  }
  
  // Allow movement to ANY target zone for elimination (within movement range)
  const allTargetZones = [TARGET_ZONE[1], TARGET_ZONE[2]];
  allTargetZones.forEach(targetPos => {
    if (targetPos) {
      const [targetRow, targetCol] = targetPos;
      const rowDiff = Math.abs(coinRow - targetRow);
      const colDiff = Math.abs(coinCol - targetCol);
      
      // Check if target is within diagonal movement range (1-2 steps) only
      const isDiagonalToTarget = (rowDiff <= 2 && colDiff <= 2 && rowDiff === colDiff && rowDiff > 0);
      
      if (isDiagonalToTarget) {
        if (isValidMoveDestination(targetRow, targetCol, player, allCoins)) {
          moves.push([targetRow, targetCol]);
        }
      }
    }
  });

  return moves.filter(([r, c]) => r >= 1 && r <= 13 && c >= 1 && c <= 13);
}

// Check if a move destination is valid (updated for dynamic safety lines)
function isValidMoveDestination(toRow, toCol, player, allCoins) {
  // Rule 11: Cannot place on own coin or jump over coins (except specific rules)
  const coinsAtDestination = getCoinsAt(toRow, toCol, allCoins);
  
  // Forbidden zone check
  if (FORBIDDEN_ZONE.some(([r, c]) => r === toRow && c === toCol)) {
    return false;
  }
  
  // Rule 8 & 9: Can stack on opponent's coin in observer and target zones
  const isObserverZone = (toRow === OBSERVER_ZONE[1][0] && toCol === OBSERVER_ZONE[1][1]) || 
                         (toRow === OBSERVER_ZONE[2][0] && toCol === OBSERVER_ZONE[2][1]);
  const isTargetZone = (toRow === TARGET_ZONE[1][0] && toCol === TARGET_ZONE[1][1]) || 
                       (toRow === TARGET_ZONE[2][0] && toCol === TARGET_ZONE[2][1]);
  
  if (isObserverZone || isTargetZone) {
    // For target zones: Check proper elimination rules based on coin type
    if (isTargetZone) {
      // Determine which target zone this is
      const isPlayer1Target = (toRow === TARGET_ZONE[1][0] && toCol === TARGET_ZONE[1][1]);
      const isPlayer2Target = (toRow === TARGET_ZONE[2][0] && toCol === TARGET_ZONE[2][1]);
      
      // For HOME coins: Can only be eliminated in opponent's target zone
      // SIDE-BASED RULE: Coins can only be eliminated in opposite side's target zone
      
      if (player === 1) {
        // Player 1's turn - allow movement to target zones for scoring
        if (isPlayer2Target || isPlayer1Target) {
          return true; // Allow coins to enter target zones for elimination/scoring
        }
      } else {
        // Player 2's turn - allow movement to target zones for scoring
        if (isPlayer1Target || isPlayer2Target) {
          return true; // Allow coins to enter target zones for elimination/scoring
        }
      }
    }
    
    // MODIFIED: For observer and target zones - same player can stack, opponents cannot
    const opponentCoinsHere = coinsAtDestination.filter(coin => coin.player !== player);
    if (opponentCoinsHere.length > 0) {
      return false; // Cannot stack on opponent's coins
    }
    return true; // Same player coins can stack or empty space allowed
  }
  
  // Check for invalid moves: TARGET coins cannot enter their own home zone
  const ownHomeZone = player === 1 ? GREEN_ZONE : BLUE_ZONE;
  const isOwnHomeZone = ownHomeZone.some(([r, c]) => r === toRow && c === toCol);
  
  if (isOwnHomeZone) {
    // Home zone: No stacking allowed at all
    if (coinsAtDestination.length > 0) {
      return false;
    }
  } else if (isTargetZone) {
    // Target zones: Only same player can stack, opponents cannot
    if (coinsAtDestination.length > 0) {
      const opponentCoinsHere = coinsAtDestination.filter(coin => coin.player !== player);
      if (opponentCoinsHere.length > 0) {
        return false; // Cannot stack on opponent's coins
      }
      // Same player coins can stack in target zones (allowed)
    }
  } else {
    // Regular board positions: NO STACKING ALLOWED (except target zones)
    if (coinsAtDestination.length > 0) {
      return false; // No stacking outside target zones
    }
  }

  // Safety lines are now passable - no blocking logic needed
  // When opponent lands on safety line, they get penalized in handleMove()

  return true;
}

// Check if there's an opponent's coin in the path for crossing rule
function hasOpponentCoinInPath(fromRow, fromCol, toRow, toCol, player, allCoins) {
  const opponentPlayer = player === 1 ? 2 : 1;
  const opponentCoins = allCoins[opponentPlayer] || [];
  
  // Simple check for direct line path
  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;
  
  // Check if path is straight line
  if (rowDiff !== 0 && colDiff !== 0) return false;
  
  const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
  const rowStep = rowDiff === 0 ? 0 : rowDiff / steps;
  const colStep = colDiff === 0 ? 0 : colDiff / steps;
  
  // Check each step in the path
  for (let i = 1; i < steps; i++) {
    const checkRow = fromRow + (rowStep * i);
    const checkCol = fromCol + (colStep * i);
    
    const opponentCoinHere = opponentCoins.some(coin => 
      coin.row === checkRow && coin.col === checkCol
    );
    
    if (opponentCoinHere) {
      return true;
    }
  }
  
  return false;
}

// Get all coins at a specific position
function getCoinsAt(row, col, allCoins) {
  const result = [];
  Object.entries(allCoins).forEach(([player, coins]) => {
    coins.forEach(coin => {
      if (coin.row === row && coin.col === col) {
        result.push({ ...coin, player: Number(player) });
      }
    });
  });
  return result;
}

export default function App({ onBack, user }) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Asude Competator GAme';
    }
  }, []);
  const [coins, setCoins] = useState(getEmptyCoins());
  const [gamePhase, setGamePhase] = useState('coin-config'); // 'coin-config', 'setup', or 'playing'
  const [turn, setTurn] = useState(1);
  const [selected, setSelected] = useState(null);
  const [coinVariant, setCoinVariant] = useState('human'); // Player 1's coin type choice
  const [playerNames, setPlayerNames] = useState({
    1: user?.username || 'Player 1',
    2: 'Player 2' // Will be set when second player joins
  });
  // Fixed: exactly 8 initial coins per player (no UI selector)
  const initialCoins = 8;
  const [validMoves, setValidMoves] = useState([]);
  const [message, setMessage] = useState("⚙️ GAME CONFIGURATION - Choose initial coin count and confirm player names");
  const [winner, setWinner] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [setupCoins, setSetupCoins] = useState({ 1: [], 2: [] }); // Will be initialized after configuration
  const [placementMode, setPlacementMode] = useState('target'); // 'target' or 'home'
  const [coinsToPlace, setCoinsToPlace] = useState({ target: 4, home: 4 });
  const [safetyLines, setSafetyLines] = useState({ 1: [], 2: [] }); // Dynamic safety lines
  const [scores, setScores] = useState({ 1: 0, 2: 0 }); // Player scores for eliminated coins
  const [eliminationConfirm, setEliminationConfirm] = useState(null); // Confirmation popup for elimination
  const [showRulesModal, setShowRulesModal] = useState(false); // Rules modal state
  const [safetyLineHit, setSafetyLineHit] = useState(null); // Safety line hit popup
  const [wrongTargetZone, setWrongTargetZone] = useState(null); // Wrong target zone popup
  const [totalCoinsPlaced, setTotalCoinsPlaced] = useState(0); // Track total coins placed sequentially
  const [blinkingTile, setBlinkingTile] = useState(null); // Tile position to blink red on safety line hit

  // Calculate dynamic safety lines for all players
  const calculateSafetyLines = useCallback((currentCoins) => {
    const newSafetyLines = { 1: [], 2: [] };
    
    // For each player, calculate safety lines for coins outside boundary
    [1, 2].forEach(player => {
      const playerCoins = currentCoins[player] || [];
      const safetyPositions = new Set();
      
      playerCoins.forEach(coin => {
        if (hasCrossedBoundary(coin.row, coin.col, player)) {
          const coinSafetyLine = getSafetyLine(coin.row, coin.col, player);
          coinSafetyLine.forEach(([r, c]) => {
            // Only add to safety line if it's not in a boundary area
            if (!isInBoundaryArea(r, c)) {
              safetyPositions.add(`${r}-${c}`);
            }
          });
        }
      });
      
      // Convert set back to array of [row, col] pairs
      newSafetyLines[player] = Array.from(safetyPositions).map(pos => {
        const [r, c] = pos.split('-').map(Number);
        return [r, c];
      });
    });
    
    return newSafetyLines;
  }, []);

  // Update safety lines whenever coins change
  useEffect(() => {
    const newSafetyLines = calculateSafetyLines(coins);
    setSafetyLines(newSafetyLines);
  }, [coins, calculateSafetyLines]);

  // Helper: check if position is valid for placement during setup
  const isValidPlacement = (row, col, player, mode) => {
    if (isZone(row, col, FORBIDDEN_ZONE)) return false;
    
    if (mode === 'target') {
      // Must place in opponent's target zone ONLY - stacking is allowed here
      const opponentTarget = TARGET_ZONE[player === 1 ? 2 : 1];
      return row === opponentTarget[0] && col === opponentTarget[1];
    } else if (mode === 'home') {
      // Must place in own home zone ONLY
      const homeZone = player === 1 ? GREEN_ZONE : BLUE_ZONE;
      if (!isZone(row, col, homeZone)) return false;
      
      // Check if position is already occupied in home zone (no stacking in home)
      const coinsAtPos = getCoinsAt(row, col, coins);
      return coinsAtPos.length === 0;
    }
    
    return false;
  };

  // Handle coin placement during setup
  const handlePlacement = (row, col) => {
    if (gamePhase !== 'setup') return;
    
    // Determine current player based on total coins placed sequentially
    const currentPlayer = totalCoinsPlaced < initialCoins ? 1 : 2;
    
    console.log(`Attempting to place coin at R${row}C${col}, totalCoinsPlaced: ${totalCoinsPlaced}, currentPlayer: ${currentPlayer}`);
    
    if (!isValidPlacement(row, col, currentPlayer, placementMode)) {
      if (placementMode === 'target') {
        setMessage(`Invalid! Place coin in Player ${currentPlayer === 1 ? 2 : 1}'s target zone (red square) - stacking allowed`);
      } else {
        setMessage(`Invalid! Place coin in your ${currentPlayer === 1 ? 'green' : 'blue'} home zone only - no stacking allowed`);
      }
      return;
    }

    // Get next coin to place for current player
    const unplacedCoins = setupCoins[currentPlayer].filter(coin => !coin.placed);
    console.log(`Unplaced coins for player ${currentPlayer}:`, unplacedCoins.length);
    
    if (unplacedCoins.length === 0) return;

    const coinToPlace = unplacedCoins[0];
    console.log(`Placing coin:`, coinToPlace);
    
    // Add coin to board
    const newCoins = { ...coins };
    if (!newCoins[currentPlayer]) newCoins[currentPlayer] = [];
    
    // For target zones, always allow stacking; for home zones, no stacking
    const isTargetPlacement = placementMode === 'target';
    
    newCoins[currentPlayer].push({
      id: coinToPlace.id,
      row,
      col,
      stacked: isTargetPlacement,
      type: placementMode, // 'target' or 'home' - tracks original placement type
      player: currentPlayer
    });

    console.log(`New coins state:`, newCoins);

    // Update setup coins
    const newSetupCoins = { ...setupCoins };
    newSetupCoins[currentPlayer] = setupCoins[currentPlayer].map(coin =>
      coin.id === coinToPlace.id ? { ...coin, placed: true } : coin
    );

    setCoins(newCoins);
    setSetupCoins(newSetupCoins);
    
    // Update total coins placed
    const newTotalCoinsPlaced = totalCoinsPlaced + 1;
    setTotalCoinsPlaced(newTotalCoinsPlaced);

    // Update coins to place counter
    const newCoinsToPlace = { ...coinsToPlace };
    newCoinsToPlace[placementMode]--;
    setCoinsToPlace(newCoinsToPlace);

    // Check if we need to switch placement mode or player
    if (newCoinsToPlace[placementMode] === 0) {
      if (placementMode === 'target') {
        setPlacementMode('home');
        setMessage(`✅ ${currentPlayer === 1 ? 'Player 1' : 'Player 2'}: Target coins placed! Now place your 4 coins in your OWN ${currentPlayer === 1 ? 'GREEN' : 'BLUE'} home zone`);
      } else {
        // Check if we need to switch to next player or finish setup
        if (newTotalCoinsPlaced >= (initialCoins * 2)) {
          // All coins placed, start game
          setGamePhase('playing');
          setTurn(1);
          setMessage("🎮 GAME STARTS! Player 1's turn. Click a coin to select it, then click where to move it.");
        } else if (newTotalCoinsPlaced === initialCoins) {
          // Switch to Player 2
          setPlacementMode('target');
          setCoinsToPlace({ target: 4, home: 4 });
          setMessage(`🎯 Player 2: Place 4 coins in Player 1's target zone (TOP red square), then 4 in your BLUE home zone`);
        } else {
          // Continue with same player if they have more coins to place
          setPlacementMode('target');
          setCoinsToPlace({ target: 4, home: 4 });
        }
      }
    } else {
      const remaining = newCoinsToPlace[placementMode];
      if (placementMode === 'target') {
        const targetZoneDesc = currentPlayer === 1 ? "Player 2's target zone (BOTTOM red square)" : "Player 1's target zone (TOP red square)";
        setMessage(`${currentPlayer === 1 ? 'Player 1' : 'Player 2'}: Place ${remaining} more coins in ${targetZoneDesc} (stacking allowed)`);
      } else {
        const homeZoneDesc = currentPlayer === 1 ? 'GREEN home zone' : 'BLUE home zone';
        setMessage(`${currentPlayer === 1 ? 'Player 1' : 'Player 2'}: Place ${remaining} more coins in your ${homeZoneDesc}`);
      }
    }
  };

  // Helper: check if position is in zone
  const isZone = (row, col, zone) => zone.some(([r, c]) => r === row && c === col);

  // Get valid moves for selected coin using the comprehensive rules with dynamic safety lines
  const getValidMovesForCoin = (coin, player) => {
    const allMoves = getValidMoves(coin.row, coin.col, player, coins);
    const coinType = determineCoinType(coin, player);
    
    // Filter out invalid moves based on coin type
    return allMoves.filter(([toRow, toCol]) => {
      // Check if TARGET coin is trying to enter its own home zone (not allowed)
      if (coinType === 'target') {
        const ownHomeZone = player === 1 ? GREEN_ZONE : BLUE_ZONE;
        const isOwnHomeZone = ownHomeZone.some(([r, c]) => r === toRow && c === toCol);
        if (isOwnHomeZone) {
          return false; // TARGET coins cannot enter their own home zone
        }
      }
      
      // Check target zone elimination rules
      const isPlayer1Target = (toRow === TARGET_ZONE[1][0] && toCol === TARGET_ZONE[1][1]);
      const isPlayer2Target = (toRow === TARGET_ZONE[2][0] && toCol === TARGET_ZONE[2][1]);
      
      if (isPlayer1Target || isPlayer2Target) {
        // NEW RULE: Coins with observer zone power can enter ANY target zone
        if (coin.hasVisitedObserver) {
          return true; // Observer zone power allows access to any target zone
        }
        
        // SIDE-BASED RULES: Coins can only enter opposite side's target zone
        const coinSide = determineCoinSide(coin, player);
        
        // Coins from Player 1's side can only enter Player 2's target zone
        // Coins from Player 2's side can only enter Player 1's target zone
        if (coinSide === 1 && isPlayer1Target) {
          return false; // Coins from Player 1's side cannot enter Player 1's target zone
        } else if (coinSide === 2 && isPlayer2Target) {
          return false; // Coins from Player 2's side cannot enter Player 2's target zone
        }
      }
      
      return true; // Move is valid
    });
  };

  // Handle coin selection (only during playing phase)
  function handleSelect(player, coinId) {
    if (gamePhase !== 'playing' || player !== turn || winner) return;
    
    const coin = coins[player].find(c => c.id === coinId);
    if (!coin) return;

    // Rule 14 REMOVED: Coins in target zone CAN now be moved
    // No restriction on target zone coins anymore

    setSelected({ player, id: coinId });
    const moves = getValidMovesForCoin(coin, player);
    setValidMoves(moves);
    const powerStatus = coin.hasVisitedObserver ? " 🟡⚡ (Observer Power!)" : "";
    const specialPositionStatus = SPECIAL_POWER_POSITIONS.some(([r, c]) => r === coin.row && c === coin.col) ? " ⚡ (Special Position!)" : "";
    const observerZoneStatus = ((coin.row === OBSERVER_ZONE[1][0] && coin.col === OBSERVER_ZONE[1][1]) || 
                               (coin.row === OBSERVER_ZONE[2][0] && coin.col === OBSERVER_ZONE[2][1])) ? " 🟡⬅️ (In Observer + Backward Move!)" : "";
    setMessage(`Selected coin ${coinId}${powerStatus}${specialPositionStatus}${observerZoneStatus}. ${moves.length} valid moves available.`);
  }

  // Handle move or placement
  function handleMove(row, col) {
    if (gamePhase === 'setup') {
      handlePlacement(row, col);
      return;
    }

    if (!selected || winner) return;
    
    const { player, id } = selected;
    const coin = coins[player].find(c => c.id === id);
    
    // Check if move is valid
    const isValidMove = validMoves.some(([r, c]) => r === row && c === col);
    if (!isValidMove) {
      setMessage("Invalid move! Click on a highlighted valid position.");
      return;
    }

    // Execute move
    const newCoins = { ...coins };
    const coinIndex = newCoins[player].findIndex(c => c.id === id);
    
    // Store the original position before moving
    const originalRow = coin.row;
    const originalCol = coin.col;
    
    // Check if moving to a target zone - AUTO ELIMINATION
    const isMovingToTarget = (row === TARGET_ZONE[1][0] && col === TARGET_ZONE[1][1]) ||
                            (row === TARGET_ZONE[2][0] && col === TARGET_ZONE[2][1]);
    
    if (isMovingToTarget) {
      // Determine target zone and coin type
      const isPlayer1Target = (row === TARGET_ZONE[1][0] && col === TARGET_ZONE[1][1]);
      const isPlayer2Target = (row === TARGET_ZONE[2][0] && col === TARGET_ZONE[2][1]);
      const coinType = determineCoinType(coin, player);
      
      // Check if this is a valid elimination based on coin type, target zone, and observer zone visit
      let isValidElimination = false;
      
      // NEW RULE: Any coin that has visited the observer zone can be eliminated in ANY target zone
      if (coin.hasVisitedObserver) {
        isValidElimination = true; // Coins with observer zone power can be eliminated anywhere
      } else {
        // SIDE-BASED RULES: Coins can only score in the opposite side's target zone
        const coinSide = determineCoinSide(coin, player);
        
        // Coins from Player 1's side can only score in Player 2's target zone
        // Coins from Player 2's side can only score in Player 1's target zone
        if (coinSide === 1 && isPlayer2Target) {
          // Coin from Player 1's side entering Player 2's target zone - VALID
          isValidElimination = true;
        } else if (coinSide === 2 && isPlayer1Target) {
          // Coin from Player 2's side entering Player 1's target zone - VALID
          isValidElimination = true;
        }
        // Coins cannot score in their own side's target zone
      }
      
      if (isValidElimination) {
        // Automatically eliminate the coin and add point
        const newScores = { ...scores };
        newScores[player] += 1;
        
        // Remove the coin from the board completely
        newCoins[player].splice(coinIndex, 1);
        
        setCoins(newCoins);
        setScores(newScores);
        setSelected(null);
        setValidMoves([]);
        const eliminationReason = coin.hasVisitedObserver ? 
          `🟡 Observer zone power used! ${coinType} coin eliminated!` : 
          `${coinType} coin eliminated!`;
        setMessage(`⭐ ${playerNames[player]}'s ${eliminationReason} Score: ${newScores[player]}/${initialCoins}`);
        
        // Check for win condition after elimination
        const totalCoinsLeft1 = newCoins[1] ? newCoins[1].length : 0;
        const totalCoinsLeft2 = newCoins[2] ? newCoins[2].length : 0;
        
        if (totalCoinsLeft1 === 0) {
          setWinner(1);
          setShowCelebration(true);
          setMessage(`🏆 Player 1 WINS! All coins eliminated! Final Score: ${newScores[1]}-${newScores[2]}`);
        } else if (totalCoinsLeft2 === 0) {
          setWinner(2);
          setShowCelebration(true);
          setMessage(`🏆 Player 2 WINS! All coins eliminated! Final Score: ${newScores[1]}-${newScores[2]}`);
        } else {
          // Switch turns
          setTurn(turn === 1 ? 2 : 1);
        }
        
        return; // Exit early since coin was eliminated
      } else {
        // Invalid elimination - show popup and prevent move to invalid target zone
        const coinSide = determineCoinSide(coin, player);
        const zoneName = isPlayer1Target ? "Player 1's target zone" : "Player 2's target zone";
        
        // Show wrong target zone popup and don't move the coin
        setWrongTargetZone({
          player: player,
          zoneName: zoneName,
          coinSide: coinSide,
          reason: coin.hasVisitedObserver ? 
            "This coin has observer zone power but still needs proper positioning." :
            `Coins from Player ${coinSide}'s side can only score in ${coinSide === 1 ? "Player 2's" : "Player 1's"} target zone.`
        });
        
        // Don't move the coin, don't change turn - popup will handle turn switch
        setSelected(null);
        setValidMoves([]);
        return; // Don't continue with the move
      }
    }
    
    // Check if landing on opponent's safety line
    const opponentPlayer = player === 1 ? 2 : 1;
    const opponentCoins = newCoins[opponentPlayer] || [];
    let landedOnSafetyLine = false;
    let safetyLineOwner = null;
    
    for (const opponentCoin of opponentCoins) {
      if (hasCrossedBoundary(opponentCoin.row, opponentCoin.col, opponentPlayer)) {
        const safetyLine = getSafetyLine(opponentCoin.row, opponentCoin.col, opponentPlayer);
        
        // Check if destination is on opponent's safety line and not in boundary area
        if (!isInBoundaryArea(row, col) && 
            safetyLine.some(([r, c]) => r === row && c === col)) {
          landedOnSafetyLine = true;
          safetyLineOwner = opponentPlayer;
          break;
        }
      }
    }
    
    if (landedOnSafetyLine) {
      // Start red blinking animation on the hit tile
      setBlinkingTile({ row, col });
      
      // Delay popup by 5 seconds to allow blink animation
      setTimeout(() => {
        setBlinkingTile(null); // Stop blinking
        setSafetyLineHit({
          hitPlayer: player,
          ownerPlayer: safetyLineOwner,
          originalPosition: { row: originalRow, col: originalCol },
          currentPosition: { row, col },
          coinIndex,
          newScores: { ...scores, [safetyLineOwner]: scores[safetyLineOwner] + 1 },
          newCoins
        });
      }, 5000);
      return;
    }
    
    // Regular move (not to target zone) - update coin position
    const enteredObserverZone = (row === OBSERVER_ZONE[player][0] && col === OBSERVER_ZONE[player][1]);
    const enteredSpecialPowerPosition = SPECIAL_POWER_POSITIONS.some(([r, c]) => r === row && c === col);
    
    newCoins[player][coinIndex] = {
      ...coin,
      row,
      col,
      stacked: false,
      hasVisitedObserver: coin.hasVisitedObserver || enteredObserverZone // Track observer zone visits
    };

    // Check if coin entered observer zone (notification only)
    if (enteredObserverZone) {
      setMessage(`🟡 Player ${player}'s coin entered the Observer Zone R${row}C${col}! Gained elimination power + 1-step backward movement ability!`);
    } else if (enteredSpecialPowerPosition) {
      setMessage(`⚡ Player ${player}'s coin reached Special Power Position R${row}C${col}! Can move to observer zone in 1 step or target zone in 2 steps!`);
    }

    setCoins(newCoins);
    setSelected(null);
    setValidMoves([]);

    // Switch turns
    const nextPlayer = player === 1 ? 2 : 1;
    setTurn(nextPlayer);
    if (!enteredObserverZone) {
      setMessage(`Player ${nextPlayer}'s turn. Click a coin to select it.`);
    }
  }

  // Handle elimination confirmation - YES
  function handleEliminationYes() {
    if (!eliminationConfirm) return;
    
    const { player, newCoins, coinIndex } = eliminationConfirm;
    
    // REMOVE the coin completely from the board (don't place it anywhere)
    newCoins[player].splice(coinIndex, 1); // Remove coin from array
    
    // Award 1 point to the player
    setScores(prevScores => ({
      ...prevScores,
      [player]: prevScores[player] + 1
    }));
    
    setCoins(newCoins);
    setSelected(null);
    setValidMoves([]);
    setEliminationConfirm(null);
    
    // Switch turns
    const nextPlayer = player === 1 ? 2 : 1;
    setTurn(nextPlayer);
    setMessage(`Player ${player}'s coin REMOVED from board! +1 point. Player ${nextPlayer}'s turn.`);
  }

  // Handle elimination confirmation - NO
  function handleEliminationNo() {
    if (!eliminationConfirm) return;
    
    // Just move the coin to target zone without elimination
    const { player, targetRow, targetCol, originalCoin, newCoins, coinIndex } = eliminationConfirm;
    
    newCoins[player][coinIndex] = {
      ...originalCoin,
      row: targetRow,
      col: targetCol,
      stacked: true
      // eliminated: false (don't eliminate)
    };
    
    setCoins(newCoins);
    setSelected(null);
    setValidMoves([]);
    setEliminationConfirm(null);
    
    // Switch turns
    const nextPlayer = player === 1 ? 2 : 1;
    setTurn(nextPlayer);
    setMessage(`Player ${player}'s coin moved to target zone (not eliminated). Player ${nextPlayer}'s turn.`);
  }

  // Safety Line Hit Handlers
  const handleWrongTargetZoneClose = () => {
    setWrongTargetZone(null);
    // Turn continues with current player
  };

  function handleSafetyLineConfirm() {
    if (!safetyLineHit) return;
    
    const { hitPlayer, ownerPlayer, originalPosition, coinIndex, newScores, newCoins } = safetyLineHit;
    
    // Return coin to its original position
    newCoins[hitPlayer][coinIndex] = {
      ...newCoins[hitPlayer][coinIndex],
      row: originalPosition.row,
      col: originalPosition.col,
      stacked: false
    };
    
    setCoins(newCoins);
    setScores(newScores);
    setSelected(null);
    setValidMoves([]);
    setSafetyLineHit(null);
    setBlinkingTile(null); // Ensure blinking is stopped
    
    setMessage(`⚡ Player ${hitPlayer}'s coin returned! +1 point to Player ${ownerPlayer}! Score: Player 1: ${newScores[1]}, Player 2: ${newScores[2]}`);
    
    // Switch turns
    setTurn(hitPlayer === 1 ? 2 : 1);
  }

  // Check simple elimination win condition: First to 8 points wins
  useEffect(() => {
    if (gamePhase === 'playing' && !winner) {
      for (let player = 1; player <= 2; player++) {
        if (scores[player] >= initialCoins) {
          setWinner(player);
          setShowCelebration(true);
          setMessage(`${playerNames[player]} wins! Successfully eliminated all ${initialCoins} coins! Final score: ${scores[player]}/${initialCoins}`);
          break;
        }
      }
    }
  }, [scores, gamePhase, winner]);

  // Function to start game after configuration
  const startGameWithConfig = () => {
    const newSetupCoins = {
      1: generateCoinsForSetup(1, initialCoins),
      2: generateCoinsForSetup(2, initialCoins)
    };
    setSetupCoins(newSetupCoins);
    setCoinsToPlace({ target: Math.floor(initialCoins/2), home: Math.floor(initialCoins/2) });
    setGamePhase('setup');
    setMessage(`🎯 SETUP PHASE - Place coins sequentially: First ${initialCoins} coins will be ${playerNames[1]}'s coins, then next ${initialCoins} coins will be ${playerNames[2]}'s coins. Goal: Eliminate all ${initialCoins} coins to win!`);
  };

  // Function to close celebration and reset game
  const closeCelebration = () => {
    setShowCelebration(false);
    window.location.reload();
  };

  return (
    <div className="app">
      <h1>ASUDE COMPETITOR'S GAME</h1>
      
      {gamePhase === 'coin-config' && (
        <div className="game-configuration">
          <div className="config-panel">
            <div className="config-section">
              <h3>🪙 Player 1 - Select Coin Type</h3>
              <div className="coin-selector">
                <button 
                  className={`coin-option ${coinVariant === 'human' ? 'selected' : ''}`}
                  onClick={() => setCoinVariant('human')}
                >
                  🦶🏻 Human Paw
                </button>
                <button 
                  className={`coin-option ${coinVariant === 'animal' ? 'selected' : ''}`}
                  onClick={() => setCoinVariant('animal')}
                >
                  🐾 Animal Paw
                </button>
              </div>
            </div>

            <div className="config-section">
              <h3>🪙 Player 2 - Select Coin Type</h3>
              <div className="coin-selector">
                <button 
                  className={`coin-option ${coinVariant === 'animal' ? 'selected' : ''}`}
                  onClick={() => setCoinVariant('human')}
                >
                  🦶� Human Paw
                </button>
                <button 
                  className={`coin-option ${coinVariant === 'human' ? 'selected' : ''}`}
                  onClick={() => setCoinVariant('animal')}
                >
                  🐾 Animal Paw
                </button>
              </div>
            </div>

            <div className="config-section">
              <h3>👥 Player Names</h3>
              <div className="player-names">
                <div className="player-name-input">
                  <label>Player 1:</label>
                  <input
                    type="text"
                    value={playerNames[1]}
                    onChange={(e) => setPlayerNames(prev => ({ ...prev, 1: e.target.value }))}
                    placeholder="Enter Player 1 name"
                  />
                </div>
                <div className="player-name-input">
                  <label>Player 2:</label>
                  <input
                    type="text"
                    value={playerNames[2]}
                    onChange={(e) => setPlayerNames(prev => ({ ...prev, 2: e.target.value }))}
                    placeholder="Enter Player 2 name (or 'AI' for computer)"
                  />
                </div>
              </div>
            </div>

            <div className="config-section">
              <h3>🪙 Initial Coins per Player</h3>
              <p className="config-info">
                Each player will place {Math.floor(initialCoins/2)} coins in opponent's target zone and {Math.floor(initialCoins/2)} in home zone. (Fixed at 8 coins per player)
              </p>
            </div>

            <button className="start-game-btn" onClick={startGameWithConfig}>
              🚀 Start Game
            </button>
            
            {/* Live preview of scoreboard - 5-line format */}
            <div style={{
              marginTop: '32px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'flex-start',
              gap: '24px',
              flexWrap: 'wrap'
            }}>
              <div className="preview-scoreboard-container">
                <h4 style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>Scoreboard Preview</h4>
                <div style={{
                  display: 'flex',
                  gap: '24px',
                  justifyContent: 'center'
                }}>
                  {/* Player 1 Preview */}
                  <div style={{
                    background: 'rgba(124, 110, 242, 0.1)',
                    border: '2px solid rgba(124, 110, 242, 0.3)',
                    borderRadius: '16px',
                    padding: '1.5rem 1.25rem',
                    minWidth: '180px',
                    textAlign: 'center'
                  }}>
                    {(() => {
                      const player1Variant = coinVariant || 'human';
                      const p1Emoji = player1Variant === 'animal' ? '🐾' : '🦶🏻';
                      const p1Label = player1Variant === 'animal' ? 'Animal Paw' : 'Human Paw';
                      return (
                        <>
                          <div className="score-emoji" style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>
                            {p1Emoji}
                          </div>
                          <div className="coin-type-label" style={{
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            color: 'rgba(255, 255, 255, 0.6)',
                            marginBottom: '0.5rem',
                            letterSpacing: '0.5px'
                          }}>
                            {p1Label}
                          </div>
                          <div className="player-name-label" style={{
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            color: '#fff',
                            marginBottom: '0.75rem'
                          }}>
                            {playerNames[1]}
                          </div>
                          <div style={{
                            fontSize: '1.8rem',
                            fontWeight: 'bold',
                            color: '#10b981',
                            marginBottom: '0.5rem'
                          }}>
                            0
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            textTransform: 'uppercase'
                          }}>
                            Target: 8
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Player 2 Preview */}
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '2px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '16px',
                    padding: '1.5rem 1.25rem',
                    minWidth: '180px',
                    textAlign: 'center'
                  }}>
                    {(() => {
                      const player1Variant = coinVariant || 'human';
                      const player2Variant = player1Variant === 'human' ? 'animal' : 'human';
                      const p2Emoji = player2Variant === 'animal' ? '🐾' : '🦶🏽';
                      const p2Label = player2Variant === 'animal' ? 'Animal Paw' : 'Human Paw';
                      return (
                        <>
                          <div className="score-emoji" style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>
                            {p2Emoji}
                          </div>
                          <div className="coin-type-label" style={{
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            color: 'rgba(255, 255, 255, 0.6)',
                            marginBottom: '0.5rem',
                            letterSpacing: '0.5px'
                          }}>
                            {p2Label}
                          </div>
                          <div className="player-name-label" style={{
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            color: '#fff',
                            marginBottom: '0.75rem'
                          }}>
                            {playerNames[2]}
                          </div>
                          <div style={{
                            fontSize: '1.8rem',
                            fontWeight: 'bold',
                            color: '#7c6ef2',
                            marginBottom: '0.5rem'
                          }}>
                            0
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            textTransform: 'uppercase'
                          }}>
                            Target: 8
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {gamePhase !== 'coin-config' && (
        <>
          <div className="game-status">
            <div className="game-controls">
              <button className="reset-btn" onClick={() => window.location.reload()}>
                🔄 Reset Game
              </button>
              <button className="rules-btn" onClick={() => setShowRulesModal(true)}>
                📖 Rules
              </button>
            </div>
            
            <div className="game-info">
              <div className="turn-info">
                {gamePhase === 'setup' ? 'Setup Phase' : `${playerNames[turn]}'s Turn`}
              </div>
              <div className="game-phase">
                {gamePhase === 'setup' ? 'Place your coins' : `First to ${initialCoins} points wins!`}
              </div>
            </div>
            
            <div className="game-status-spacer"></div>
          </div>

          <div className="message">{message}</div>

          {winner && (
            <div className="message" style={{
              background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              🎉 Player {winner} Wins! 🎉
            </div>
          )}

          {gamePhase === 'setup' && (
            <div className="setup-guide" style={{
              background: 'rgba(4, 4, 5, 0.95)',
              padding: '15px',
              borderRadius: '10px',
              margin: '10px 0',
              border: '2px solid #000000ff'
            }}>
              <h3 style={{margin: '0 0 10px 0', color: '#2E7D32'}}>📋 Setup Requirements:</h3>
              <div style={{display: 'flex', justifyContent: 'space-around', textAlign: 'center'}}>
                <div>
                  <strong>👤 {playerNames[1]} ({initialCoins} coins):</strong><br/>
                  {Math.floor(initialCoins/2)} coins → {(() => {
                    const player1Variant = coinVariant || 'human';
                    const player2Variant = player1Variant === 'human' ? 'animal' : 'human';
                    return player2Variant === 'human' ? '�' : '🌳';
                  })()} {playerNames[2]}&apos;s target (bottom)<br/>
                  {Math.floor(initialCoins/2)} coins → 🟢 Own home zone (green area)
                </div>
                <div>
                  <strong>🐾 {playerNames[2]} ({initialCoins} coins):</strong><br/>
                  {Math.floor(initialCoins/2)} coins → {(() => {
                    const player1Variant = coinVariant || 'human';
                    return player1Variant === 'human' ? '�' : '🌳';
                  })()} {playerNames[1]}&apos;s target (top)<br/>
                  {Math.floor(initialCoins/2)} coins → 🔵 Own home zone (blue area)
                </div>
              </div>
              <p style={{margin: '10px 0 0 0', textAlign: 'center', fontStyle: 'italic'}}>
                Current: {playerNames[turn]} placing {placementMode === 'target' ? 'opponent target' : 'own home'} coins ({coinsToPlace[placementMode]} remaining)
              </p>
            </div>
          )}

          {/* Board with side scores */}
          <div className="board-with-scores">
            {/* Player 1 Score - Left Side */}
            <div className={`side-score left-score ${turn === 1 ? 'active' : ''}`}>
              {/* player1Variant is the variant chosen by player 1; player2 is always opposite */}
              {(() => {
                const player1Variant = coinVariant || 'human';
                const player2Variant = player1Variant === 'human' ? 'animal' : 'human';
                const p1Emoji = player1Variant === 'animal' ? '🐾' : '🦶🏻';
                const p1Label = player1Variant === 'animal' ? 'Animal Paw' : 'Human Paw';
                return (
                  <>
                    <div className="score-emoji">{p1Emoji}</div>
                    <div className="coin-type-label">{p1Label}</div>
                    <div className="player-name-label">{playerNames[1]}</div>
                    <div className="side-score-value">{scores[1]}</div>
                    <div className="side-score-target">Target: {initialCoins}</div>
                  </>
                );
              })()}
            </div>

            {/* Game Board */}
            <div className="board-container">
              <Board
                coins={coins}
                selected={selected}
                validMoves={validMoves}
                onSelect={handleSelect}
                onMove={handleMove}
                greenZone={GREEN_ZONE}
                blueZone={BLUE_ZONE}
                forbiddenZone={FORBIDDEN_ZONE}
                observerZone={OBSERVER_ZONE}
                targetZone={TARGET_ZONE}
                gamePhase={gamePhase}
                placementMode={placementMode}
                currentPlayer={gamePhase === 'setup' ? (totalCoinsPlaced < initialCoins ? 1 : 2) : turn}
                safetyLines={safetyLines}
                blinkingTile={blinkingTile}
                // Pass both player variants so Board can render per-player coin types
                playerVariants={{ 1: (coinVariant || 'human'), 2: ((coinVariant || 'human') === 'human' ? 'animal' : 'human') }}
              />
            </div>

            {/* Player 2 Score - Right Side */}
            <div className={`side-score right-score ${turn === 2 ? 'active' : ''}`}>
              {(() => {
                const player1Variant = coinVariant || 'human';
                const player2Variant = player1Variant === 'human' ? 'animal' : 'human';
                const p2Emoji = player2Variant === 'animal' ? '🐾' : '🦶🏽';
                const p2Label = player2Variant === 'animal' ? 'Animal Paw' : 'Human Paw';
                return (
                  <>
                    <div className="score-emoji">{p2Emoji}</div>
                    <div className="coin-type-label">{p2Label}</div>
                    <div className="player-name-label">{playerNames[2]}</div>
                    <div className="side-score-value">{scores[2]}</div>
                    <div className="side-score-target">Target: {initialCoins}</div>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Elimination Confirmation Popup */}
      {eliminationConfirm && (
        <div className="popup-overlay">
          <div className="popup-modal">
            <h3>🎯 Elimination Confirmation</h3>
            <p>
              <strong>{message}</strong>
            </p>
            <p>
              Do you want to <strong>eliminate</strong> this coin from the board and gain <strong>+1 point</strong>?
            </p>
            <div className="popup-buttons">
              <button 
                className="popup-btn popup-btn-yes"
                onClick={handleEliminationYes}
              >
                ✅ Yes - Eliminate (+1 point)
              </button>
              <button 
                className="popup-btn popup-btn-no"
                onClick={handleEliminationNo}
              >
                ❌ No - Keep coin in target zone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Line Hit Popup */}
      {safetyLineHit && (
        <div className="popup-overlay">
          <div className="popup-modal safety-hit-popup">
            <div className="popup-header">
              <h3>⚡ Safety Line Hit!</h3>
              <div className="safety-animation">💥</div>
            </div>
            <div className="popup-content">
              <p className="hit-message">
                <strong>Player {safetyLineHit.hitPlayer}&apos;s coin</strong> landed on <strong>Player {safetyLineHit.ownerPlayer}&apos;s safety zone</strong>!
              </p>
              <div className="safety-details">
                <div className="detail-item">
                  <span className="detail-icon">🎯</span>
                  <span>+1 Point awarded to Player {safetyLineHit.ownerPlayer}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">↩️</span>
                  <span>Coin will be returned to original position</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">📊</span>
                  <span>New Score: Player 1: {safetyLineHit.newScores[1]} | Player 2: {safetyLineHit.newScores[2]}</span>
                </div>
              </div>
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-btn popup-btn-confirm"
                onClick={handleSafetyLineConfirm}
              >
                ✅ Confirm Safety Line Hit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wrong Target Zone Popup */}
      {wrongTargetZone && (
        <div className="popup-overlay">
          <div className="popup-modal wrong-zone-popup">
            <div className="popup-header">
              <h3>🚫 Cannot Score Here!</h3>
              <div className="wrong-zone-animation">❌</div>
            </div>
            <div className="popup-content">
              <p className="error-message">
                <strong>Player {wrongTargetZone.player}&apos;s coin</strong> cannot get points in <strong>{wrongTargetZone.zoneName}</strong>!
              </p>
              <div className="wrong-zone-details">
                <div className="detail-item">
                  <span className="detail-icon">⚠️</span>
                  <span>{wrongTargetZone.reason}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">🎯</span>
                  <span>Coins from Player {wrongTargetZone.coinSide}&apos;s side can only score in {wrongTargetZone.coinSide === 1 ? "Player 2's" : "Player 1's"} target zone</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">📍</span>
                  <span>Move blocked - coin stays in current position</span>
                </div>
              </div>
            </div>
            <div className="popup-buttons">
              <button 
                className="popup-btn popup-btn-confirm"
                onClick={handleWrongTargetZoneClose}
              >
                ✅ Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebration && winner && (
        <Celebration
          winner={playerNames[winner]}
          onClose={closeCelebration}
          scores={{ player1: scores[1], player2: scores[2] }}
          playerNames={playerNames}
        />
      )}

      {/* Back to App Selector Button */}
      {onBack && (
        <button 
          className="back-to-selector-btn"
          onClick={onBack}
          title="Back to App Selector"
        >
          ← Back to Selector
        </button>
      )}
      
      {/* Rules Modal */}
      <RulesModal 
        isOpen={showRulesModal} 
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  );
}

App.propTypes = {
  onBack: PropTypes.func,
  user: PropTypes.shape({
    username: PropTypes.string,
    role: PropTypes.string
  })
};
