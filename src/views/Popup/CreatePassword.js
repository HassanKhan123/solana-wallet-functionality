import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as Bip39 from "bip39";
import crypto from "crypto-js";
import { Keypair } from "@solana/web3.js";
import b58 from "b58";

import { encryptMessage, setStorageSyncValue } from "../../utils/utilsUpdated";
import { SET_CURRENT_WALLET_NAME } from "../../redux/actionTypes";

const CreatePassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const createWallet = async () => {
    if (!password) {
      alert("Password is required");
    } else {
      setLoading(true);

      const generatedMnemonic = Bip39.generateMnemonic();

      const seed = Bip39.mnemonicToSeedSync(generatedMnemonic).slice(0, 32);
      const ciphertext = encryptMessage(generatedMnemonic, password);

      const newAccount = Keypair.fromSeed(seed);
      let cipherKey = encryptMessage(
        b58.encode(newAccount.secretKey),
        password
      );

      let userInfo = {
        wallet1: {
          name: "wallet1",
          accounts: {
            [newAccount.publicKey]: {
              data: ciphertext,
              address: newAccount.publicKey,
              secretKey: cipherKey,
              keypair: newAccount,
            },
          },
        },
      };

      await setStorageSyncValue("userInfo", userInfo);
      await setStorageSyncValue("hashedPassword", password);
      await setStorageSyncValue("accounts", 0);
      dispatch({ type: SET_CURRENT_WALLET_NAME, payload: "wallet1" });
      setLoading(false);
      navigate("/seed-phrase");
    }
  };

  return (
    <div>
      <h1>Enter password</h1>
      <input
        value={password}
        onChange={e => setPassword(e.target.value)}
        type="password"
      />
      {loading ? (
        <p>Loading!!</p>
      ) : (
        <button onClick={createWallet}>Submit</button>
      )}
    </div>
  );
};

export default CreatePassword;
