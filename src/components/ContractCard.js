import React from 'react';
import { Card, CardContent, Typography, CardActionArea, Button, IconButton } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import TelegramIcon from '@mui/icons-material/Telegram';
import DeleteIcon from '@mui/icons-material/Delete';
import './ContractCard.css';

function ContractCard({ contract, onDelete }) {
  const handleCardClick = () => {
    const etherscanUrl = `https://etherscan.io/token/${contract.contractAddress}`;
    window.open(etherscanUrl, '_blank');
  };

  const handleTelegramClick = (e, url) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  return (
    <Card className="contract-card">
      <CardActionArea onClick={handleCardClick}>
        <CardContent>
          <div className="card-header">
            <Typography variant="h6" component="div">
              {contract.tokenName || 'Unknown Token'}
            </Typography>
            <IconButton
              aria-label="delete"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click event
                onDelete(contract.contractAddress);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </div>
        </CardContent>
      </CardActionArea>
      <CardContent>
        <CopyToClipboard text={contract.contractAddress}>
          <Button
            variant="outlined"
            startIcon={<ContentCopy />}
            onClick={(e) => e.stopPropagation()} // Prevent card click event
          >
            Copy Address
          </Button>
        </CopyToClipboard>
        {contract.telegramLink ? (
          <Button
            variant="outlined"
            startIcon={<TelegramIcon />}
            onClick={(e) => handleTelegramClick(e, contract.telegramLink)}
          >
            Telegram
          </Button>
        ) : contract.possibleTelegramLink ? (
          <Button
            variant="outlined"
            startIcon={<TelegramIcon />}
            onClick={(e) => handleTelegramClick(e, contract.possibleTelegramLink)}
          >
            Possible Telegram
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default ContractCard;
