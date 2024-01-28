import {
  PublicKey,
  Transaction,
  Connection
} from "@solana/web3.js";
export type PhantomEvent = "disconnect" | "connect" | "accountChanged";

export interface ConnectOpts {
  onlyIfTrusted: boolean;
}

export interface PhantomProvider {
  connect: (opts?: ConnectOpts) => Promise<Connection>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (
    transaction: Transaction
  ) => Promise<{ signature: string }>;
  on: (event: PhantomEvent, callback: (args: any) => void) => void;
  isPhantom: boolean;
}
export interface Token {
  tokenSymbol: string;
  mintAddress: string;
  tokenName: string;
  tokenPoolAccountAddress: string;
  
}
export type WindowWithSolana = Window & {
  solana: PhantomProvider;
};