import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import * as web3 from "@solana/web3.js";
import b58 from "b58";
import * as Bip39 from "bip39";
import nacl from "tweetnacl";
import * as ed25519 from "ed25519-hd-key";

import {
  decryptMessage,
  fetchBalance,
  getStorageSyncValue,
  handleAirdrop,
  initialTasks,
  setStorageSyncValue,
  showAllHoldings,
} from "../../utils/utilsUpdated";
import {
  SHOW_ALL_CUSTOM_TOKENS,
  SWITCH_ACCOUNT,
} from "../../redux/actionTypes";
import { COMMITMENT, CURRENT_NETWORK } from "../../constants";

let connection;

const Dashboard = () => {
  const [privateKey, setPrivateKey] = useState("");
  const [address, setAddress] = useState("");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [keypair, setKeypair] = useState({});
  const [encryptedPassword, setEncryptedPassword] = useState("");
  const [allAccounts, setAllAccounts] = useState([]);
  const [balance, setBalance] = useState(0);
  const [airdropLoading, setAirdropLoading] = useState(false);

  const currentWalletName = useSelector(
    ({ walletEncrypted }) => walletEncrypted?.currentWalletName
  );
  const allTokens = useSelector(
    ({ walletEncrypted }) => walletEncrypted?.allTokens
  );

  const dispatch = useDispatch();

  useEffect(() => {
    connection = new web3.Connection(
      web3.clusterApiUrl(CURRENT_NETWORK),
      COMMITMENT
    );
  }, []);

  useEffect(() => {
    (async () => {
      const { accountsList, firstUser, importedAccount, mnemonic, secret } =
        await initialTasks(currentWalletName);
      const allTokens = await showAllHoldings(firstUser.address);
      console.log("AKK========", allTokens);
      setAllAccounts(accountsList);
      dispatch({
        type: SWITCH_ACCOUNT,
        payload: firstUser.address,
      });
      setKeypair(importedAccount);

      setAddress(firstUser.address);
      setPrivateKey(secret);
      setSeedPhrase(mnemonic);
      setKeypair(firstUser.keypair);
      dispatch({
        type: SHOW_ALL_CUSTOM_TOKENS,
        payload: [...allTokens],
      });
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (keypair.publicKey) {
        try {
          let balance = await fetchBalance(CURRENT_NETWORK, keypair.publicKey);
          setBalance(balance);
        } catch (error) {
          console.log("ERR===", error);
        }
      }
    })();
  }, [airdropLoading, keypair.publicKey]);

  const airdrop = async () => {
    setAirdropLoading(true);
    const seed = Bip39.mnemonicToSeedSync(seedPhrase).slice(0, 32);
    const importedAccount = web3.Keypair.fromSeed(seed);
    const updatedBalance = await handleAirdrop(
      CURRENT_NETWORK,
      importedAccount.publicKey
    );
    if (typeof updatedBalance === "number") {
      setBalance(updatedBalance);
    }
    setAirdropLoading(false);
  };

  const createAccount = async () => {
    let userInfo = await getStorageSyncValue("userInfo");
    let numOfAccs = Object.keys(userInfo[currentWalletName]["accounts"]).length;
    const account = accountFromSeed(seedPhrase, Number(numOfAccs) + 1);
    // userInfo[currentWalletName]["accounts"] = {
    //     ...userInfo[currentWalletName]["accounts"],
    //     [account.publicKey.toString()]: {
    //       data: wallet.getPrivateKey().toString("hex"),
    //       address,
    //       ethereumTokens: [],
    //       polygonTokens: [],
    //       maticTokens: [],
    //     },
    //   };
    console.log(
      "ACCOUNT============",
      account
      //   account.publicKey.toString(),
      //   b58.encode(account.secretKey)
    );
  };

  const accountFromSeed = (seed, walletIndex) => {
    const derivedSeed = deriveSeed(seed, walletIndex);
    console.log("DER---------", deriveSeed);
    const keyPair = nacl.sign.keyPair.fromSeed(derivedSeed);

    const acc = new web3.Keypair(keyPair);
    return acc;
  };

  const deriveSeed = (seed, walletIndex) => {
    console.log("seed----------", seed);
    const path44Change = `m/44'/501'/${walletIndex}'/0'`;
    return ed25519.derivePath(path44Change, seed).key;
  };

  return (
    <>
      <Link to="/change-wallet">
        <h2>{currentWalletName}</h2>
      </Link>

      <h3 style={{ overflowWrap: "break-word" }}>PRIVATE KEY: {privateKey}</h3>
      <h3 style={{ overflowWrap: "break-word" }}>Address: {address}</h3>
      <h3>SEED PHRASE: {seedPhrase}</h3>

      <h4>Solana Balance: {balance} SOL</h4>
      {airdropLoading && <p>Loading!!!</p>}

      <button onClick={airdrop}>Airdrop 1 SOL</button>
      <button onClick={createAccount}>Create Account</button>
      <Link to="/send">
        <button>Send</button>
      </Link>

      <h2>Your Holdings</h2>
      <ul>
        {allTokens.map(tk => (
          <li>
            {tk.name} - {tk.amount} {tk.symbol}
          </li>
        ))}
      </ul>
    </>
  );
};

export default Dashboard;
