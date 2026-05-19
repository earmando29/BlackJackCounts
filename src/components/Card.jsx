import { useContext, useState, useEffect } from 'react'
import { GameContext } from '../context/GameContext'

const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }
const RED_SUITS = new Set(['hearts', 'diamonds'])

const Card = ({ card }) => {
  const { theme, speedMs } = useContext(GameContext)
  const [visible, setVisible] = useState(false)

  // Stagger mount animation using dealOrder
  useEffect(() => {
    const delay = (card.dealOrder ?? 0) * speedMs
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!card) return null

  const isRed = RED_SUITS.has(card.suit)
  const label = `${card.rank}${SUIT_SYMBOLS[card.suit] ?? ''}`
  const flipDuration = card.peeling ? speedMs * 4 : speedMs * 1.2

  return (
    <div style={{
      width: 80, height: 112,
      perspective: 600,
      opacity: visible ? 1 : 0,
      animation: visible && card.dealOrder != null
        ? `cardDealIn ${speedMs * 1.5}ms ease-out forwards` : undefined,
      animationDelay: visible ? '0ms' : undefined,
    }}>
      <div style={{
        width: '100%', height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: `transform ${flipDuration}ms ease-in-out`,
        transform: card.flipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
        ...(card.peeling ? {
          animation: `peelReveal ${flipDuration}ms ease-in-out forwards`,
        } : {}),
      }}>
        {/* Front face */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          backgroundColor: theme.cardColor,
          borderRadius: 8,
          border: `3px solid ${theme.cardBorder}`,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 4,
          fontSize: 16, fontWeight: 'bold',
          color: isRed ? '#c0392b' : '#2c3e50',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          userSelect: 'none',
        }}>
          <span style={{ textAlign: 'left' }}>{label}</span>
          <span style={{ fontSize: 28, textAlign: 'center', lineHeight: 1 }}>
            {SUIT_SYMBOLS[card.suit]}
          </span>
          <span style={{ textAlign: 'right', transform: 'rotate(180deg)' }}>{label}</span>
        </div>

        {/* Back face */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          backgroundColor: theme.cardBack,
          borderRadius: 8,
          border: `3px solid ${theme.cardBorder}`,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.06) 6px, rgba(255,255,255,0.06) 12px)',
        }}>
          <span style={{ fontSize: 32, color: 'rgba(255,255,255,0.15)' }}>♠</span>
        </div>
      </div>
    </div>
  )
}

export default Card
