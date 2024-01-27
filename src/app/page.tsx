"use client";
import { observer } from "mobx-react-lite";

import Button from "@mui/material/Button";
import { useEffect, useState } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import tokenList from "./tokenList.json";
import { rootStore } from "~/store";
import {
  PhantomEvent,
  ConnectOpts,
  PhantomProvider,
  WindowWithSolana,
  Token,
} from "~/store/HomeStore/type";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
const Home = () => {
  const programId = new PublicKey(
    "7pDaTAQ5ahvmZJShgkRmkaVsMzTnemhW4uvCrApkjtKK"
  );
  const { homeStore } = rootStore;
  const {
    payBalance,
    receiveBalance,

    isPhantomAvailable,
    provider,
    connected,
    payAmount,
    payToken,
    tokenDecimal,
    poolWalletSolAddr,
    receiveAmount,
    receiveToken,
  } = homeStore;
  const getPoolWalletTokenAddr = async (mintAccToken: PublicKey) => {
    let [poolWalletToken, poolWalletBump] = findProgramAddressSync(
      [Buffer.from("wallet"), mintAccToken.toBuffer()],
      new web3.PublicKey(PROGRAM_ID)
    );
    return [poolWalletToken, poolWalletBump];
  };
  useEffect(() => {
    if ("solana" in window) {
      const solWindow = window as WindowWithSolana;
      if (solWindow?.solana?.isPhantom) {
        homeStore.provider = solWindow.solana;

        solWindow.solana?.on("connect", async (publicKey: PublicKey) => {
          homeStore.connected = true;
          homeStore.pubKey = publicKey;
          console.log("publicKey>", publicKey);
          const connection = await connectWallet();
          const balance = await connection.getBalance(publicKey!);
          const mintTokenAcc = new PublicKey(receiveToken);
          const userTokenAcc = await getAssociatedTokenAddress(
            mintTokenAcc,
            publicKey!,
            true,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );
          const mintTokenAccInfo = await connection.getParsedAccountInfo(
            mintTokenAcc
          );
          const decimals = (mintTokenAccInfo.value?.data as any)?.parsed.info
            .decimals;
          homeStore.tokenDecimal = decimals;
          const poolBalance = await connection.getBalance(programId);
          console.log("poolBalance>", poolBalance);

          const res = await getAccount(
            connection,
            new PublicKey("8zgM6YR3QVcrE6mnNR5jsee71syZVbott5c3vw8uWtmp")
          );

          console.log(
            "res>",
            Number(res.amount) / Math.pow(10, Number(decimals))
          );

          homeStore.payBalance = balance;
          homeStore.receiveBalance =
            Number((await getAccount(connection, userTokenAcc)).amount) /
            Math.pow(10, Number(decimals));
        });
        solWindow.solana?.on("disconnect", () => {
          console.log("disconnect event");
          homeStore.connected = false;
          homeStore.pubKey = null;
        });
        homeStore.isPhantomAvailable = true;
        // Attemp an eager connection
        solWindow.solana.connect({ onlyIfTrusted: true });
      }
    }
  }, []);

  const connectHandler: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    console.log(`connect handler`);
    provider?.connect().catch((err) => {
      console.error("connect ERROR:", err);
    });
  };

  const disconnectHandler: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    console.log("disconnect handler");
    provider?.disconnect().catch((err) => {
      console.error("disconnect ERROR:", err);
    });
  };
  async function connectWallet(): Promise<Connection> {
    const connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );
    const version = await connection.getVersion();
    console.log("Connection to cluster established:", version);
    return connection;
  }
  const swap = async () => {
    console.log("swap");
    if ("solana" in window) {
      const solWindow = window as WindowWithSolana;

      const connection = await connectWallet();

      // const transaction = new Transaction();
      // const { signature } = await solWindow.solana.signAndSendTransaction(
      //   transaction
      // );
      // const res = await connection.getSignatureStatus(signature);
      // console.timeLog("res>", res);
    }
  };
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="border-2 p-1 rounded-lg border-black border-solid w-[480px]">
        <div className="bg-gray-300 rounded-lg py-3 px-2 mb-1">
          <div className="text-xs">
            You pay
            <span className="ml-2">
              (balance: {payBalance / Math.pow(10, 9)})
            </span>
          </div>
          <div className="flex">
            <input
              className="border-0 bg-transparent text-lg border-solid border-b-2 outline-none flex-1"
              value={payAmount}
              onChange={(e) => {
                homeStore.payAmount = e.target.value;
              }}
            />
            <FormControl variant="standard">
              <Select
                value={payToken}
                onChange={(e) => {
                  homeStore.payToken = e.target.value;
                }}
              >
                {tokenList["devnet"].map((token, index) => (
                  <MenuItem
                    key={`MenuItem_$${index}`}
                    value={token.mintAddress}
                  >
                    {token.tokenSymbol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>
        <div className="bg-gray-300 rounded-lg py-3 px-2 mb-1 flex-1">
          <div className="text-xs">You Receive: ({receiveBalance})</div>
          <div className="flex">
            <input
              className="border-0 bg-transparent text-lg border-solid border-b-2 outline-none flex-1"
              value={receiveAmount}
              onChange={(e) => {
                homeStore.receiveAmount = e.target.value;
              }}
            />
            <FormControl variant="standard">
              <Select
                value={receiveToken}
                onChange={(e) => {
                  homeStore.receiveToken = e.target.value;
                }}
              >
                {tokenList["devnet"].map((token, index) => (
                  <MenuItem
                    key={`MenuItem_$${index}`}
                    value={token.mintAddress}
                  >
                    {token.tokenSymbol}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>
        {isPhantomAvailable ? (
          <>
            {connected ? (
              <div className="mb-1">
                <Button
                  variant="contained"
                  color="primary"
                  className="w-full"
                  // disabled={connected}
                  onClick={() => {
                    swap();
                  }}
                >
                  Swap
                </Button>
              </div>
            ) : (
              <Button
                variant="contained"
                color="primary"
                className="w-full"
                disabled={connected}
                onClick={connectHandler}
              >
                Connect to Phantom
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              className="w-full"
              disabled={!connected}
              onClick={disconnectHandler}
            >
              Disconnect from Phantom
            </Button>
          </>
        ) : (
          <>
            <p>
              Opps!!! Phantom is not available. Go get it{" "}
              <a href="https://phantom.app/">https://phantom.app/</a>.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
export default observer(Home);
