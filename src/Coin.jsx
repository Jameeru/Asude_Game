import PropTypes from 'prop-types';
import player1Img from './assets/icons/player1.png';
import player2Img from'./assets/icons/player2.png';

function Coin({
  player,
  selected,
  stacked,
  stackPosition = 0,
  eliminated = false,
  isTargetStack = false,
  coinId,
  variant = 'human'
}) {
  // Choose icons based on variant (can expand later)
  const icons = {
    human: { player1: player1Img, player2: player2Img },
    animal: { player1: player1Img, player2: player2Img }
  };

  const player1Icon = icons[variant]?.player1 || player1Img;
  const player2Icon = icons[variant]?.player2 || player2Img;
  const icon = player === 1 ? player1Icon : player2Icon;

  // Determine coin color type for Player 1 based on coinId
  const isRoyalBlueCoins = player === 1 && coinId >= 1 && coinId <= 4;
  const isGoldCoins = player === 1 && coinId >= 5 && coinId <= 8;

  // Determine coin color type for Player 2 based on coinId
  const isYellowCoins = player === 2 && coinId >= 9 && coinId <= 12;
  const isDarkRedCoins = player === 2 && coinId >= 13 && coinId <= 16;

  // Enhanced realistic colors and materials
  const coinSize = 44;
  const radius = 20;

  const offsetX = stacked ? stackPosition * 5 : 0;
  const offsetY = stacked ? stackPosition * -5 : 0;
  const rotation = stacked ? stackPosition * 8 : 0;

  return (
    <div
      className="coin-realistic"
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`,
        position: 'relative',
        display: 'inline-block',
        zIndex: stackPosition + 1,
        filter: selected
          ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'
          : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
      }}
    >
      <svg width={coinSize} height={coinSize} style={{ overflow: 'visible' }}>
        <defs>
          {/* Player 1 Royal Blue gradients */}
          <radialGradient id="player1-royal-main" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="#d4e6f1" />
            <stop offset="30%" stopColor="#85c1e5" />
            <stop offset="70%" stopColor="#154D71" />
            <stop offset="100%" stopColor="#0f3a56" />
          </radialGradient>
          <radialGradient id="player1-royal-rim" cx="0.5" cy="0.5" r="0.9">
            <stop offset="0%" stopColor="#154D71" />
            <stop offset="80%" stopColor="#0f3a56" />
            <stop offset="100%" stopColor="#0a2d42" />
          </radialGradient>

          {/* Player 1 Gold gradients */}
          <radialGradient id="player1-gold-main" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="#e8f4fd" />
            <stop offset="30%" stopColor="#99d3f0" />
            <stop offset="70%" stopColor="#33A1E0" />
            <stop offset="100%" stopColor="#2680b3" />
          </radialGradient>
          <radialGradient id="player1-gold-rim" cx="0.5" cy="0.5" r="0.9">
            <stop offset="0%" stopColor="#33A1E0" />
            <stop offset="80%" stopColor="#2680b3" />
            <stop offset="100%" stopColor="#1a5f86" />
          </radialGradient>

          {/* Player 2 Yellow gradients */}
          <radialGradient id="player2-yellow-main" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="#fffbf0" />
            <stop offset="30%" stopColor="#ffeb3b" />
            <stop offset="70%" stopColor="#fbc02d" />
            <stop offset="100%" stopColor="#f57f17" />
          </radialGradient>
          <radialGradient id="player2-yellow-rim" cx="0.5" cy="0.5" r="0.9">
            <stop offset="0%" stopColor="#ffeb3b" />
            <stop offset="80%" stopColor="#fbc02d" />
            <stop offset="100%" stopColor="#f57f17" />
          </radialGradient>

          {/* Player 2 Dark Red gradients */}
          <radialGradient id="player2-darkred-main" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="#f8e1e1" />
            <stop offset="30%" stopColor="#d32f2f" />
            <stop offset="70%" stopColor="#541212" />
            <stop offset="100%" stopColor="#3d0e0e" />
          </radialGradient>
          <radialGradient id="player2-darkred-rim" cx="0.5" cy="0.5" r="0.9">
            <stop offset="0%" stopColor="#541212" />
            <stop offset="80%" stopColor="#3d0e0e" />
            <stop offset="100%" stopColor="#2b0909" />
          </radialGradient>

          {/* Eliminated gradient */}
          <radialGradient id="eliminated-main" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="#6c757d" />
            <stop offset="50%" stopColor="#495057" />
            <stop offset="100%" stopColor="#343a40" />
          </radialGradient>
        </defs>

        {/* Shadow */}
        <circle
          cx={coinSize / 2 + 2}
          cy={coinSize / 2 + 2}
          r={radius}
          fill="rgba(0,0,0,0.4)"
          filter="blur(1px)"
        />

        {/* Outer rim */}
        <circle
          cx={coinSize / 2}
          cy={coinSize / 2}
          r={radius}
          fill={
            eliminated
              ? 'url(#eliminated-main)'
              : player === 1
              ? isRoyalBlueCoins
                ? 'url(#player1-royal-rim)'
                : isGoldCoins
                ? 'url(#player1-gold-rim)'
                : 'url(#player1-royal-rim)'
              : isYellowCoins
              ? 'url(#player2-yellow-rim)'
              : isDarkRedCoins
              ? 'url(#player2-darkred-rim)'
              : 'url(#player2-yellow-rim)'
          }
          stroke="#000"
          strokeWidth="1.5"
        />

        {/* Inner coin */}
        <circle
          cx={coinSize / 2}
          cy={coinSize / 2}
          r={radius - 3}
          fill={
            eliminated
              ? 'url(#eliminated-main)'
              : player === 1
              ? isRoyalBlueCoins
                ? 'url(#player1-royal-main)'
                : isGoldCoins
                ? 'url(#player1-gold-main)'
                : 'url(#player1-royal-main)'
              : isYellowCoins
              ? 'url(#player2-yellow-main)'
              : isDarkRedCoins
              ? 'url(#player2-darkred-main)'
              : 'url(#player2-yellow-main)'
          }
        />

        {/* Inner highlight */}
        <circle
          cx={coinSize / 2 - 3}
          cy={coinSize / 2 - 3}
          r={radius - 8}
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.5"
        />

        {/* Selection glow */}
        {selected && (
          <>
            <circle
              cx={coinSize / 2}
              cy={coinSize / 2}
              r={radius + 4}
              fill="none"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="2"
              opacity="0.8"
            />
            <circle
              cx={coinSize / 2}
              cy={coinSize / 2}
              r={radius + 7}
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="1"
              opacity="0.4"
            />
          </>
        )}
      </svg>

      {/* Icon overlay (as image) */}
      <img
        src={icon}
        alt={`Player ${player} icon`}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) ${
            player === 1
              ? isRoyalBlueCoins
                ? 'rotate(0deg)'
                : 'rotate(180deg)'
              : isYellowCoins
              ? 'rotate(180deg)'
              : 'rotate(0deg)'
          }`,
          width: 24,
          height: 24,
          opacity: eliminated ? 0.6 : 1,
          userSelect: 'none',
          pointerEvents: 'none',
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))'
        }}
      />

      {/* Eliminated indicator */}
      {eliminated && (
        <span
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            fontSize: 14,
            userSelect: 'none',
            pointerEvents: 'none',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
          }}
        >
          ❌
        </span>
      )}
    </div>
  );
}

Coin.propTypes = {
  player: PropTypes.number.isRequired,
  selected: PropTypes.bool,
  stacked: PropTypes.bool,
  stackPosition: PropTypes.number,
  eliminated: PropTypes.bool,
  isTargetStack: PropTypes.bool,
  coinId: PropTypes.number
};

export default Coin;
