import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

const Card = ({ card }) => {
  const { theme } = useContext(GameContext)

  if (!card) return null

  const getCardUnicode = (rank, suit) => {
    const rankSymbols = {
      '2': '2', '3': '3', '4': '4', '5': '5', '6': '6',
      '7': '7', '8': '8', '9': '9', '10': '10',
      'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A'
    }

    const suitSymbols = {
      'hearts': '♥',
      'diamonds': '♦',
      'clubs': '♣',
      'spades': '♠'
    }

    return `${rankSymbols[rank]}${suitSymbols[suit]}`
  }

  const cardStyle = {
    width: '80px',
    height: '112px',
    backgroundColor: theme.cardColor,
    borderRadius: '8px',
    border: `3px solid ${theme.cardBorder}`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: theme.cardText,
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    transition: 'transform 0.3s ease',
    transform: card.flipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
    backfaceVisibility: 'hidden',
    position: 'relative',
    overflow: 'hidden'
  }

  const backStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.cardBack,
    borderRadius: '6px',
    border: `3px solid ${theme.cardBorder}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '40px',
    transform: card.flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
    backfaceVisibility: 'hidden'
  }

  return (
    <div style={cardStyle}>
      <div style={{ position: 'absolute', top: '4px', left: '8px' }}>
        {card.flipped && getCardUnicode(card.rank, card.suit)}
      </div>
      <div style={{ position: 'absolute', bottom: '4px', right: '8px', transform: 'rotate(180deg)' }}>
        {card.flipped && getCardUnicode(card.rank, card.suit)}
      </div>
      <div style={backStyle}>
        {getCardUnicode('♠', 'spades')}
      </div>
    </div>
  )
}

export default Card
