import React from "react";
import Bar from "./components/Bar";
function App() {
  const [dark, setDark] = React.useState(false);
  const darkModeHandler = () => {
    setDark(!dark);
    document.body.classList.toggle("dark");
  }
  return (
    <div className="h-screen bg-blue-300 dark:bg-black">
      <button className="hover:cursor-pointer" onClick={()=> darkModeHandler()}>
      {
          
          dark && <div className="dark:text-l dark:text dark:text-white">Dark</div>// render sunny when dark is true
      }
      {
          !dark && <div className="text-l">Light</div> // render moon when dark is false
      }
      </button>
      <Bar />
    </div>
  )
}

export default App
