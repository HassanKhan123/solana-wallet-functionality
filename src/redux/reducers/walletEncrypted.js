import {
  CREATE_WALLET,
  CREATE_WALLET_ENCRYPTED,
  IMPORT_WALLET,
  REMOVE_MNEMONIC,
  SET_CURRENT_WALLET_NAME,
  SHOW_ALL_CUSTOM_TOKENS,
  SWITCH_ACCOUNT,
} from "../actionTypes";

const initialState = {
  walletEncrypted: null,
  wallet: null,
  currentWalletName: "wallet1",
  allTokens: [{ name: "Solana", symbol: "SOL" }],
  activeAccount: {},
};

export default function (state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case CREATE_WALLET:
      return {
        ...state,
        wallet: {
          ...state.wallet,
          ...payload,
        },
      };
    case CREATE_WALLET_ENCRYPTED:
      return {
        ...state,
        walletEncrypted: {
          ...state.walletEncrypted,
          ...payload,
        },
      };

    case IMPORT_WALLET:
      return {
        ...state,
        walletEncrypted: {
          ...state.walletEncrypted,
          ...payload,
        },
      };

    case REMOVE_MNEMONIC:
      return {
        ...state,
        wallet: {
          ...state.walletEncrypted,
          mnemonic: null,
        },
      };

    case SET_CURRENT_WALLET_NAME:
      return {
        ...state,
        currentWalletName: payload,
      };

    case SHOW_ALL_CUSTOM_TOKENS:
      return {
        ...state,
        allTokens: payload,
      };

    case SWITCH_ACCOUNT:
      return {
        ...state,
        activeAccount: { ...payload },
      };

    default:
      return state;
  }
}
