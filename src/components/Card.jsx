import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

const SUIT_SYMBOLS = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠'
}

const RED_SUITS = new Set(['hearts', 'diamonds'])

const Card = ({ card }) => {
  const { theme } = useContext(GameContext)
  if (!card) return null

  const isRed = RED_SUITS.has(card.suit)
  const label = `${card.rank}${SUIT_SYMBOLS[card.suit] ?? ''}`

  if (!card.flipped) {
    return (
      <div style={{
        width: 80, height: 112,
        backgroundColor: theme.cardBack,
        borderRadius: 8,
        border: `3px solid ${theme.cardBorder}`,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)',
      }}>
        <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.2)' }}>♠</span>
      </div>
    )
  }

  return (
    <div style={{
      width: 80, height: 112,
      backgroundColor: theme.cardColor,
      borderRadius: 8,
      border: `3px solid ${theme.cardBorder}`,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 4,
      fontSize: 16, fontWeight: 'bold',
      color: isRed ? '#c0392b' : '#2c3e50',
      boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
      position: 'relative',
      userSelect: 'none',
    }}>
      <span style={{ textAlign: 'left' }}>{label}</span>
      <span style={{
        fontSize: 28, textAlign: 'center', lineHeight: 1
      }}>
        {SUIT_SYMBOLS[card.suit]}
      </span>
      <span style={{
        textAlign: 'right', transform: 'rotate(180deg)'
      }}>{label}</span>
    </div>
  )
}

export default Card
