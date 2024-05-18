import React, { useEffect, useState } from 'react'; // import react and hooks
import useWebSocket from 'react-use-websocket'; // import websocket hook
import './App.css'; // import css
import ContractCard from './components/ContractCard'; // import contract card component
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'; // import material-ui components

// create dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark', // set dark mode
    background: {
      default: '#121212', // set default background color
      paper: '#1e1e1e', // set paper background color
    },
    text: {
      primary: '#ffffff', // set primary text color
      secondary: '#b3b3b3', // set secondary text color
    },
    primary: {
      main: '#bb86fc', // set primary color
    },
    secondary: {
      main: '#03dac6', // set secondary color
    },
    action: {
      hover: '#333333', // set hover color
    },
  },
});

function App() {
  const [contracts, setContracts] = useState([]); // state for contracts
  const { lastMessage, readyState } = useWebSocket('ws://localhost:5001'); // websocket connection

  useEffect(() => {
    if (lastMessage !== null) {
      console.log('Received WebSocket message:', lastMessage.data); // log received message
      const newContracts = JSON.parse(lastMessage.data); // parse message data
      console.log('Parsed contracts:', newContracts); // log parsed contracts
      setContracts((prevContracts) => [...prevContracts, ...newContracts]); // update contracts state
    }
  }, [lastMessage]); // run effect on new message

  useEffect(() => {
    console.log('Updated contracts state:', contracts); // log updated state
  }, [contracts]); // run effect on contracts update

  const handleDelete = (contractAddress) => {
    setContracts((prevContracts) => prevContracts.filter(contract => contract.contractAddress !== contractAddress)); // filter out deleted contract
  };

  return (
    <ThemeProvider theme={darkTheme}> {/* apply dark theme */}
      <CssBaseline /> {/* apply css baseline */}
      <div className="App"> {/* main app div */}
        <header className="App-header"> {/* header section */}
          <h1>ethersearch</h1> {/* app title */}
          {contracts.length === 0 && <p>searching...</p>} {/* show searching if no contracts */}
          <div className="contract-list-container"> {/* container for contract list */}
            <div className="contract-list"> {/* contract list */}
              {contracts.map((contract, index) => (
                <ContractCard key={index} contract={contract} onDelete={handleDelete} /> // render contract cards
              ))}
            </div>
          </div>
        </header>
      </div>
    </ThemeProvider>
  );
}

export default App; // export app component
