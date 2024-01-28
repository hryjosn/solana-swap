import { makeAutoObservable, runInAction, autorun } from "mobx";
import { PhantomProvider, Token } from "./type";
import { TokenSwap, TOKEN_SWAP_PROGRAM_ID } from "@solana/spl-token-swap";
import { PublicKey, Transaction, Connection } from "@solana/web3.js";
import * as token from "@solana/spl-token";
import {
  feeAccount,
  poolTokenMint,
  swapAuthority,
  tokenAPoolAccount,
  tokenBPoolAccount,
  tokenSwapStateAccount,
} from "~/utils/constants";
import tokenList from "~/app/tokenList.json";

class HomeStore {
  isPhantomAvailable = false;
  provider: PhantomProvider | null = null;
  connected = false;
  pubKey: PublicKey | null = null;
  swapTokenAmountInOut: string[] = ["0", "0"];
  payToken: Token = tokenList["devnet"][0];
  receiveToken: Token = tokenList["devnet"][1];
  receiveBalance: number = 0;
  payBalance: number = 0;
  exchangeRate: number = 0;
  isLoading: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  setExchangeRate = async () => {
    this.isLoading = true;

    const baseTokenAmount = await this.getTokenAccountBalance(
      this.payToken.tokenPoolAccountAddress
    );
    const quoteTokenAmount = await this.getTokenAccountBalance(
      this.receiveToken.tokenPoolAccountAddress
    );

    this.exchangeRate = Number(quoteTokenAmount) / Number(baseTokenAmount);
    this.isLoading = false;
  };

  getTokenAccountBalance = async (tokenAccountAddress: string) => {
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );

    const accountBalance = (
      await connection.getTokenAccountBalance(
        new PublicKey(tokenAccountAddress)
      )
    ).value.amount;

    return accountBalance;
  };

  swapToken = async () => {
    try {
      const transaction = new Transaction();
      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );

      const tokenA = new PublicKey(this.payToken.mintAddress);
      const tokenB = new PublicKey(this.receiveToken.mintAddress);

      const tokenAATA = await token.getAssociatedTokenAddress(
        tokenA,
        this.pubKey!
      );

      const tokenBATA = await token.getAssociatedTokenAddress(
        tokenB,
        this.pubKey!
      );

      const mintTokenAccInfo = await connection.getParsedAccountInfo(tokenA);
      const tokenDecimals = (mintTokenAccInfo.value?.data as any)?.parsed.info
        .decimals;

      const swapInstruction = this.getSwapInstruction(
        tokenAATA,
        tokenBATA,
        tokenDecimals
      );

      transaction.add(swapInstruction);

      transaction.recentBlockhash = (
        await connection.getLatestBlockhash("finalized")
      ).blockhash;
      transaction.feePayer = this.pubKey!;

      const tx = await this.provider!.signAndSendTransaction(transaction);
      console.log(
        "tx",
        `https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`
      );
      alert(
        `Transaction submitted: https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`
      );
      this.swapTokenAmountInOut = ["0", "0"];
    } catch (e) {
      console.error(Object.entries(e));
    }
  };

  getSwapInstruction(
    tokenAATA: PublicKey,
    tokenBATA: PublicKey,
    tokenDecimals: number
  ) {
    return TokenSwap.swapInstruction(
      tokenSwapStateAccount,
      swapAuthority,
      this.pubKey!,
      tokenAATA,
      tokenAPoolAccount,
      tokenBPoolAccount,
      tokenBATA,
      poolTokenMint!,
      feeAccount,
      null,
      TOKEN_SWAP_PROGRAM_ID,
      token.TOKEN_PROGRAM_ID,
      Number(this.swapTokenAmountInOut[0]) * 10 ** tokenDecimals,
      0
    );
  }
}

export default HomeStore;
