import './App.css'
import Game from './components/Game'

function App() {
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>카드 뒤집기 맞추기 게임</h1>
        <p>같은 그림을 가진 카드를 맞춰보세요.</p>
      </header>
      <main>
        <Game />
      </main>
    </div>
  )
}

export default App
