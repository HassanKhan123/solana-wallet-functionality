import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import crypto from "crypto-js";
import * as Bip39 from "bip39";
import * as web3 from "@solana/web3.js";
import b58 from "b58";

import {
  COMMITMENT,
  CURRENT_NETWORK,
  OPEN_IN_WEB,
  STORAGE,
  USD_CACHE_TIME,
} from "../constants";
import { TokenListProvider } from "@solana/spl-token-registry";
import * as splToken from "@solana/spl-token";
import axios from "axios";

export const getStorageSyncValue = async keyName => {
  try {
    if (OPEN_IN_WEB) {
      return new Promise((resolve, reject) => {
        const item = localStorage.getItem(keyName);
        resolve(JSON.parse(item));
      });
    }
    return new Promise((resolve, reject) => {
      STORAGE?.get([keyName], function (extractedValue) {
        resolve(extractedValue[keyName]);
      });
    });
  } catch (error) {
    throw new Error(error);
  }
};

export const setStorageSyncValue = async (keyName, value) => {
  try {
    if (OPEN_IN_WEB) {
      return new Promise((resolve, reject) => {
        localStorage.setItem(keyName, JSON.stringify(value));
        resolve();
      });
    }
    return new Promise((resolve, reject) => {
      STORAGE?.set({ [keyName]: value }, function () {
        resolve();
      });
    });
  } catch (error) {
    console.log("error setting the sync storage ", error);
  }
};

export const encryptMessage = (message, secret) => {
  const ciphertext = crypto.AES.encrypt(
    JSON.stringify(message),
    secret
  ).toString();

  return ciphertext;
};

export const decryptMessage = (cipherText, secret) => {
  let bytes = crypto.AES.decrypt(cipherText, secret);
  let decryptedText = JSON.parse(bytes.toString(crypto.enc.Utf8));

  return decryptedText;
};

export const fetchBalance = async (network, publicKey) => {
  console.log("sdjdshhjdhj", publicKey);
  if (!publicKey) return;

  try {
    const connection = new Connection(clusterApiUrl(network), COMMITMENT);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.log(error);
    return 0;
  }
};

export const handleAirdrop = async (network, publicKey) => {
  console.log("air===", publicKey, new Uint8Array(publicKey));
  if (!publicKey) return;

  try {
    const connection = new Connection(clusterApiUrl(network), COMMITMENT);
    const confirmation = await connection.requestAirdrop(
      publicKey,
      LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(confirmation, COMMITMENT);
    return await fetchBalance(network, publicKey);
  } catch (error) {
    console.log(error);
    return;
  }
};

export const initialTasks = async (
  currentWalletName,
  currentAccountAddress = ""
) => {
  let userInfo = await getStorageSyncValue("userInfo");
  let accountsList = userInfo[currentWalletName]["accounts"];
  let firstUser = currentAccountAddress
    ? accountsList[currentAccountAddress]
    : accountsList[Object.keys(accountsList)[0]];

  let encData = firstUser.data;
  let hashedPassword = await getStorageSyncValue("hashedPassword");
  const mnemonic = await decryptMessage(encData, hashedPassword);
  let secret;
  let seed;
  let importedAccount;

  if (firstUser.secretKey) {
    secret = await decryptMessage(firstUser.secretKey, hashedPassword);
  }

  let split = mnemonic.split(" ");

  if (split.length > 1) {
    seed = Bip39.mnemonicToSeedSync(mnemonic).slice(0, 32);
    importedAccount = web3.Keypair.fromSeed(seed);
  } else {
    const address = b58.decode(mnemonic);
    importedAccount = web3.Keypair.fromSecretKey(address);
  }

  return {
    accountsList,
    importedAccount,
    firstUser,
    secret,
    mnemonic,
  };
};

const fetchTokens = async ({ account }) => {
  console.log("a", account);
  let address = account.data.parsed.info.mint;
  return new TokenListProvider().resolve().then(tokens => {
    let tokenList = tokens.filterByClusterSlug(CURRENT_NETWORK).getList();
    tokenList = tokenList
      .filter(tk => tk.address === address)
      .map(tk => {
        if (tk.address === address) {
          tk.amount = account.data.parsed.info.tokenAmount.uiAmount;
          return tk;
        }
      });
    return tokenList.length > 0 ? tokenList : [];
  });
};

export const showAllHoldings = async address => {
  console.log("ADD======", address);
  let connection = new web3.Connection(
    web3.clusterApiUrl(CURRENT_NETWORK),
    COMMITMENT
  );
  const accounts = await connection.getParsedProgramAccounts(
    splToken.TOKEN_PROGRAM_ID, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    {
      filters: [
        {
          dataSize: 165, // number of bytes
        },
        {
          memcmp: {
            offset: 32, // number of bytes
            bytes: new web3.PublicKey(address), // base58 encoded string
          },
        },
      ],
    }
  );

  if (accounts.length > 0) {
    let acc = await Promise.all(
      accounts.map(acc => {
        let tkInfo = fetchTokens(acc);
        return tkInfo;
      })
    );

    return acc.flat();
  } else {
    return accounts;
  }
};

export const fetchUsdRate = async symbol => {
  let usdRate;
  let tokenPrice = JSON.parse(localStorage.getItem(symbol));
  const now = new Date();

  if (tokenPrice && tokenPrice.expiry > now.getTime()) {
    console.log("FROM LOCAL=================");
    usdRate = Number(tokenPrice.data);
  } else {
    usdRate = await fetchRates(symbol);

    setDataWithExpiry(symbol, usdRate, USD_CACHE_TIME);
  }

  return usdRate;
};

export const fetchRates = async coinId => {
  const { data } = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
  );

  let id = coinId;

  return data.hasOwnProperty(id.toLowerCase()) ? data[id.toLowerCase()].usd : 0;
};

export const setDataWithExpiry = (key, data, expiry) => {
  const now = new Date();

  const item = {
    data,
    expiry: now.getTime() + expiry,
  };
  localStorage.setItem(key, JSON.stringify(item));
};
