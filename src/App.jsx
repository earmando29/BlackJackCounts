import { GameProvider } from './context/GameContext'
import GameTable from './components/GameTable'
import ControlPanel from './components/ControlPanel'
import BankrollDisplay from './components/BankrollDisplay'

function App() {
  return (
    <GameProvider>
      <div className="app">
        <h1 style={{
          textAlign: 'center', marginBottom: 12,
          fontSize: 26, letterSpacing: 1,
        }}>
          🃏 CountMaster
        </h1>
        <BankrollDisplay />
        <GameTable />
        <ControlPanel />
      </div>
    </GameProvider>
  )
}

export default App
