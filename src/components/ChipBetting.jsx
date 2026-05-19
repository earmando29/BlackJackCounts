import { useContext } from 'react'
import { GameContext } from '../context/GameContext'

const CHIPS = [
  { value: 1,   color: '#ecf0f1', text: '#333',  ring: '#bdc3c7' },
  { value: 5,   color: '#e74c3c', text: '#fff',   ring: '#c0392b' },
  { value: 10,  color: '#3498db', text: '#fff',   ring: '#2980b9' },
  { value: 25,  color: '#2ecc71', text: '#fff',   ring: '#27ae60' },
  { value: 50,  color: '#e67e22', text: '#fff',   ring: '#d35400' },
  { value: 100, color: '#2c3e50', text: '#ffc220', ring: '#1a252f' },
]

const ChipBetting = () => {
  const { addChip, clearBet, selectedSpot, gameStatus, bankroll, hands, numSpots } = useContext(GameContext)

  if (gameStatus !== 'betting') return null
  const currentBet = hands[selectedSpot]?.bet ?? 0
  const totalBets = hands.slice(0, numSpots).reduce((s, h) => s + h.bet, 0)
  const remaining = bankroll - totalBets

  return (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'center',
      flexWrap: 'wrap', justifyContent: 'center',
    }}>
      {CHIPS.map(chip => {
        const disabled = chip.value > remaining + currentBet - currentBet // remaining funds
          ? chip.value > remaining : false
        return (
          <button
            key={chip.value}
            disabled={disabled}
            onClick={() => addChip(chip.value)}
            style={{
              width: 56, height: 56,
              borderRadius: '50%',
              backgroundColor: chip.color,
              color: chip.text,
              border: `4px dashed ${chip.ring}`,
              fontSize: chip.value >= 100 ? 13 : 15,
              fontWeight: 'bold',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.4 : 1,
              boxShadow: '0 3px 8px rgba(0,0,0,0.35)',
              transition: 'transform 0.12s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.88)' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            aria-label={`Add $${chip.value} chip`}
          >
            ${chip.value}
          </button>
        )
      })}

      {currentBet > 0 && (
        <button
          onClick={() => clearBet(selectedSpot)}
          style={{
            padding: '6px 14px',
            backgroundColor: '#e74c3c', color: '#fff',
            border: 'none', borderRadius: 6,
            cursor: 'pointer', fontSize: 13, fontWeight: 'bold',
          }}
        >
          Clear
        </button>
      )}
    </div>
  )
}

export default ChipBetting
