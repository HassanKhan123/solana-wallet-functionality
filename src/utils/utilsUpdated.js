import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import crypto from "crypto-js";
import * as Bip39 from "bip39";
import * as web3 from "@solana/web3.js";

import {
  COMMITMENT,
  CURRENT_NETWORK,
  OPEN_IN_WEB,
  STORAGE,
} from "../constants";
import { TokenListProvider } from "@solana/spl-token-registry";
import * as splToken from "@solana/spl-token";

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

export const initialTasks = async currentWalletName => {
  let userInfo = await getStorageSyncValue("userInfo");
  let accountsList = userInfo[currentWalletName]["accounts"];
  let firstUser = accountsList[Object.keys(accountsList)[0]];

  let encData = firstUser.data;
  let hashedPassword = await getStorageSyncValue("hashedPassword");
  const mnemonic = await decryptMessage(encData, hashedPassword);

  const secret = await decryptMessage(firstUser.secretKey, hashedPassword);
  const seed = Bip39.mnemonicToSeedSync(mnemonic).slice(0, 32);
  const importedAccount = web3.Keypair.fromSeed(seed);

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

  // let response = await connection.getTokenAccountsByOwner(
  //   new web3.PublicKey(account.publicKey), // owner here
  //   {
  //     programId: TOKEN_PROGRAM_ID,
  //   }
  // );
  // response.value.forEach(e => {
  //   console.log(`pubkey: ${e.pubkey.toBase58()}`);
  //   const accountInfo = splToken.AccountLayout.decode(e.account.data);
  //   console.log(`mint: ${new web3.PublicKey(accountInfo.mint)}`);
  //   console.log(
  //     `amount: ${splToken.u64.fromBuffer(accountInfo.amount)}`,
  //     accountInfo
  //   );
  // });
};
