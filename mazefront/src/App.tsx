import { Routes, Route } from "react-router-dom";
import './index.css';
import Home from "./Home";
import MazeGameExpress from "./MazeGameExpress";
import CardFlipGame from "./CardFlipGame";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/maze" element={<MazeGameExpress />} />
      <Route path="/card" element={<CardFlipGame />} />
    </Routes>
  );
}