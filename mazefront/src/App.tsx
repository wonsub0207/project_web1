import { Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "./Home";
import MazeGameExpress from "./MazeGameExpress";
import CardFlipGame from "./CardFlipGame";
import Game2048 from "./Game2048";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/maze" element={<MazeGameExpress />} />
      <Route path="/card" element={<CardFlipGame />} />
      <Route path="/2048" element={<Game2048 />} />
    </Routes>
  );
}