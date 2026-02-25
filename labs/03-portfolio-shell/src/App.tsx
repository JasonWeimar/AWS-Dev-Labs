import "./App.css";
import { APP_NAME, API_BASE_URL } from "./config";

function App() {
  return (
    <>
      <h1>{APP_NAME}</h1>
      <div>
        <h2>☁️ 😎 CloudFront Deployment Change Test 😎 ☁️</h2>
      </div>
      <p>API_BASE_URL: {API_BASE_URL || "(not set yet)"}</p>
    </>
  );
}

export default App;