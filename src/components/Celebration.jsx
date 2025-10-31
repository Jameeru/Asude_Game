import React, { useState, useEffect } from 'react';
import './Celebration.css';

const Celebration = ({ winner, gameType = 'Strategy Game', onClose, scores = {}, gameStats = {}, playerNames = {} }) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [showFireworks, setShowFireworks] = useState(true);
  const [displayStats, setDisplayStats] = useState({
    totalMoves: gameStats.totalMoves || Math.floor(Math.random() * 50) + 20,
    gameTime: gameStats.gameTime || `${Math.floor(Math.random() * 5) + 2}m ${Math.floor(Math.random() * 59) + 1}s`,
    winStreak: gameStats.winStreak || Math.floor(Math.random() * 10) + 1,
    xpEarned: gameStats.xpEarned || Math.floor(Math.random() * 500) + 100,
  });

  // Calculate additional stats from scores if provided
  useEffect(() => {
    if (scores.player1 !== undefined && scores.player2 !== undefined) {
      const totalScore = scores.player1 + scores.player2;
      setDisplayStats(prev => ({
        ...prev,
        player1Score: scores.player1,
        player2Score: scores.player2,
        totalPieces: totalScore,
        winMargin: Math.abs(scores.player1 - scores.player2)
      }));
    }
  }, [scores]);

  useEffect(() => {
    // Start celebrations
    const confettiTimer = setTimeout(() => setShowConfetti(false), 6000);
    const fireworksTimer = setTimeout(() => setShowFireworks(false), 8000);

    // Auto close after 12 seconds if no interaction
    const autoCloseTimer = setTimeout(() => {
      if (onClose) onClose();
    }, 12000);

    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(fireworksTimer);
      clearTimeout(autoCloseTimer);
    };
  }, [onClose]);

  const getWinnerMessage = () => {
    const messages = {
      [playerNames[1] || 'Player 1']: ['🎯 DOMINATES THE ARENA!', '⚡ FLAWLESS VICTORY!', '🏆 CHAMPION CROWNED!'],
      [playerNames[2] || 'Player 2']: ['🎮 TRIUMPHS IN BATTLE!', '⭐ STRATEGIC MASTERY!', '🏅 VICTORY SECURED!'],
      'Player 1': ['🎯 PLAYER 1 DOMINATES!', '⚡ FLAWLESS VICTORY!', '🏆 CHAMPION CROWNED!'],
      'Player 2': ['🎮 PLAYER 2 TRIUMPHS!', '⭐ STRATEGIC MASTERY!', '🏅 VICTORY SECURED!'],
      'You': ['🎉 VICTORY ACHIEVED!', '⚡ CHAMPION CROWNED!', '🏆 FLAWLESS VICTORY!'],
      'Human': ['🎯 WELL PLAYED!', '🌟 EXCELLENT GAME!', '🎊 CONGRATULATIONS!'],
      'AI': ['🤖 AI DOMINANCE!', '⚙️ MACHINE VICTORY!', '🔥 CALCULATED WIN!']
    };
    
    const winnerMessages = messages[winner] || messages['Player 1'];
    return winnerMessages[Math.floor(Math.random() * winnerMessages.length)];
  };

  const getWinnerEmoji = () => {
    const emojis = {
      'Player 1': ['🥇', '👑', '⭐', '🎯', '💪'],
      'Player 2': ['🥇', '👑', '⭐', '🎮', '🔥'],
      'You': ['🎯', '⚡', '🌟', '💪', '🔥'],
      'Human': ['😎', '🎮', '👑', '⭐', '🎊'],
      'AI': ['🤖', '⚙️', '🔧', '💻', '🎯']
    };
    
    const winnerEmojis = emojis[winner] || emojis['Player 1'];
    return winnerEmojis[Math.floor(Math.random() * winnerEmojis.length)];
  };

  const getVictorySubtitle = () => {
    // Generate more specific subtitles based on game data
    if (displayStats.winMargin !== undefined) {
      if (displayStats.winMargin === 0) {
        return 'What an incredible draw! Both players showed exceptional skill!';
      } else if (displayStats.winMargin <= 2) {
        return `A nail-biting finish with only ${displayStats.winMargin} points difference!`;
      } else if (displayStats.winMargin >= 10) {
        return `Absolutely dominant performance! Victory by ${displayStats.winMargin} points!`;
      }
    }
    
    const subtitles = [
      'Outstanding strategic performance in the arena!',
      'Your tactical prowess has secured victory!',
      'A legendary battle comes to an end!',
      'Victory through skill and determination!',
      'Another challenger conquered with style!'
    ];
    
    return subtitles[Math.floor(Math.random() * subtitles.length)];
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handlePlayAgain = () => {
    if (onClose) onClose();
    // Additional play again logic can be added here
  };

  const generateMoreConfetti = () => {
    setShowConfetti(false);
    setTimeout(() => setShowConfetti(true), 100);
  };

  return (
    <div className="celebration-overlay" onClick={generateMoreConfetti}>
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(100)].map((_, i) => (
            <div 
              key={i} 
              className={`confetti confetti-${i % 5}`}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {showConfetti && (
        <div className="sparkles-container">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className="sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}
      
      {showFireworks && (
        <div className="fireworks-container">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="firework"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 40}%`,
                animationDelay: `${i * 0.8}s`
              }}
            />
          ))}
          <div className="firework firework-1"></div>
          <div className="firework firework-2"></div>
          <div className="firework firework-3"></div>
        </div>
      )}

      <div className="celebration-content">
        <div className="winner-trophy">
          <div className="trophy-icon">🏆</div>
          <div className="winner-emoji">{getWinnerEmoji()}</div>
        </div>
        
        <h1 className="celebration-title">{getWinnerMessage()}</h1>
        <p className="victory-subtitle">{getVictorySubtitle()}</p>
        
        <div className="celebration-stats">
          {displayStats.player1Score !== undefined && (
            <div className="stat-item">
              <span className="stat-label">{playerNames[1] || 'Player 1'} Score</span>
              <span className="stat-value">{displayStats.player1Score}</span>
            </div>
          )}
          {displayStats.player2Score !== undefined && (
            <div className="stat-item">
              <span className="stat-label">{playerNames[2] || 'Player 2'} Score</span>
              <span className="stat-value">{displayStats.player2Score}</span>
            </div>
          )}
          {displayStats.winMargin !== undefined && (
            <div className="stat-item">
              <span className="stat-label">Win Margin</span>
              <span className="stat-value">{displayStats.winMargin}</span>
            </div>
          )}
          <div className="stat-item">
            <span className="stat-label">XP Earned</span>
            <span className="stat-value">+{displayStats.xpEarned}</span>
          </div>
        </div>

        <div className="celebration-buttons">
          <button className="play-again-btn" onClick={handlePlayAgain}>
            🎮 Play Again
          </button>
          <button className="main-menu-btn" onClick={handleClose}>
            🏠 Main Menu
          </button>
        </div>

        <div className="celebration-message">
          <p>🎊 Click anywhere for more celebration effects! 🎊</p>
        </div>
      </div>
    </div>
  );
};

export default Celebration;
