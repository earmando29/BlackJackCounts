import { useContext } from 'react'
import { GameContext } from '../context/GameContext'
import { getHiLoValue } from '../hooks/useDeck'
import Card from './Card'
import HandSpot from './HandSpot'

const CountBadge = ({ card, show }) => {
  if (!show || !card?.flipped) return null
  const v = getHiLoValue(card.rank)
  const bg = v > 0 ? '#27ae60' : v < 0 ? '#e74c3c' : '#7f8c8d'
  return (
    <div style={{
      position: 'absolute', top: -20, left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: bg, color: '#fff',
      padding: '1px 6px', borderRadius: 10,
      fontSize: 10, fontWeight: 'bold',
    }}>
      {v > 0 ? '+' : ''}{v}
    </div>
  )
}

/** Stacked card visual for shoe or discard pile */
const CardStack = ({ count, label, side }) => {
  const stackHeight = Math.min(8, Math.max(1, Math.ceil(count / 40)))
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      minWidth: 70, gap: 4,
    }}>
      <span style={{ color: '#aaa', fontSize: 10, fontWeight: 'bold' }}>{label}</span>
      <div style={{ position: 'relative', width: 52, height: 72 + stackHeight * 2 }}>
        {Array.from({ length: stackHeight }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: i * 2, left: i * 0.5,
            width: 52, height: 72,
            backgroundColor: side === 'shoe' ? '#1a4d2e' : '#2c3e50',
            borderRadius: 5,
            border: '2px solid #333',
            backgroundImage: side === 'shoe'
              ? 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.05) 4px, rgba(255,255,255,0.05) 8px)'
              : 'none',
          }} />
        ))}
        {count > 0 && (
          <div style={{
            position: 'absolute', bottom: -6, left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: side === 'shoe' ? '#1a4d2e' : '#2c3e50',
            color: '#fff', fontSize: 11, fontWeight: 'bold',
            padding: '1px 6px', borderRadius: 8,
            border: '1px solid #555', whiteSpace: 'nowrap',
          }}>
            {count}
          </div>
        )}
      </div>
    </div>
  )
}

/** Read-only mini card for history review */
const MiniCard = ({ card }) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds'
  const suitSym = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[card.suit] ?? ''
  return (
    <div style={{
      width: 44, height: 62, borderRadius: 5,
      border: '2px solid #555', backgroundColor: '#fff',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', padding: 2,
      fontSize: 11, fontWeight: 'bold',
      color: isRed ? '#c0392b' : '#2c3e50',
    }}>
      <span>{card.rank}{suitSym}</span>
      <span style={{ textAlign: 'right', transform: 'rotate(180deg)' }}>{card.rank}{suitSym}</span>
    </div>
  )
}

