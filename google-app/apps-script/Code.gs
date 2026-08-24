/**
 * Google Sheets sync for the META ERC-20 contract (meta.sol from carllaliberte/contract).
 *
 * Setup:
 * 1. Create a Google Sheet.
 * 2. Extensions → Apps Script → paste this file.
 * 3. Set CONTRACT_ADDRESS and RPC_URL below.
 * 4. Run createMenu, then use the "META Token" menu in the sheet.
 */

const CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const RPC_URL = 'https://hired-focal-quantum-departmental.trycloudflare.com';

const SELECTORS = {
  name: '06fdde03',
  symbol: '95d89b41',
  decimals: '313ce567',
  totalSupply: '18160ddd',
  totalFees: '13114a9d',
  owner: '8da5cb5b',
  _maxTxAmount: '7d1db4a5',
  transfertimeout: '7cada5bd',
  uniswapPair: 'c816841b',
  balanceOf: '70a08231',
  isExcluded: 'cba0e996',
};

function onOpen() {
  createMenu();
}

function createMenu() {
  SpreadsheetApp.getUi()
    .createMenu('META Token')
    .addItem('Refresh token overview', 'refreshTokenOverview')
    .addItem('Refresh wallet balances', 'refreshWalletBalances')
    .addToUi();
}

function refreshTokenOverview() {
  const sheet = getOrCreateSheet_('Token Overview');
  const name = callContract_('name');
  const symbol = callContract_('symbol');
  const decimals = Number(callContract_('decimals'));
  const totalSupply = callContract_('totalSupply');
  const totalFees = callContract_('totalFees');
  const owner = callContract_('owner');
  const maxTxAmount = callContract_('_maxTxAmount');
  const transferTimeout = callContract_('transfertimeout');
  const uniswapPair = callContract_('uniswapPair');

  sheet.clear();
  const rows = [
    ['Field', 'Value'],
    ['Contract', CONTRACT_ADDRESS],
    ['RPC URL', RPC_URL],
    ['Name', name],
    ['Symbol', symbol],
    ['Decimals', decimals],
    ['Total supply', formatUnits_(totalSupply, decimals)],
    ['Total fees', formatUnits_(totalFees, decimals)],
    ['Owner', owner],
    ['Max tx amount', formatUnits_(maxTxAmount, decimals)],
    ['Sell lock (seconds)', Number(transferTimeout)],
    ['Uniswap pair', uniswapPair],
    ['Last updated', new Date()],
  ];

  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
}

function refreshWalletBalances() {
  const sheet = getOrCreateSheet_('Wallet Balances');
  const addresses = sheet.getRange('A2:A').getValues()
    .map((row) => String(row[0]).trim())
    .filter((value) => value.length > 0);

  if (addresses.length === 0) {
    SpreadsheetApp.getUi().alert('Add wallet addresses in column A starting at row 2.');
    return;
  }

  const decimals = Number(callContract_('decimals'));
  sheet.getRange(1, 1, 1, 3).setValues([['Wallet', 'Balance', 'Excluded']]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold');

  const rows = addresses.map((address) => {
    const balance = callContract_('balanceOf', address);
    const excluded = callContract_('isExcluded', address);
    return [address, formatUnits_(balance, decimals), Boolean(excluded)];
  });

  const existingRows = sheet.getMaxRows() - 1;
  if (existingRows > 0) {
    sheet.getRange(2, 1, existingRows, 3).clearContent();
  }

  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
}

function callContract_(functionName, addressArg) {
  let data = '0x' + SELECTORS[functionName];
  if (addressArg) {
    data += encodeAddress_(addressArg);
  }

  const response = UrlFetchApp.fetch(RPC_URL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to: CONTRACT_ADDRESS, data }, 'latest'],
    }),
    muteHttpExceptions: true,
  });

  const body = JSON.parse(response.getContentText());
  if (body.error) {
    throw new Error(body.error.message || 'RPC call failed');
  }

  return decodeReturn_(functionName, body.result);
}

function decodeReturn_(functionName, hexResult) {
  const hex = stripHexPrefix_(hexResult || '0x');
  if (!hex) {
    return functionName === 'name' || functionName === 'symbol' ? '' : '0';
  }

  if (functionName === 'name' || functionName === 'symbol') {
    return decodeString_(hex);
  }

  if (functionName === 'decimals' || functionName === 'transfertimeout') {
    return BigInt('0x' + hex.slice(0, 64)).toString();
  }

  if (functionName === 'isExcluded') {
    return hex.slice(0, 64) !== padLeft_('0', 64);
  }

  if (functionName === 'owner' || functionName === 'uniswapPair') {
    return '0x' + hex.slice(24, 64);
  }

  return BigInt('0x' + hex.slice(0, 64)).toString();
}

function decodeString_(hex) {
  const length = Number(BigInt('0x' + hex.slice(64, 128)));
  const start = 128;
  const raw = hex.slice(start, start + length * 2);
  const chars = [];

  for (let i = 0; i < raw.length; i += 2) {
    chars.push(String.fromCharCode(parseInt(raw.slice(i, i + 2), 16)));
  }

  return chars.join('');
}

function encodeAddress_(address) {
  return padLeft_(stripHexPrefix_(address), 64);
}

function formatUnits_(value, decimals) {
  const raw = BigInt(value);
  const base = BigInt(10) ** BigInt(decimals);
  const whole = raw / base;
  const fraction = raw % base;

  if (fraction === BigInt(0)) {
    return whole.toString();
  }

  const fractionText = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return whole.toString() + '.' + fractionText;
}

function getOrCreateSheet_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function stripHexPrefix_(value) {
  return String(value).replace(/^0x/i, '');
}

function padLeft_(value, length) {
  return value.padStart(length, '0');
}
