import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { CREATE_WALLET } from "../../redux/actionTypes";
import { decryptMessage, getStorageSyncValue } from "../../utils/utilsUpdated";

const Seedphrase = () => {
  const [mnemonics, setMnemonics] = useState("");

  const dispatch = useDispatch();

  const currentWalletName = useSelector(
    ({ walletEncrypted }) => walletEncrypted?.currentWalletName
  );

  useEffect(() => {
    setMnemonicPhrase();
  }, []);

  const setMnemonicPhrase = async () => {
    let userInfo = await getStorageSyncValue("userInfo");
    let accountsList = userInfo[currentWalletName]["accounts"];
    let firstUser = accountsList[Object.keys(accountsList)[0]];
    let encData = firstUser.data;
    let hashedPassword = await getStorageSyncValue("hashedPassword");
    const mnemonic = await decryptMessage(encData, hashedPassword);
    setMnemonics(mnemonic);
    dispatch({
      type: CREATE_WALLET,
      payload: {
        isLoggedIn: true,
      },
    });
    localStorage.setItem("wallet", true);
  };

  return (
    <div>
      <h1>Seed Phrase</h1>
      <h2>{mnemonics}</h2>

      <Link to="/dashboard">
        <button>Next</button>
      </Link>
    </div>
  );
};

export default Seedphrase;
