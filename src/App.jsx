import { GameProvider } from './context/GameContext'
import GameTable from './components/GameTable'
import ControlPanel from './components/ControlPanel'
import BankrollDisplay from './components/BankrollDisplay'

function App() {
  return (
    <GameProvider>
      <div className="app">
        <h1>Blackjack Card Counter</h1>
        <BankrollDisplay />
        <GameTable />
        <ControlPanel />
      </div>
    </GameProvider>
  )
}

export default App
