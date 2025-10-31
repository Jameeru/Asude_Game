import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import RulesModal from './RulesModal';
import './HomePage.css';

const HomePage = ({ onNavigate, onQuickPlay, user }) => {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activeGames: 0,
    completedMatches: 0,
    onlineNow: 0
  });
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Fetch real statistics and leaderboard on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use demo/local stats and leaderboard
        const rooms = JSON.parse(localStorage.getItem('asude_rooms') || '[]');
        const totalPlayers = 1000 + rooms.reduce((acc, r) => acc + (r.players?.length || 0), 0);
        const activeGames = rooms.filter(r => r.is_active).length;
        const completedMatches = Number(localStorage.getItem('demo_completed_matches') || 8943);
        const onlineNow = Math.min(200, Math.floor(totalPlayers / 6));
        setStats({ totalPlayers, activeGames, completedMatches, onlineNow });

        const leaderboard = JSON.parse(localStorage.getItem('demo_leaderboard') || '[]');
        if (leaderboard.length > 0) setLeaderboard(leaderboard);
        else setLeaderboard([
          { username: 'StrategicMaster', wins: 234, winRate: 87.5, avatar: '👑' },
          { username: 'CoinWhisperer', wins: 198, winRate: 82.3, avatar: '🎯' },
          { username: 'BoardDominator', wins: 176, winRate: 79.1, avatar: '⚡' },
          { username: 'TacticalGenius', wins: 152, winRate: 75.8, avatar: '🧠' },
          { username: 'GridMaster', wins: 134, winRate: 72.4, avatar: '🎲' },
        ]);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const features = [
    {
      icon: "🎯",
      title: "Strategic Coin Movement",
      description: "Master the art of positioning with Asude Competator GAme's unique 13x13 board and strategic coin placement.",
      highlight: "8 coins per player"
    },
    {
      icon: "⚡",
      title: "Real-time Multiplayer",
      description: "Challenge players worldwide with instant matchmaking and seamless real-time gameplay.",
      highlight: "Global matches"
    },
    {
      icon: "🏆",
      title: "Competitive Rankings",
      description: "Climb the leaderboards, track your statistics, and become the ultimate Asude Competator GAme champion.",
      highlight: "Skill-based ranking"
    },
    {
      icon: "🎮",
      title: "Advanced Game Modes",
      description: "Experience classic gameplay, blitz matches, and tournament-style competitions.",
      highlight: "Multiple modes"
    }
  ];

  // Feature rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  const gameRules = [
    {
      title: "Objective",
      icon: "🎯",
      description: "Move all 8 coins to target zones: 4 from opponent's target to yours, 4 from home to opponent's target."
    },
    {
      title: "Movement",
      icon: "↗️",
      description: "Primary diagonal movement (1-2 steps). Corner positions allow straight movement (1 step)."
    },
    {
      title: "Special Zones",
      icon: "🔄",
      description: "Observer zones allow stacking. Invisible safety lines protect coins with strategic penalties."
    },
    {
      title: "Victory",
      icon: "👑",
      description: "First player to successfully position all 8 coins in their target zones wins the match!"
    }
  ];

  const handlePlayNow = () => {
    // In demo mode we assume guest user and go to games/dashboard
    onNavigate?.('games');
  };

  if (loading) {
    return (
      <div className="homepage loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Asude Competator GAme...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              🎯 Strategic Coin Game
            </div>
            <h1 className="hero-title">
              Master the Art of
              <span className="title-highlight"> Asude Competator GAme</span>
            </h1>
            <p className="hero-description">
              Experience the ultimate strategic coin game on a 13x13 board. 
              Challenge players worldwide, master unique movement patterns, 
              and climb to the top of the global leaderboard.
            </p>
            
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">{stats.totalPlayers.toLocaleString()}</div>
                <div className="stat-label">Total Players</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.activeGames}</div>
                <div className="stat-label">Active Games</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.onlineNow}</div>
                <div className="stat-label">Online Now</div>
              </div>
            </div>

            <div className="hero-actions">
              <button 
                className="btn btn-primary btn-large quick-play-btn"
                onClick={onQuickPlay}
                title="Start playing instantly as a guest (Press Enter)"
              >
                ⚡ Quick Play
              </button>
              <button 
                className="btn btn-secondary btn-large"
                onClick={handlePlayNow}
              >
                🎮 Join Lobby
              </button>
              <button 
                className="btn btn-outline btn-large"
                onClick={() => setShowRulesModal(true)}
              >
                📖 Learn Rules
              </button>
            </div>
            
            <div className="keyboard-hint">
              <span className="hint-text">💡 Press <kbd>Enter</kbd> for instant Quick Play</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="game-board-preview">
              <div className="board-grid">
                {Array.from({ length: 25 }, (_, i) => (
                  <div key={i} className={`grid-cell ${i % 4 === 0 ? 'highlight' : ''}`}>
                    {i < 8 && <div className="coin player1"></div>}
                    {i > 17 && <div className="coin player2"></div>}
                  </div>
                ))}
              </div>
              <div className="board-glow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Asude Competator GAme?</h2>
            <p className="section-subtitle">
              Discover what makes Asude Competator GAme the premier strategic coin game platform
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`feature-card ${index === currentFeature ? 'featured' : ''}`}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-highlight">{feature.highlight}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Rules Section */}
      <section className="rules-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How to Play Asude Competator GAme</h2>
            <p className="section-subtitle">
              Master these core concepts to become a strategic champion
            </p>
          </div>

          <div className="rules-grid">
            {gameRules.map((rule, index) => (
              <div key={index} className="rule-card">
                <div className="rule-icon">{rule.icon}</div>
                <h3 className="rule-title">{rule.title}</h3>
                <p className="rule-description">{rule.description}</p>
              </div>
            ))}
          </div>

          <div className="rules-cta">
            <button 
              className="btn btn-outline"
              onClick={() => onNavigate?.('guide')}
            >
              📚 Complete Game Guide
            </button>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="leaderboard-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">🏆 Top Players</h2>
            <p className="section-subtitle">
              See who's dominating the Asude Competator GAme battlefield
            </p>
          </div>

          <div className="leaderboard-container">
            <div className="leaderboard-header">
              <div className="header-rank">Rank</div>
              <div className="header-player">Player</div>
              <div className="header-wins">Wins</div>
              <div className="header-winrate">Win Rate</div>
            </div>

            <div className="leaderboard-list">
              {leaderboard.slice(0, 10).map((player, index) => (
                <div key={index} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
                  <div className="player-rank">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `#${index + 1}`}
                  </div>
                  <div className="player-info">
                    <div className="player-avatar">{player.avatar || '👤'}</div>
                    <div className="player-name">{player.username}</div>
                  </div>
                  <div className="player-wins">{player.wins}</div>
                  <div className="player-winrate">{player.winRate?.toFixed(1) || '0.0'}%</div>
                </div>
              ))}
            </div>

            {leaderboard.length === 0 && (
              <div className="no-data">
                <p>🎮 Be the first to claim the top spot!</p>
                <button 
                  className="btn btn-primary"
                  onClick={handlePlayNow}
                >
                  Start Your Journey
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Master Asude Competator GAme?</h2>
            <p className="cta-description">
              Join thousands of strategic minds in the ultimate coin placement challenge.
              Every move matters, every game is unique.
            </p>
            
            <div className="cta-actions">
              <button 
                className="btn btn-primary btn-large"
                onClick={handlePlayNow}
              >
                {user ? '🎯 Play Now' : '🚀 Join Now'}
              </button>
              {!user && (
                <button 
                  className="btn btn-secondary btn-large"
                  onClick={() => onNavigate?.('register')}
                >
                  📝 Create Account
                </button>
              )}
            </div>

            <div className="cta-stats">
              <div className="cta-stat">
                <strong>{stats.completedMatches.toLocaleString()}</strong>
                <span>Matches Played</span>
              </div>
              <div className="cta-stat">
                <strong>2-4 min</strong>
                <span>Average Game</span>
              </div>
              <div className="cta-stat">
                <strong>13x13</strong>
                <span>Strategic Board</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>🎯 Asude Competator GAme</h3>
              <p>The strategic coin game that challenges minds worldwide.</p>
            </div>
            
            <div className="footer-links">
              <div className="footer-section">
                <h4>Game</h4>
                <ul>
                  <li><button onClick={() => onNavigate?.('guide')}>How to Play</button></li>
                  <li><button onClick={() => onNavigate?.('games')}>Find Match</button></li>
                  <li><button onClick={() => onNavigate?.('leaderboard')}>Leaderboard</button></li>
                </ul>
              </div>
              
              <div className="footer-section">
                <h4>Community</h4>
                <ul>
                  <li><button onClick={() => onNavigate?.('profile')}>Player Profiles</button></li>
                  <li><button onClick={() => onNavigate?.('tournaments')}>Tournaments</button></li>
                  <li><button onClick={() => onNavigate?.('forums')}>Forums</button></li>
                </ul>
              </div>
              
              <div className="footer-section">
                <h4>Support</h4>
                <ul>
                  <li><button onClick={() => onNavigate?.('help')}>Help Center</button></li>
                  <li><button onClick={() => onNavigate?.('contact')}>Contact Us</button></li>
                  <li><button onClick={() => onNavigate?.('feedback')}>Feedback</button></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 Asude Competator GAme. All rights reserved.</p>
            <div className="footer-meta">
              <button onClick={() => onNavigate?.('privacy')}>Privacy Policy</button>
              <button onClick={() => onNavigate?.('terms')}>Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Rules Modal */}
      <RulesModal 
        isOpen={showRulesModal} 
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  );
};

HomePage.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  onQuickPlay: PropTypes.func.isRequired,
  user: PropTypes.object
};

export default HomePage;