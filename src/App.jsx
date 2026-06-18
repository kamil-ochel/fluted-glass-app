import { FlutedGlassMouse } from './FlutedGlassMouse';
import './App.css';

const IMAGE = 'https://picsum.photos/id/1018/1600/1000';

export default function App() {
  return (
    <main className="page">
      <FlutedGlassMouse
        className="glass"
        image={IMAGE}
        shape="lines"
        distortionShape="prism"
        size={0.75}
        distortion={0.3}
        shadows={0.3}
        highlights={0.3}
        edges={0.25}
        mouseRadius={0.3}
      />
    </main>
  );
}
