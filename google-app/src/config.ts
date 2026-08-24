export const DEFAULT_RPC_URL = 'https://hired-focal-quantum-departmental.trycloudflare.com'

export const DEFAULT_CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'

export function getRpcUrl(): string {
  return import.meta.env.VITE_RPC_URL?.trim() || DEFAULT_RPC_URL
}

export function getContractAddress(): string {
  return import.meta.env.VITE_CONTRACT_ADDRESS?.trim() || DEFAULT_CONTRACT_ADDRESS
}
