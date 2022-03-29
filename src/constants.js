/*global chrome*/

export const CURRENTLY_IN_DEVELOPMENT = true;

export const OPEN_IN_WEB = chrome.storage ? false : true;

export const STORAGE = OPEN_IN_WEB ? undefined : chrome.storage.sync;

export const LOCAL_SERVER_URL = "http://localhost:5000";
export const CACHE_TIME = 60000;
export const USD_CACHE_TIME = 120000;
export const CURRENT_NETWORK = "devnet";
export const COMMITMENT = "confirmed";
export const SOLANA_SYMBOL = "solana";