/** History review overlay */
const HistoryView = ({ round, onExit, calculateHandValue }) => {
  const dVal = calculateHandValue(round.dealerHand)
  return (
    <div style={{
      backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 12,
      padding: 16, position: 'relative',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12,
      }}>
        <h3 style={{ color: '#fff', margin: 0, fontSize: 16 }}>
          Hand #{round.handNumber}
          <span style={{ color: '#aaa', fontSize: 12, marginLeft: 8 }}>
            RC: {round.runningCount}
          </span>
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            color: round.roundNet >= 0 ? '#2ecc71' : '#e74c3c',
            fontWeight: 'bold', fontSize: 16,
          }}>
            {round.roundNet >= 0 ? '+' : ''}${round.roundNet.toFixed(0)}
          </span>
          <button onClick={onExit} style={{
            padding: '4px 12px', backgroundColor: '#e74c3c',
            color: '#fff', border: 'none', borderRadius: 4,
            cursor: 'pointer', fontSize: 12,
          }}>✕ Close</button>
        </div>
      </div>

      {/* Dealer */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ color: '#aaa', fontSize: 12 }}>Dealer ({dVal})</span>
        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
          {round.dealerHand.map(c => <MiniCard key={c.id} card={c} />)}
        </div>
      </div>

      {/* Player hands */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexDirection: 'row-reverse' }}>
        {round.playerHands.map((h, i) => {
          const val = calculateHandValue(h.cards)
          return (
            <div key={i} style={{
              border: '1px solid #555', borderRadius: 8, padding: 8,
              flex: 1, minWidth: 140,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 11, color: '#aaa', marginBottom: 4,
              }}>
                <span>Bet: ${h.bet}</span>
                <span>Val: {val}</span>
              </div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 4 }}>
                {h.cards.map(c => <MiniCard key={c.id} card={c} />)}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 'bold', textAlign: 'center',
                color: h.result?.startsWith('Win') || h.result?.startsWith('Blackjack')
                  ? '#2ecc71'
                  : h.result?.startsWith('Push') ? '#f1c40f' : '#e74c3c',
              }}>
                {h.result}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const GameTable = () => {
  const {
    dealerHand, gameStatus, numSpots, showCounts, hands, cards,
    calculateHandValue, newHand, roundNet,
    discardCount, reviewingRound, exitHistoryView,
  } = useContext(GameContext)

  // --- History review mode ---
  if (reviewingRound) {
    return (
      <div style={{
        backgroundColor: '#1a472a', borderRadius: 16,
        padding: 20, minHeight: 460, marginBottom: 12,
      }}>
        <HistoryView
          round={reviewingRound}
          onExit={exitHistoryView}
          calculateHandValue={calculateHandValue}
        />
      </div>
    )
  }

  const visibleCards = dealerHand.filter(c => c.flipped)
  const dealerValue = calculateHandValue(visibleCards)
  const dealerFullValue = calculateHandValue(dealerHand)
  const showFull = gameStatus === 'finished'
  const isBetting = gameStatus === 'betting'

  const handIndices = isBetting
    ? Array.from({ length: numSpots }, (_, i) => i)
    : hands.map((_, i) => i).filter(i => hands[i].bet > 0)

  return (
    <div style={{
      backgroundColor: '#1a472a',
      borderRadius: 16, padding: 20,
      minHeight: 460, position: 'relative',
      marginBottom: 12,
    }}>
      {/* Top row: Discard — Dealer — Shoe */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', marginBottom: 24,
      }}>
        {/* Discard pile (left) */}
        <CardStack count={discardCount} label="DISCARD" side="discard" />

        {/* Dealer (center) */}
        <div style={{ flex: 1, marginLeft: 16, marginRight: 16 }}>
          <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 8 }}>
            Dealer{' '}
            {dealerHand.length > 0 && (
              <span style={{ fontSize: 14, color: '#aaa' }}>
                ({showFull ? dealerFullValue : dealerValue})
              </span>
            )}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', minHeight: 112 }}>
            {dealerHand.map(card => (
              <div key={card.id} style={{ position: 'relative' }}>
                <CountBadge card={card} show={showCounts} />
                <Card card={card} />
              </div>
            ))}
          </div>
        </div>

        {/* Shoe (right) */}
        <CardStack count={cards.length} label="SHOE" side="shoe" />
      </div>

      {/* Divider */}
      <div style={{
        borderTop: '2px dashed rgba(255,255,255,0.15)',
        margin: '12px 0 16px',
      }} />

      {/* Player hands — right to left (row-reverse) */}
      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center',
        flexWrap: 'wrap', flexDirection: 'row-reverse',
      }}>
        {handIndices.map(i => (
          <HandSpot key={`${i}-${hands[i]?.spotIndex}`} handIndex={i} />
        ))}
      </div>

      {/* Round result + Next Hand */}
      {gameStatus === 'finished' && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 8,
          marginTop: 16,
        }}>
          {roundNet !== null && (
            <div style={{
              fontSize: 22, fontWeight: 'bold',
              color: roundNet > 0 ? '#2ecc71' : roundNet < 0 ? '#e74c3c' : '#f1c40f',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}>
              {roundNet > 0 ? `+$${roundNet.toFixed(0)} Won! 🎉`
                : roundNet < 0 ? `-$${Math.abs(roundNet).toFixed(0)} Lost`
                : 'Push — Even'}
            </div>
          )}
          <button onClick={newHand} style={{
            padding: '12px 32px',
            backgroundColor: '#4ecdc4', color: '#fff',
            border: 'none', borderRadius: 8,
            cursor: 'pointer', fontSize: 16, fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            Next Hand
          </button>
        </div>
      )}
    </div>
  )
}

export default GameTable
