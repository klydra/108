import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Card from './components/Card'
import {CardColor, CardFace, CardType} from "./models/Card";

const root = ReactDOM.createRoot(document.getElementById('root')!);

const card: CardType = {
  color: CardColor.PURPLE,
  face: CardFace.NUMBER_0
}

root.render(
  <React.StrictMode>
    <div>
      <Card card={card} />
    </div>
  </React.StrictMode>
);