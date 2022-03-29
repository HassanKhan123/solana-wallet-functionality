import {
  clusterApiUrl,
  Connection,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import * as splToken from "@solana/spl-token";

import { Link, useNavigate } from "react-router-dom";
import { COMMITMENT, CURRENT_NETWORK } from "../../constants";

let web3;
let common;

const SendTokens = () => {
  const [loading, setLoading] = useState(false);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState("");

  const navigate = useNavigate();

  const currentWalletName = useSelector(
    ({ walletEncrypted }) => walletEncrypted?.currentWalletName
  );
  const allTokens = useSelector(
    ({ walletEncrypted }) => walletEncrypted?.allTokens
  );
  const activeAccount = useSelector(
    ({ walletEncrypted }) => walletEncrypted?.activeAccount
  );

  const sendTransaction = async () => {
    setLoading(true);
    const connection = new Connection(
      clusterApiUrl(CURRENT_NETWORK),
      COMMITMENT
    );

    const publicKey = activeAccount.keypair.publicKey;
    const secretKey = activeAccount.keypair.secretKey;

    try {
      if (selectedAsset === "") {
        const instructions = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(receiver),
          lamports: amount * 1000000000,
        });

        const transaction = new Transaction().add(instructions);

        const signers = [
          {
            publicKey,
            secretKey,
          },
        ];

        const confirmation = await sendAndConfirmTransaction(
          connection,
          transaction,
          signers
        );
        console.log("CONF=======", confirmation);
        navigate("/dashboard");

        alert(`Transaction confirmed`);
      } else {
        let [address, decimals] = selectedAsset.split(":");

        let USDC_pubkey = new PublicKey(address);

        let myToken = new splToken.Token(
          connection,
          USDC_pubkey,
          splToken.TOKEN_PROGRAM_ID,
          activeAccount.keypair
        );

        var fromTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
          publicKey
        );
        var toTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
          new PublicKey(receiver)
        );
        // //         // Create associated token accounts for my token if they don't exist yet
        var transaction = new Transaction().add(
          splToken.Token.createTransferInstruction(
            splToken.TOKEN_PROGRAM_ID,
            fromTokenAccount.address,
            toTokenAccount.address,
            publicKey,
            [],
            amount * 10 ** decimals
          )
        );
        // Sign transaction, broadcast, and confirm
        var signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [activeAccount.keypair]
        );
        console.log("SIGNATURE", signature);
        navigate("/dashboard");

        alert(`Transaction confirmed`);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error.message);
      alert(error.message);
    }
  };

  return (
    <div>
      <h3>Send Assets</h3>

      <select onChange={e => setSelectedAsset(e.target.value)}>
        <option value="">Solana</option>
        {allTokens.map((tk, ind) => (
          <option key={ind} value={`${tk.address}:${tk.decimals}`}>
            {tk.name}
          </option>
        ))}
      </select>

      <input
        value={receiver}
        placeholder="Enter Address"
        onChange={e => setReceiver(e.target.value)}
      />
      <input
        value={amount}
        placeholder="Enter amount"
        onChange={e => setAmount(e.target.value)}
        type="number"
      />

      <>
        {loading ? (
          <p>Loading!!!</p>
        ) : (
          <button onClick={sendTransaction}>Send</button>
        )}
        <Link to="/dashboard">Back</Link>
      </>
    </div>
  );
};

export default SendTokens;
